import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ====================
// Player Research APIs
// ====================

import { Player, PlayerSearchFilters } from '../types/player';

export interface SearchPlayersResponse {
  players: Player[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Search and filter players
 */
export const searchPlayers = async (
  filters: PlayerSearchFilters,
  page: number = 1,
  limit: number = 50
): Promise<SearchPlayersResponse> => {
  const params: any = {
    page,
    limit,
  };

  if (filters.position && filters.position.length > 0) {
    params.position = filters.position;
  }

  if (filters.team && filters.team.length > 0) {
    params.team = filters.team;
  }

  if (filters.status) {
    params.status = filters.status;
  }

  if (filters.season) {
    params.season = filters.season;
  }

  if (filters.dateFrom) {
    params.dateFrom = filters.dateFrom;
  }

  if (filters.dateTo) {
    params.dateTo = filters.dateTo;
  }

  const response = await api.get('/players', { params });
  return response.data;
};

/**
 * Get player details by ID
 */
export const getPlayerById = async (id: string): Promise<Player> => {
  const response = await api.get(`/players/${id}`);
  return response.data;
};

/**
 * Get list of unique teams for filter dropdown
 */
export const getTeams = async (): Promise<string[]> => {
  const response = await api.get('/players/filters/teams');
  return response.data;
};

/**
 * Get list of unique positions for filter dropdown
 */
export const getPositions = async (): Promise<string[]> => {
  const response = await api.get('/players/filters/positions');
  return response.data;
};

export default api;
