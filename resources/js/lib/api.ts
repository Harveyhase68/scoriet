// resources/js/lib/api.ts
import { getRefreshToken, setTokens } from '@/utils/auth';
import { ApiEnvelopeError } from '@/types/api';

type DisplayState = 'enabled' | 'disabled' | 'grayed' | 'invisible' | 'excluded';
type GenerationMode = 'full' | 'code_only' | 'template_only' | 'reference_only' | 'excluded';

interface SchemaTable {
  id: number;
  table_name: string;
  singular_name?: string;
  comment?: string;
  primarykeyfield?: string;
  filekeyname?: string;
  file_name_renamed?: string;
  file_name_short?: string;
  schema_version_id?: number;
  display_state?: DisplayState;
  generation_mode?: GenerationMode;
  version?: number;
  created_by_username?: string;
  updated_by_username?: string;
  created_at?: string;
  updated_at?: string;
  fields: SchemaField[];
  constraints: SchemaConstraint[];
}

interface SchemaField {
  id: number;
  field_name: string;
  field_type: string;
  field_length?: number | null;
  // Structured type args (post-May-2026 migration). Templates and the table
  // editor read these directly instead of re-parsing field_type.
  field_precision?: number | null;
  field_scale?: number | null;
  field_enum_values?: string[] | null;
  is_nullable: boolean;
  is_auto_increment: boolean;
  is_unsigned?: boolean;
  is_primary_key?: boolean;
  is_index?: boolean;
  is_unique?: boolean;
  default_value?: string;
  comment?: string;
  extra?: string;
  control_type?: string;
  link_table?: string;
  link_field?: string;
  link_display_field?: string;
  link_order_field?: string;
  link_order_direction?: string;
  editmask?: string;
  is_generated?: boolean;
  generation_expression?: string;
  generation_storage?: 'stored' | 'virtual' | null;
  display_state?: DisplayState;
  generation_mode?: GenerationMode;
  version?: number;
  created_by_username?: string;
  updated_by_username?: string;
  created_at?: string;
  updated_at?: string;
}

interface SchemaConstraint {
  id: number;
  constraint_name?: string;
  constraint_type: 'PRIMARY KEY' | 'UNIQUE' | 'KEY' | 'FOREIGN KEY' | 'INDEX';
  columns: SchemaField[];
  foreign_key_reference?: {
    referenced_table: SchemaTable;
    referenced_columns: SchemaField[];
  };
}

interface SchemaVersion {
  id: number;
  version_name: string;
  description?: string;
  created_at: string;
  tables: SchemaTable[];
}

class ApiClient {
  private baseURL = '/api';

  // Singleton lock: when several requests get 401 in parallel, only one
  // of them performs the refresh; the others await the same Promise.
  private refreshPromise: Promise<string | null> | null = null;

  private async getAuthToken(): Promise<string | null> {
    // First check localStorage (Remember Me)
    let token = localStorage.getItem('access_token');
    if (token) return token;
    
    // Then check sessionStorage (only for current session)
    token = sessionStorage.getItem('access_token');
    if (token) return token;
    
    return null;
  }

  private async isTokenValid(): Promise<boolean> {
    const token = await this.getAuthToken();
    if (!token) return false;

    try {
      const response = await fetch(`${this.baseURL}/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Exchange the stored refresh_token for a new access_token + refresh_token
   * pair via the OAuth2 refresh_token grant. Returns the new access token
   * on success, or null if no refresh token exists or the exchange failed.
   *
   * Uses a singleton lock: parallel callers share the same in-flight Promise
   * so the backend only sees one refresh request even if many requests get
   * 401 at the same moment.
   */
  private async refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) return null;

        const clientId = import.meta.env.VITE_PASSPORT_CLIENT_ID || '1';
        const clientSecret = import.meta.env.VITE_PASSPORT_CLIENT_SECRET || '';

        const response = await fetch(`${this.baseURL}/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
          }),
        });

        if (!response.ok) return null;

        const data = await response.json();
        if (!data?.access_token) return null;

        // Refresh-token rotation: store the new pair in the same storage
        setTokens(data.access_token, data.refresh_token ?? null);

        return data.access_token as string;
      } catch {
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Public 401 handler for direct fetch() callers that aren't yet migrated
   * to apiClient.request(). The flow is:
   *   1. Skip if a logout is already in progress (don't interfere).
   *   2. Try a refresh - the singleton lock ensures parallel callers all
   *      share one in-flight refresh request, so the backend only sees one
   *      grant_type=refresh_token call no matter how many fetches got 401.
   *   3. If refresh succeeds, return true so the caller knows the next
   *      request will work.
   *   4. If refresh fails, run the same handleAuthError cleanup that
   *      apiClient.request() uses (clears tokens, dispatches the
   *      sessionForciblyEnded event exactly once) and return false.
   *
   * IMPORTANT: callers must NOT clear tokens themselves any more - this
   * method owns that responsibility now. Otherwise the refresh has nothing
   * to refresh with.
   */
  async tryRefreshOrLogout(): Promise<boolean> {
    if (localStorage.getItem('logout_in_progress')) {
      return false;
    }

    const newToken = await this.refreshAccessToken();
    if (newToken) {
      return true;
    }

    await this.handleAuthError();
    return false;
  }

  private async handleAuthError(): Promise<void> {
    // Check if we should notify about forced logout (only once per session)
    const alreadyNotified = sessionStorage.getItem('session_revoke_notified');
    const isLoggingOut = localStorage.getItem('logout_in_progress');

    // Clear invalid tokens from both storages
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('remember_me');

    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');

    // Clear remember me cookie
    document.cookie = 'remember_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    // Trigger storage event to update UI
    window.dispatchEvent(new Event('storage'));

    // Dispatch session forcibly ended event (for single-session enforcement)
    // Only notify once to avoid multiple notifications from concurrent API calls
    if (!alreadyNotified && !isLoggingOut) {
      sessionStorage.setItem('session_revoke_notified', 'true');
      window.dispatchEvent(new CustomEvent('sessionForciblyEnded', {
        detail: { reason: 'token_revoked' }
      }));
    }
  }

  async request(endpoint: string, options: RequestInit = {}, _isRetry: boolean = false): Promise<any> {
    const token = await this.getAuthToken();

    // If no token, throw authentication error immediately
    if (!token) {
      throw new Error('Authentication required - please login');
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // First 401: try to refresh the access token and retry once.
      // _isRetry guards against an infinite loop if the refreshed token
      // is also rejected (e.g. user got revoked server-side).
      if (!_isRetry) {
        const newToken = await this.refreshAccessToken();
        if (newToken) {
          return this.request(endpoint, options, true);
        }
      }

      // Refresh failed (or this was already the retry) - clean logout.
      await this.handleAuthError();
      throw new Error('Authentication expired - please log in again');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw { response: { status: response.status, data: errorData }, message: `API Error: ${response.status} ${response.statusText}` };
    }

    return response.json();
  }

  /**
   * Sibling of request() for the /cli/v1/* route group (routes/cli.php).
   *
   * Speaks the standard envelope contract — see
   * resources/js/types/api.ts + app/Http/Middleware/WrapApiEnvelope.php.
   *
   * Behaviour:
   *  - On success (2xx envelope): returns `data` directly. The legacy shape
   *    `{template: ...}` ends up wrapped to `{success, data: {template: ...}}`
   *    by the middleware, and unwrapped back to `{template: ...}` here, so
   *    existing call sites that read `result.template` continue to work
   *    without changes.
   *  - On error (4xx/5xx envelope): throws an ApiEnvelopeError carrying the
   *    structured `code`, `message`, `details`, and HTTP `status`. Catch
   *    handlers can branch on `err.code` (e.g. ApiErrorCode.CONFLICT) or
   *    fall back to `err.message`.
   *  - On 401: tries a token refresh once before giving up.
   *
   * Endpoint is everything AFTER /cli/v1 — e.g. cliRequest('/svc/tasks/active')
   * fetches /cli/v1/svc/tasks/active.
   *
   * Why a separate method rather than a baseURL parameter on request():
   * request() already has hundreds of call sites; adding a third arg would
   * either change every signature or sit in an awkward middle position.
   * A sibling method keeps both call surfaces self-documenting.
   */
  async cliRequest<T = any>(endpoint: string, options: RequestInit = {}, _isRetry: boolean = false): Promise<T> {
    const token = await this.getAuthToken();

    if (!token) {
      throw new Error('Authentication required - please login');
    }

    const response = await fetch(`/cli/v1${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      if (!_isRetry) {
        const newToken = await this.refreshAccessToken();
        if (newToken) {
          return this.cliRequest<T>(endpoint, options, true);
        }
      }
      await this.handleAuthError();
      throw new Error('Authentication expired - please log in again');
    }

    // Parse the envelope. We always try to read JSON even on non-2xx so
    // catch-handlers get the structured `error` block, not just an HTTP
    // status message.
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      // Prefer the envelope's structured error; fall back to a synthetic
      // one if the response wasn't envelope-shaped for some reason.
      const apiError = (body && typeof body === 'object' && (body as any).error)
        ? (body as any).error
        : { code: 'HTTP_ERROR', message: `CLI API Error: ${response.status} ${response.statusText}` };

      // We keep the legacy `{ response: { status, data } }` shape for
      // backwards compatibility with existing catch-handlers that read
      // `err.response.data.message`. New code should read `err.code` /
      // `err.message` / `err.details` from the ApiEnvelopeError directly.
      const error: any = new ApiEnvelopeError(apiError, response.status);
      error.response = { status: response.status, data: body ?? {} };
      throw error;
    }

    // Success envelope — unwrap and FLATTEN. We copy the envelope-level
    // `success: true` flag and every `meta.*` key back into the data
    // object so callers that still check `result.success`, `result.total`,
    // `result.message`, etc. continue working. Data keys win on collision.
    // Plain-data callers (e.g. `result.template`) are unaffected since
    // `data` is returned as-is plus the flatten extras.
    if (body && typeof body === 'object' && 'success' in body && (body as any).success === true && 'data' in body) {
      const envelope = body as any;
      const data = envelope.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const merged = { ...data, success: true };
        if (envelope.meta && typeof envelope.meta === 'object') {
          for (const k of Object.keys(envelope.meta)) {
            if (!(k in merged)) {
              merged[k] = envelope.meta[k];
            }
          }
        }
        return merged as T;
      }
      return data as T;
    }
    // Backwards path: if a response slipped past the middleware (shouldn't
    // happen on /cli/v1/*), return the body as-is rather than crash.
    return body as T;
  }

  // Generic HTTP methods for convenience
  async get(endpoint: string): Promise<any> {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string): Promise<any> {
    return this.request(endpoint, { method: 'DELETE' });
  }

  async patch(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async uploadFile(endpoint: string, formData: FormData, _isRetry: boolean = false): Promise<any> {
    const token = await this.getAuthToken();

    if (!token) {
      throw new Error('Authentication required - please login');
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        // Note: Don't set Content-Type for FormData - browser will set it with boundary
      },
      body: formData,
    });

    if (response.status === 401) {
      if (!_isRetry) {
        const newToken = await this.refreshAccessToken();
        if (newToken) {
          return this.uploadFile(endpoint, formData, true);
        }
      }

      await this.handleAuthError();
      throw new Error('Authentication expired - please log in again');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw { response: { status: response.status, data: errorData }, message: errorData.message || `API Error: ${response.status} ${response.statusText}` };
    }

    return response.json();
  }

  async getAllSchemaVersions(): Promise<SchemaVersion[]> {
    const response = await this.request('/schema-versions');
    return response.versions || [];
  }

  async getSchemaVersion(id: number): Promise<SchemaVersion | null> {
    try {
      const response = await this.request(`/schema-versions/${id}`);
      return response.schema_version;
    } catch {
      // Error fetching schema version
      return null;
    }
  }

  async getAllTemplates(filters?: {
    category?: string;
    search?: string;
    active_only?: boolean;
    project_id?: number;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.category && filters.category !== 'All') {
      params.append('category', filters.category);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.active_only) {
      params.append('active_only', 'true');
    }
    if (filters?.project_id) {
      params.append('project_id', filters.project_id.toString());
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/templates?${queryString}` : '/templates';
    
    const response = await this.request(endpoint);
    return response.templates || [];
  }

  async getProjectTemplates(schemaVersionId: number): Promise<any> {
    const response = await this.request(`/schema-versions/${schemaVersionId}/templates`);
    return response.project_templates || [];
  }

  async assignTemplatesToProject(schemaVersionId: number, templateIds: number[]): Promise<any> {
    return this.request(`/schema-versions/${schemaVersionId}/templates`, {
      method: 'POST',
      body: JSON.stringify({
        template_ids: templateIds,
        replace_existing: true, // Replace all existing assignments
      }),
    });
  }

  // Template CRUD methods
  async createTemplate(templateData: any): Promise<any> {
    try {
      const response = await this.request('/templates', {
        method: 'POST',
        body: JSON.stringify(templateData),
      });
      // API already returns { success: true, template: {...} }
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async updateTemplate(id: number, templateData: any): Promise<any> {
    try {
      const response = await this.request(`/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(templateData),
      });
      // API already returns { success: true, template: {...} }
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async deleteTemplate(id: number): Promise<any> {
    try {
      await this.request(`/templates/${id}`, {
        method: 'DELETE',
      });
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async hardDeleteTemplate(id: number): Promise<any> {
    try {
      await this.request(`/templates/${id}/force`, {
        method: 'DELETE',
      });
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async toggleTemplateActive(id: number): Promise<any> {
    try {
      const response = await this.request(`/templates/${id}/toggle`, {
        method: 'PATCH',
      });
      return {
        success: true,
        is_active: response.is_active
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async cloneTemplate(id: number, data: { name: string; visibility: string }): Promise<any> {
    try {
      const response = await this.request(`/templates/${id}/clone`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      // API already returns { success: true, template: {...} }
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if the current user already owns a template with this `name`.
   * Pass excludeId when editing an existing template so it doesn't false-
   * positive on itself.
   */
  async checkTemplateName(name: string, excludeId?: number): Promise<any> {
    try {
      const params = new URLSearchParams({ name });
      if (excludeId !== undefined && excludeId !== null) {
        params.set('exclude_id', String(excludeId));
      }
      const response = await this.request(`/templates/check-name?${params.toString()}`);
      return {
        exists: response.exists
      };
    } catch {
      return {
        exists: false
      };
    }
  }

  async getTemplate(id: number): Promise<any> {
    try {
      const response = await this.request(`/templates/${id}`);
      // API already returns { success: true, template: {...} }
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getTemplateLinkedProjects(templateId: number): Promise<any> {
    try {
      const response = await this.request(`/templates/${templateId}/linked-projects`);
      return {
        success: true,
        project_ids: response.project_ids || []
      };
    } catch (error) {
      return {
        success: false,
        project_ids: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async updateTemplateProjectLinks(templateId: number, projectIds: number[]): Promise<any> {
    const response = await this.request(`/templates/${templateId}/linked-projects`, {
      method: 'PUT',
      body: JSON.stringify({ project_ids: projectIds }),
    });
    return {
      success: true,
      ...response
    };
  }

  async exportTemplate(id: number): Promise<any> {
    try {
      const response = await this.request(`/templates/${id}/export`);
      return {
        success: true,
        export_data: response
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async importTemplate(templateData: any, overwriteExisting: boolean = false): Promise<any> {
    try {
      const response = await this.request('/templates/import', {
        method: 'POST',
        body: JSON.stringify({
          template_data: templateData,
          overwrite_existing: overwriteExisting,
        }),
      });
      return {
        success: true,
        template: response
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getCurrentUser(): Promise<any> {
    return this.request('/user');
  }

  async getUserProjects(): Promise<any[]> {
    try {
      const response = await this.request('/user/projects');
      const projects = response.projects || [];
      return projects;
    } catch {
      return [];
    }
  }

  async getProjectMembers(projectId: number): Promise<any[]> {
    try {
      const response = await this.request(`/projects/${projectId}/members`);
      return response.members || [];
    } catch {
      return [];
    }
  }

  async getProjectTeams(projectId: number): Promise<any[]> {
    try {
      if (!projectId) {
        return [];
      }

      const response = await this.request(`/projects/${projectId}/teams/assigned`);

      // The API returns the teams array directly, not wrapped in a teams property
      return Array.isArray(response) ? response : (response.teams || []);
    } catch {
      return [];
    }
  }

  async getProjectsWithTeams(): Promise<any[]> {
    try {
      const response = await this.request('/projects-with-teams');
      return response.projects || [];
    } catch {
      return [];
    }
  }

  async getTeamMembers(teamId: number): Promise<any[]> {
    try {
      if (!teamId) {
        return [];
      }

      const response = await this.request(`/teams/${teamId}/members`);
      return response.members || [];
    } catch {
      return [];
    }
  }

  async getAllProjects(): Promise<any[]> {
    try {
      const response = await this.request('/projects');
      return response.data || [];
    } catch {
      return [];
    }
  }

  async getProjectTemplateUsages(projectId: number): Promise<any[]> {
    try {
      if (!projectId) {
        return [];
      }

      const response = await this.request(`/projects/${projectId}/template-usages`);
      return response.usages || [];
    } catch {
      return [];
    }
  }

  async getProjectSchemas(projectId: number): Promise<any[]> {
    try {
      if (!projectId) {
        return [];
      }

      const response = await this.request(`/projects/${projectId}/schemas`);
      return response || [];
    } catch {
      return [];
    }
  }

  async getSchemaVersions(schemaId: number, _silent: boolean = false): Promise<any[]> {
    try {
      if (!schemaId) {
        return [];
      }

      const token = await this.getAuthToken();
      if (!token) {
        return [];
      }

      // Use fetch directly to avoid request() throwing/logging on 404
      const response = await fetch(`${this.baseURL}/floating-schemas/${schemaId}/versions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Silently return empty array for 404 (schema doesn't exist or no versions)
        return [];
      }

      return await response.json() || [];
    } catch {
      return [];
    }
  }

  async getVersionTables(versionId: number): Promise<any[]> {
    try {
      if (!versionId) {
        return [];
      }

      const response = await this.request(`/schema-versions/${versionId}/tables`);
      return response || [];
    } catch {
      return [];
    }
  }

  async getProjectGenerationTree(projectId: number): Promise<any> {
    try {
      if (!projectId) {
        return null;
      }

      const response = await this.request(`/projects/${projectId}/generation-tree`);
      return response || null;
    } catch {
      return null;
    }
  }

  async checkGenerationTreeUpdates(projectId: number, since: string): Promise<any> {
    try {
      if (!projectId) {
        return null;
      }

      // Use fetch directly to avoid throwing on 404 (deleted projects)
      const token = await this.getAuthToken();
      if (!token) return null;

      const response = await fetch(`${this.baseURL}/projects/${projectId}/generation-tree/updates?since=${encodeURIComponent(since)}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      // Silently ignore 404 (project deleted or no tree yet)
      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch {
      return null;
    }
  }

  // Public API method for pricing (no auth required)
  async getPricing(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/pricing`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
      // Return fallback prices if API fails
      return {
        success: true,
        prices: {
          patron_annual: 34.90,
          patron_monthly: 49.90,
          credits_500: 9.90,
          credits_1000: 17.90,
          credits_2500: 29.90
        },
        currency: 'EUR',
        updated_at: new Date().toISOString()
      };
    }
  }

  // Template Variables API
  async getTemplateVariables(templateId: number): Promise<any> {
    try {
      const response = await this.request(`/templates/${templateId}/variables`);
      return {
        success: true,
        variables: response.variables || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async createTemplateVariable(templateId: number, data: any): Promise<any> {
    try {
      const response = await this.request(`/templates/${templateId}/variables`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return {
        success: true,
        variable: response
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async updateTemplateVariable(templateId: number, variableId: number, data: any): Promise<any> {
    try {
      const response = await this.request(`/templates/${templateId}/variables/${variableId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return {
        success: true,
        variable: response
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async deleteTemplateVariable(templateId: number, variableId: number): Promise<any> {
    try {
      await this.request(`/templates/${templateId}/variables/${variableId}`, {
        method: 'DELETE'
      });
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ========== Unlinked/Standalone Items for Navigation ==========

  /**
   * Get all teams OWNED by the current user (not teams where user is just a member)
   */
  async getAllUserTeams(): Promise<any[]> {
    try {
      const response = await this.request('/teams?all=true');
      // Only return owned_teams (teams the user created), not member_teams
      return response.owned_teams || [];
    } catch {
      return [];
    }
  }

  /**
   * Get user's own templates (not linked to any project)
   */
  async getMyTemplates(): Promise<any[]> {
    try {
      const response = await this.request('/templates/my-templates');
      return response.templates || response || [];
    } catch {
      return [];
    }
  }

  /**
   * Get all schemas OWNED by the user (not system schemas or shared ones)
   */
  async getAllUserSchemas(): Promise<any[]> {
    try {
      const response = await this.request('/schemas');
      const allSchemas = response.schemas || response || [];
      // Filter to only include schemas where user is the owner
      return allSchemas.filter((schema: any) => schema.is_owner === true);
    } catch {
      return [];
    }
  }

}

export const apiClient = new ApiClient();
export const api = apiClient; // Add this alias for backwards compatibility
export type { SchemaTable, SchemaField, SchemaConstraint, SchemaVersion, DisplayState, GenerationMode };

// Utility functions to access pricing data from localStorage
export const pricingUtils = {
  // Get pricing data from localStorage
  getPricingData(): { patron_annual: number; patron_monthly: number; credits_500: number; credits_1000: number; credits_2500: number } | null {
    try {
      const pricingData = localStorage.getItem('pricing_data');
      return pricingData ? JSON.parse(pricingData) : null;
    } catch {
      return null;
    }
  },

  // Get currency from localStorage
  getCurrency(): string {
    return localStorage.getItem('pricing_currency') || 'EUR';
  },

  // Get pricing timestamp from localStorage
  getTimestamp(): string | null {
    return localStorage.getItem('pricing_timestamp');
  },

  // Get individual price
  getPrice(plan: 'patron_annual' | 'patron_monthly' | 'credits_500' | 'credits_1000' | 'credits_2500'): number | null {
    const pricing = this.getPricingData();
    return pricing ? pricing[plan] : null;
  },

  // Check if pricing data is fresh (less than 10 minutes old)
  isDataFresh(): boolean {
    const timestamp = this.getTimestamp();
    if (!timestamp) return false;

    const storedTime = new Date(timestamp);
    const now = new Date();
    const minutesDiff = (now.getTime() - storedTime.getTime()) / (1000 * 60);

    return minutesDiff < 10;
  },

  // Force refresh pricing data
  async refreshPricingData(): Promise<boolean> {
    try {
      const pricingData = await apiClient.getPricing();

      if (pricingData.success) {
        localStorage.setItem('pricing_data', JSON.stringify(pricingData.prices));
        localStorage.setItem('pricing_currency', pricingData.currency || 'EUR');
        localStorage.setItem('pricing_timestamp', pricingData.updated_at || new Date().toISOString());
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  // Clear pricing cache
  clearCache(): void {
    localStorage.removeItem('pricing_data');
    localStorage.removeItem('pricing_timestamp');
    localStorage.removeItem('pricing_currency');
  }
};