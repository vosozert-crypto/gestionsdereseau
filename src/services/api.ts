const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:4000');

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, token } = options;
    const authToken = token || this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.getToken()}`;
        const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });
        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(error.error || `HTTP ${retryResponse.status}`);
        }
        return retryResponse.json();
      }
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  // Auth
  async login(username: string, password: string) {
    const data = await this.request<{
      accessToken: string;
      refreshToken: string;
      user: { id: number; username: string; role: string; displayName: string };
    }>('/api/auth/login', { method: 'POST', body: { username, password } });

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  }

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST', body: { refreshToken: localStorage.getItem('refreshToken') } });
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  async getMe() {
    return this.request<{ id: number; username: string; role: string; displayName: string }>('/api/auth/me');
  }

  // Devices
  async getDevices(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ devices: any[]; pagination: any }>(`/api/devices?${query}`);
  }

  async getDevice(id: string) {
    return this.request<any>(`/api/devices/${id}`);
  }

  async createDevice(data: Record<string, unknown>) {
    return this.request<any>('/api/devices', { method: 'POST', body: data });
  }

  async updateDevice(id: string, data: Record<string, unknown>) {
    return this.request<any>(`/api/devices/${id}`, { method: 'PUT', body: data });
  }

  async deleteDevice(id: string) {
    return this.request<any>(`/api/devices/${id}`, { method: 'DELETE' });
  }

  async rebootDevice(id: string) {
    return this.request<any>(`/api/devices/${id}/reboot`, { method: 'POST' });
  }

  async importDevices(devices: Record<string, unknown>[]) {
    return this.request<any>('/api/devices/import', { method: 'POST', body: { devices } });
  }

  async clearDevices() {
    return this.request<any>('/api/devices/clear', { method: 'POST' });
  }

  // Dashboard
  async getDashboardKpi() {
    return this.request<any>('/api/dashboard/kpi');
  }

  // Logs
  async getLogs(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ logs: any[]; pagination: any }>(`/api/logs?${query}`);
  }

  async getLogStats() {
    return this.request<any>('/api/logs/stats');
  }

  // Ports
  async getPorts() {
    return this.request<{ ports: any[]; stats: any }>('/api/ports');
  }

  async getPort(number: number) {
    return this.request<any>(`/api/ports/${number}`);
  }

  // Scan
  async startScan(subnet?: string, startIp?: number, endIp?: number) {
    return this.request<any>('/api/scan', {
      method: 'POST',
      body: { subnet, startIp, endIp },
    });
  }

  async getScanStatus() {
    return this.request<{ active: boolean }>('/api/scan/status');
  }

  async importScannedDevices(devices: Record<string, unknown>[]) {
    return this.request<any>('/api/scan/import-discovered', { method: 'POST', body: { devices } });
  }

  async enrichDeviceWmi(deviceId: string) {
    return this.request<any>(`/api/scan/wmi-enrich/${deviceId}`, { method: 'POST' });
  }

  // Diagnostics
  async pingDevice(ip: string) {
    return this.request<{ output: string[]; reachable: boolean; latencyMs: number }>(`/api/diagnostics/ping`, {
      method: 'POST',
      body: { ip },
    });
  }
}

export const api = new ApiClient(API_BASE);
export { API_BASE };
