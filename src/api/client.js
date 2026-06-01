import axios from 'axios';
import axiosRetry from 'axios-retry';

// Create a custom axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000, // Generous timeout for 2G/3G connections
});

// Autonomous axios-retry interceptor block optimized for low-bandwidth 2G/3G
axiosRetry(apiClient, {
  retries: 3, // Number of retry attempts
  retryDelay: (retryCount) => {
    // Exponential backoff strategy: 2s, 4s, 6s
    return retryCount * 2000;
  },
  retryCondition: (error) => {
    // Retry on network errors or 5xx server errors, common in unstable 2G/3G
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ECONNABORTED';
  },
});

export default apiClient;
