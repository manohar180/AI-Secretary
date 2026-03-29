import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 60000,
});

export const orchestratorApi = {
  getMetrics: async () => {
    try {
      const response = await api.get('/api/v1/metrics');
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get('/api/v1/settings/profile');
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  updateProfile: async (name, designation) => {
    try {
      const response = await api.post('/api/v1/settings/profile', { name, designation });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  testGoogleIntegration: async () => {
    try {
      const response = await api.get('/api/v1/integrations/google/test');
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  disconnectGoogle: async () => {
    try {
      const response = await api.delete('/api/v1/integrations/google');
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  syncInbox: async () => {
    try {
      const response = await api.post('/api/v1/workflow/sync-inbox');
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  getWorkflows: async () => {
    try {
      const response = await api.get('/api/v1/workflows');
      return response.data.tasks;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  approveTask: async (taskId) => {
    try {
      const response = await api.post(`/api/v1/workflows/${taskId}/approve`);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  updateTask: async (taskId, draftContent) => {
    try {
      const response = await api.put(`/api/v1/workflows/${taskId}`, { draftContent });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  discardTask: async (taskId) => {
    try {
      const response = await api.delete(`/api/v1/workflows/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  trashTask: async (taskId) => {
    try {
      const response = await api.delete(`/api/v1/workflows/${taskId}/gmail`);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  getActivityFeed: async () => {
    try {
      const response = await api.get('/api/v1/activity');
      return response.data.feed;
    } catch (error) {
      console.error('API Error:', error);
      return [];
    }
  }
};
