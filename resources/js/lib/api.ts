// resources/js/lib/api.ts
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
  fields: SchemaField[];
  constraints: SchemaConstraint[];
}

interface SchemaField {
  id: number;
  field_name: string;
  field_type: string;
  field_length?: number | null;
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
  display_state?: DisplayState;
  generation_mode?: GenerationMode;
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

  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
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
      await this.handleAuthError();
      throw new Error('Authentication expired - please log in again');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw { response: { status: response.status, data: errorData }, message: `API Error: ${response.status} ${response.statusText}` };
    }

    return response.json();
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

  async uploadFile(endpoint: string, formData: FormData): Promise<any> {
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

  async checkTemplateName(name: string): Promise<any> {
    try {
      const response = await this.request(`/templates/check-name?name=${encodeURIComponent(name)}`);
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