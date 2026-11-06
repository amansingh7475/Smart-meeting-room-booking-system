import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Booking, PaginationInfo } from '../../types';
import * as api from '../../api/client';
import { toast } from 'sonner';

export interface BookingsState {
  // Paginated bookings displayed in the Dashboard
  items: Booking[];
  // Complete list of bookings used by the 24h timeline
  allTimelineBookings: Booking[];
  // Server-side pagination state
  pagination: PaginationInfo;
  // Filters
  roomFilter: string; // 'all' | 'blue' | 'red' | 'yellow'
  statusFilter: string; // 'ALL' | 'CONFIRMED' | 'CANCELLED'
  searchQuery: string;
  // Status
  loading: boolean;
  timelineLoading: boolean;
  error: string | null;
}

const initialState: BookingsState = {
  items: [],
  allTimelineBookings: [],
  pagination: {
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
  roomFilter: 'all',
  statusFilter: 'ALL',
  searchQuery: '',
  loading: false,
  timelineLoading: false,
  error: null,
};

/**
 * Async Thunk: Fetch Paginated Bookings for Dashboard (Server-Side Pagination)
 */
export const fetchPaginatedBookings = createAsyncThunk(
  'bookings/fetchPaginatedBookings',
  async (
    params: {
      page?: number;
      limit?: number;
      roomCode?: string;
      search?: string;
      status?: string;
    } | undefined,
    { getState, rejectWithValue }
  ) => {
    try {
      const state = (getState() as any).bookings as BookingsState;
      const page = params?.page ?? state.pagination.page;
      const limit = params?.limit ?? state.pagination.limit;
      const roomCode = params?.roomCode ?? state.roomFilter;
      const search = params?.search ?? state.searchQuery;
      const status = params?.status ?? state.statusFilter;

      const res = await api.getPaginatedBookings({
        page,
        limit,
        roomCode: roomCode !== 'all' ? roomCode : undefined,
        search: search.trim() ? search.trim() : undefined,
        status: status !== 'ALL' ? status : undefined,
      });

      return {
        bookings: res.bookings,
        pagination: res.pagination ?? {
          page,
          limit,
          total: res.total,
          totalPages: Math.max(1, Math.ceil(res.total / limit)),
        },
      };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch bookings');
    }
  }
);

/**
 * Async Thunk: Fetch All Bookings (For 24-Hour Timeline Grid)
 */
export const fetchTimelineBookings = createAsyncThunk(
  'bookings/fetchTimelineBookings',
  async (dateStr: string | undefined = undefined, { rejectWithValue }) => {
    try {
      const bookings = await api.getBookings({ date: dateStr });
      return bookings;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch timeline bookings');
    }
  }
);

/**
 * Async Thunk: Cancel a Booking
 */
export const cancelBookingThunk = createAsyncThunk(
  'bookings/cancelBooking',
  async (bookingId: string, { dispatch, rejectWithValue }) => {
    try {
      const updated = await api.cancelBooking(bookingId);
      toast.success('Meeting Cancelled', {
        description: `Booking "${updated.title}" has been cancelled and the time slot is now free.`,
      });
      // Refresh both dashboard and timeline
      dispatch(fetchPaginatedBookings(undefined));
      dispatch(fetchTimelineBookings());
      return updated;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to cancel booking');
    }
  }
);

/**
 * Async Thunk: Create a Booking
 */
export const createBookingThunk = createAsyncThunk(
  'bookings/createBooking',
  async (data: api.CreateBookingData, { dispatch, rejectWithValue }) => {
    try {
      const created = await api.createBooking(data);
      toast.success('Room Reserved Successfully!', {
        description: `Confirmed reservation for "${created.title}" in ${created.roomCode.toUpperCase()} Room.`,
      });
      // Refresh dashboard and timeline
      dispatch(fetchPaginatedBookings({ page: 1 }));
      dispatch(fetchTimelineBookings());
      return created;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create booking');
    }
  }
);

export const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1; // Reset to page 1 on limit change
    },
    setRoomFilter: (state, action: PayloadAction<string>) => {
      state.roomFilter = action.payload;
      state.pagination.page = 1; // Reset to page 1 on filter change
    },
    setStatusFilter: (state, action: PayloadAction<string>) => {
      state.statusFilter = action.payload;
      state.pagination.page = 1;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.pagination.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // Paginated dashboard bookings
      .addCase(fetchPaginatedBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaginatedBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.bookings;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPaginatedBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Timeline bookings
      .addCase(fetchTimelineBookings.pending, (state) => {
        state.timelineLoading = true;
      })
      .addCase(fetchTimelineBookings.fulfilled, (state, action) => {
        state.timelineLoading = false;
        state.allTimelineBookings = action.payload;
      })
      .addCase(fetchTimelineBookings.rejected, (state) => {
        state.timelineLoading = false;
      });
  },
});

export const {
  setPage,
  setLimit,
  setRoomFilter,
  setStatusFilter,
  setSearchQuery,
} = bookingsSlice.actions;

export default bookingsSlice.reducer;
