import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token into requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bms_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response interceptor to unwrap backend { status: 'success', data: ... } structure
api.interceptors.response.use(
  (response) => {
    // If the response matches backend standard successful envelope
    if (response.data && response.data.status === 'success') {
      // Return the nested data if it exists, otherwise return the whole response data
      return response.data.data !== undefined ? response.data.data : response.data;
    }
    return response.data;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: async (nrp: string, password: string): Promise<any> => {
    const data = await api.post('/auth/login', { nrp, password });
    if (data && (data as any).accessToken) {
      localStorage.setItem('bms_token', (data as any).accessToken);
    }
    return data;
  },
  logout: () => {
    localStorage.removeItem('bms_token');
  },
  getMe: async (): Promise<any> => {
    return api.get('/auth/me') as any;
  },
};

export const userService = {
  list: async (page = 1, limit = 10): Promise<any> => {
    return api.get(`/users?page=${page}&limit=${limit}`) as any;
  },
  create: async (data: any): Promise<any> => {
    return api.post('/users', data) as any;
  },
  update: async (id: string, data: any): Promise<any> => {
    return api.put(`/users/${id}`, data) as any;
  },
  delete: async (id: string): Promise<any> => {
    return api.delete(`/users/${id}`) as any;
  },
};

export const unitService = {
  list: async (page = 1, limit = 10): Promise<any> => {
    return api.get(`/units?page=${page}&limit=${limit}`) as any;
  },
  create: async (data: any): Promise<any> => {
    return api.post('/units', data) as any;
  },
  update: async (id: string, data: any): Promise<any> => {
    return api.put(`/units/${id}`, data) as any;
  },
  delete: async (id: string): Promise<any> => {
    return api.delete(`/units/${id}`) as any;
  },
};

export const backlogService = {
  list: async (page = 1, limit = 10): Promise<any> => {
    return api.get(`/backlogs?page=${page}&limit=${limit}`) as any;
  },
  getById: async (id: string): Promise<any> => {
    return api.get(`/backlogs/${id}`) as any;
  },
  create: async (data: any): Promise<any> => {
    return api.post('/backlogs', data) as any;
  },
  approve: async (id: string): Promise<any> => {
    return api.post(`/backlogs/${id}/approve`) as any;
  },
  reject: async (id: string): Promise<any> => {
    return api.post(`/backlogs/${id}/reject`) as any;
  },
  startInstallation: async (id: string): Promise<any> => {
    return api.post(`/backlogs/${id}/installation`) as any;
  },
  complete: async (id: string, completionData: any): Promise<any> => {
    return api.post(`/backlogs/${id}/complete`, completionData) as any;
  },
  getParts: async (id: string): Promise<any> => {
    return api.get(`/backlogs/${id}/parts`) as any;
  },
  addPart: async (id: string, partData: any): Promise<any> => {
    return api.post(`/backlogs/${id}/parts`, partData) as any;
  },
  getPhotos: async (id: string): Promise<any> => {
    return api.get(`/backlogs/${id}/photos`) as any;
  },
  addPhoto: async (id: string, photoData: any): Promise<any> => {
    return api.post(`/backlogs/${id}/photos`, photoData) as any;
  },
  getHistory: async (id: string): Promise<any> => {
    return api.get(`/backlogs/${id}/history`) as any;
  },
  getCompletion: async (id: string): Promise<any> => {
    return api.get(`/backlogs/${id}/completion`) as any;
  },
};

export const workOrderService = {
  list: async (page = 1, limit = 10): Promise<any> => {
    return api.get(`/work-orders?page=${page}&limit=${limit}`) as any;
  },
  getById: async (id: string): Promise<any> => {
    return api.get(`/work-orders/${id}`) as any;
  },
  create: async (data: any): Promise<any> => {
    return api.post('/work-orders', data) as any;
  },
  updateOrdering: async (id: string, orderingProgress: number): Promise<any> => {
    return api.put(`/work-orders/${id}/ordering`, { orderingProgress }) as any;
  },
  setFullSupply: async (id: string): Promise<any> => {
    return api.post(`/work-orders/${id}/full-supply`) as any;
  },
};

export const notificationService = {
  list: async (): Promise<any> => {
    return api.get('/notifications') as any;
  },
  markAsRead: async (id: string): Promise<any> => {
    return api.patch(`/notifications/${id}/read`) as any;
  },
};

export default api;
