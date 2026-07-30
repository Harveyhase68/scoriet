class ApiClient {
  private baseURL = '/api';

  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: { status: response.status, data: errorData },
        message: errorData.message || `API Error: ${response.status} ${response.statusText}`,
      };
    }

    return response.json();
  }

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

  async postFormData(endpoint: string, formData: FormData): Promise<any> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: { status: response.status, data: errorData },
        message: errorData.message || `API Error: ${response.status} ${response.statusText}`,
      };
    }
    return response.json();
  }

  async putFormData(endpoint: string, formData: FormData): Promise<any> {
    formData.append('_method', 'PUT');
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: { status: response.status, data: errorData },
        message: errorData.message || `API Error: ${response.status} ${response.statusText}`,
      };
    }
    return response.json();
  }
}

export const apiClient = new ApiClient();
export const api = apiClient;
