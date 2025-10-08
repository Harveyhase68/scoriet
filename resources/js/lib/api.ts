// resources/js/lib/api.ts
interface SchemaTable {
  id: number;
  table_name: string;
  comment?: string;
  primarykeyfield?: string;
  filekeyname?: string;
  file_name_renamed?: string;
  file_name_short?: string;
  fields: SchemaField[];
  constraints: SchemaConstraint[];
}

interface SchemaField {
  id: number;
  field_name: string;
  field_type: string;
  is_nullable: boolean;
  is_auto_increment: boolean;
  is_primary_key?: boolean;
  is_index?: boolean;
  is_unique?: boolean;
  default_value?: string;
  comment?: string;
  extra?: string;
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

  async updateTemplate(id: number, templateData: any): Promise<any> {
    try {
      const response = await this.request(`/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(templateData),
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
      console.log('🔗 API: Fetching user projects from /user/projects');
      const response = await this.request('/user/projects');
      console.log('📡 API: User projects response:', response);
      console.log('📋 Project names from API:', (response.projects || []).map((p: any) => ({ id: p.id, name: p.name })));
      console.log('📊 Full response structure:', {
        projects_count: (response.projects || []).length,
        total_projects: response.total_projects,
        has_projects_array: !!response.projects,
        first_project_keys: response.projects?.[0] ? Object.keys(response.projects[0]) : 'No projects'
      });

      // Check if the API is returning generic names
      const projects = response.projects || [];
      const hasGenericNames = projects.some((p: any) =>
        p.name && (p.name.startsWith('Project ') && /^\d+$/.test(p.name.replace('Project ', '')))
      );

      if (hasGenericNames) {
        console.warn('⚠️ API returned generic project names! This suggests the database contains generic names instead of actual project names.');
        console.warn('🔍 Generic projects found:', projects.filter((p: any) =>
          p.name && (p.name.startsWith('Project ') && /^\d+$/.test(p.name.replace('Project ', '')))
        ));
      }

      return projects;
    } catch (error) {
      console.error('❌ API Error fetching user projects:', error);
      return [];
    }
  }

  async getProjectMembers(projectId: number): Promise<any[]> {
    try {
      const response = await this.request(`/projects/${projectId}/members`);
      return response.members || [];
    } catch (error) {
      console.error('Error fetching project members:', error);
      return [];
    }
  }

  async getProjectTeams(projectId: number): Promise<any[]> {
    try {
      if (!projectId) {
        console.warn('⚠️ API: getProjectTeams called with undefined projectId');
        return [];
      }
      
      console.log('🔗 API: Fetching teams for project:', projectId);
      const response = await this.request(`/projects/${projectId}/teams/assigned`);
      console.log('📡 API: Project teams response:', response);
      console.log('📡 API: Response structure:', {
        isArray: Array.isArray(response),
        hasTeamsProperty: 'teams' in response,
        keys: Object.keys(response)
      });
      
      // The API returns the teams array directly, not wrapped in a teams property
      return Array.isArray(response) ? response : (response.teams || []);
    } catch (error) {
      console.error('❌ API Error fetching project teams:', error);
      return [];
    }
  }

  async getProjectsWithTeams(): Promise<any[]> {
    try {
      console.log('🔗 API: Fetching projects with teams (optimized single query)');
      const response = await this.request('/projects-with-teams');
      console.log('📡 API: Projects with teams response:', response);
      console.log('📡 API: Response structure:', {
        hasProjectsProperty: 'projects' in response,
        projectsCount: response.projects?.length || 0,
        totalProjects: response.total_projects
      });
      
      return response.projects || [];
    } catch (error) {
      console.error('❌ API Error fetching projects with teams:', error);
      return [];
    }
  }

  async getTeamMembers(teamId: number): Promise<any[]> {
    try {
      if (!teamId) {
        console.warn('⚠️ API: getTeamMembers called with undefined teamId');
        return [];
      }
      
      console.log('🔗 API: Fetching members for team:', teamId);
      const response = await this.request(`/teams/${teamId}/members`);
      console.log('📡 API: Team members response:', response);
      return response.members || [];
    } catch (error) {
      console.error('❌ API Error fetching team members:', error);
      return [];
    }
  }

  async getAllProjects(): Promise<any[]> {
    try {
      const response = await this.request('/projects');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching all projects:', error);
      return [];
    }
  }

}

export const apiClient = new ApiClient();
export const api = apiClient; // Add this alias for backwards compatibility
export type { SchemaTable, SchemaField, SchemaConstraint, SchemaVersion };