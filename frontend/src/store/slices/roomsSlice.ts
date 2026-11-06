import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Room, DEFAULT_ROOMS } from '../../types';
import * as api from '../../api/client';

export interface RoomsState {
  rooms: Room[];
  loading: boolean;
  error: string | null;
}

const initialState: RoomsState = {
  rooms: DEFAULT_ROOMS,
  loading: false,
  error: null,
};

export const fetchRooms = createAsyncThunk('rooms/fetchRooms', async (_, { rejectWithValue }) => {
  try {
    const data = await api.getRooms();
    return data;
  } catch (err: any) {
    return rejectWithValue(err.message || 'Failed to fetch rooms');
  }
});

export const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    setRooms: (state, action: PayloadAction<Room[]>) => {
      state.rooms = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.length > 0) {
          state.rooms = action.payload;
        }
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setRooms } = roomsSlice.actions;
export default roomsSlice.reducer;
