/**
 * Usage examples for the ApiClient
 */

import { apiClient } from './api-client';

// Basic GET request
async function getUserData() {
  const result = await apiClient.get('/api/auth/me');
  if (result.ok) {
    console.log('User data:', result.data);
  } else {
    console.error('Error:', result.message);
  }
}

// GET with caching
async function getCachedGuilds() {
  const result = await apiClient.get('/api/guilds', {
    useCache: true,
    cacheTtl: 300000, // 5 minutes
  });
  return result;
}

// POST request
async function createGuild(data: { name: string; description: string }) {
  const result = await apiClient.post('/api/guilds', data);
  return result;
}

// PUT request
async function updateGuild(id: string, data: { name?: string; description?: string }) {
  const result = await apiClient.put(`/api/guilds/${id}`, data);
  return result;
}

// DELETE request
async function deleteGuild(id: string) {
  const result = await apiClient.delete(`/api/guilds/${id}`);
  return result;
}

// Custom request with retry configuration
async function makeResilientRequest() {
  const result = await apiClient.get('/api/health', {
    retries: 5,
    timeout: 5000,
    useCache: false,
  });
  return result;
}

// Using request interceptors for auth
apiClient.addRequestInterceptor((config) => {
  // Add custom headers if needed
  return {
    ...config,
    headers: {
      ...config.headers,
      'X-Custom-Header': 'value',
    },
  };
});

// Using response interceptors for logging
apiClient.addResponseInterceptor(async (response) => {
  console.log(`API Response: ${response.status} ${response.url}`);
  return response;
});

// Using error interceptors for custom error handling
apiClient.addErrorInterceptor(async (error) => {
  // Log errors to monitoring service
  console.error('API Error:', error);

  // Return modified error or original
  return error;
});

export {
  getUserData,
  getCachedGuilds,
  createGuild,
  updateGuild,
  deleteGuild,
  makeResilientRequest,
};
