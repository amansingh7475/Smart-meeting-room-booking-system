import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Room } from '../../types';

export interface UiState {
  bookingModalOpen: boolean;
  concurrencyModalOpen: boolean;
  statsModalOpen: boolean;
  selectedRoomForBooking: Room | null;
  selectedSlotDate: string | null;
}

const initialState: UiState = {
  bookingModalOpen: false,
  concurrencyModalOpen: false,
  statsModalOpen: false,
  selectedRoomForBooking: null,
  selectedSlotDate: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openBookingModal: (
      state,
      action: PayloadAction<{ room?: Room; initialDate?: string } | undefined>
    ) => {
      state.bookingModalOpen = true;
      state.selectedRoomForBooking = action?.payload?.room || null;
      state.selectedSlotDate = action?.payload?.initialDate || null;
    },
    closeBookingModal: (state) => {
      state.bookingModalOpen = false;
      state.selectedRoomForBooking = null;
      state.selectedSlotDate = null;
    },
    openConcurrencyModal: (state) => {
      state.concurrencyModalOpen = true;
    },
    closeConcurrencyModal: (state) => {
      state.concurrencyModalOpen = false;
    },
    openStatsModal: (state) => {
      state.statsModalOpen = true;
    },
    closeStatsModal: (state) => {
      state.statsModalOpen = false;
    },
  },
});

export const {
  openBookingModal,
  closeBookingModal,
  openConcurrencyModal,
  closeConcurrencyModal,
  openStatsModal,
  closeStatsModal,
} = uiSlice.actions;

export default uiSlice.reducer;
