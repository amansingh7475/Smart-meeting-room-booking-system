import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import {
  Room,
  Booking,
  AvailabilityResult,
  ConcurrencyResponse,
  PaginatedBookingsResponse,
  PaginationInfo,
} from '../types';

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: { startTime: number };
  }
}

/**
 * 1. Standard Axios Instance
 */
export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

/**
 * 2. REQUEST INTERCEPTOR
 * - Injects request timestamp
 * - Adds auth token if present
 * - Logs outgoing API calls in development
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.metadata = { startTime: Date.now() };

    // Example token injection (supports future auth expansion)
    const token = localStorage.getItem('coSpace_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if ((import.meta as any).env?.DEV) {
      console.log(
        `%c[API Request] ${config.method?.toUpperCase()} ${config.url}`,
        'color: #3b82f6; font-weight: bold;',
        config.params || config.data || ''
      );
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * 3. RESPONSE INTERCEPTOR
 * - Measures API latency
 * - Centralizes error handling (409 Double-Booking Conflict, 400 Validation, 500 Server, Network failure)
 * - Triggers rich Sonner toasts for conflicts and connection issues
 */
apiClient.interceptors.response.use(
  (response) => {
    const startTime = response.config.metadata?.startTime;
    const duration = startTime ? Date.now() - startTime : null;

    if ((import.meta as any).env?.DEV) {
      console.log(
        `%c[API Response] ${response.status} ${response.config.url} (${duration}ms)`,
        'color: #10b981; font-weight: bold;',
        response.data
      );
    }

    return response;
  },
  (error: AxiosError<{ success?: boolean; message?: string; error?: string; conflict?: any; details?: any[] }>) => {
    const status = error.response?.status;
    const errorData = error.response?.data;

    let userMessage = errorData?.message || errorData?.error || 'An unexpected error occurred';

    if (status === 409) {
      // Critical 409 Double-Booking Conflict
      userMessage = errorData?.message || 'Double-booking conflict: This room is already reserved for the selected time.';
      toast.error('Reservation Conflict (409)', {
        description: userMessage,
        duration: 5000,
      });
    } else if (status === 400) {
      // 400 Bad Request / Validation Error
      if (errorData?.details && Array.isArray(errorData.details)) {
        userMessage = errorData.details.map((d: any) => `${d.field}: ${d.message}`).join(', ');
      }
      toast.error('Validation Error (400)', {
        description: userMessage,
      });
    } else if (status === 404) {
      toast.error('Not Found (404)', {
        description: userMessage,
      });
    } else if (status === 500) {
      toast.error('Server Error (500)', {
        description: 'Failed to process request on backend. Please check server logs.',
      });
    } else if (error.code === 'ERR_NETWORK' || !error.response) {
      userMessage = 'Network connection refused. Ensure backend daemon is running on port 4000.';
      toast.error('Network Error', {
        description: userMessage,
      });
    }

    // Enhance error object
    const enhancedError = new Error(userMessage) as any;
    enhancedError.status = status;
    enhancedError.conflict = errorData?.conflict;
    enhancedError.details = errorData?.details;
    enhancedError.originalError = error;

    return Promise.reject(enhancedError);
  }
);

/**
 * 4. API Endpoints
 */

export const getRooms = async (): Promise<Room[]> => {
  const res = await apiClient.get<{ success: boolean; data: Room[] }>('/rooms');
  return res.data.data;
};

export interface GetBookingsParams {
  roomCode?: string;
  date?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetBookingsResponse {
  bookings: Booking[];
  pagination?: PaginationInfo;
  total: number;
}

export const getBookings = async (
  params?: GetBookingsParams
): Promise<Booking[]> => {
  const res = await apiClient.get<PaginatedBookingsResponse | { success: boolean; data: Booking[] }>('/bookings', {
    params,
  });
  return res.data.data;
};

export const getPaginatedBookings = async (
  params: GetBookingsParams
): Promise<GetBookingsResponse> => {
  const res = await apiClient.get<PaginatedBookingsResponse>('/bookings', {
    params,
  });

  return {
    bookings: res.data.data,
    total: res.data.total ?? res.data.data.length,
    pagination: res.data.pagination || {
      page: res.data.page ?? 1,
      limit: res.data.limit ?? 10,
      total: res.data.total ?? res.data.data.length,
      totalPages: res.data.totalPages ?? 1,
    },
  };
};

export interface CreateBookingData {
  roomId: string;
  userEmail?: string;
  organizerEmail?: string;
  organizerName?: string;
  title?: string;
  description?: string;
  attendeesCount?: number;
  startTime: string;
  endTime: string;
}

export const createBooking = async (data: CreateBookingData): Promise<Booking> => {
  const payload = {
    ...data,
    organizerEmail: data.userEmail || data.organizerEmail,
    title: data.title || 'Meeting',
  };
  const res = await apiClient.post<{ success: boolean; data: Booking; message: string }>('/bookings', payload);
  return res.data.data;
};

export const checkAvailability = async (params: {
  roomId: string;
  startTime: string;
  endTime: string;
}): Promise<AvailabilityResult> => {
  const res = await apiClient.get<{ success: boolean; data: AvailabilityResult }>('/bookings/check-availability', {
    params,
  });
  return res.data.data;
};

export const cancelBooking = async (bookingId: string): Promise<Booking> => {
  const res = await apiClient.patch<{ success: boolean; data: Booking; message: string }>(
    `/bookings/${bookingId}/cancel`
  );
  return res.data.data;
};

export const simulateConcurrency = async (data: {
  roomCode: string;
  attemptsCount: number;
}): Promise<ConcurrencyResponse> => {
  const res = await apiClient.post<ConcurrencyResponse>('/bookings/simulate-concurrency', data);
  return res.data;
};

export const getStats = async (): Promise<any> => {
  const res = await apiClient.get<{ success: boolean; data: any }>('/bookings/stats');
  return res.data.data;
};
