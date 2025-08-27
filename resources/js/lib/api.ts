// resources/js/lib/api.ts
interface SchemaTable {
  id: number;
  table_name: string;
  fields: SchemaField[];
  constraints: SchemaConstraint[];
}

interface SchemaField {
  id: number;
  field_name: string;
  field_type: string;
  is_nullable: boolean;
  is_auto_increment: boolean;
  default_value?: string;
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
    
    // Could show login modal here or redirect
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAuthToken();
    
    // If no token, throw authentication error immediately
    if (!token) {
      throw new Error('Authentication required - please log in');
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
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
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
}

export const apiClient = new ApiClient();
export type { SchemaTable, SchemaField, SchemaConstraint, SchemaVersion };