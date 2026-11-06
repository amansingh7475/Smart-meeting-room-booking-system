import { useEffect, useState, useCallback } from 'react';
import { Room, RoomCode, DEFAULT_ROOMS } from './types';
import { useAppDispatch, useAppSelector } from './store';
import { fetchRooms } from './store/slices/roomsSlice';
import { fetchPaginatedBookings, fetchTimelineBookings } from './store/slices/bookingsSlice';
import {
  openBookingModal,
  closeBookingModal,
  openConcurrencyModal,
  closeConcurrencyModal,
  openStatsModal,
  closeStatsModal,
} from './store/slices/uiSlice';
import { Header } from './components/Header';
import { RoomCards } from './components/RoomCards';
import { TimelineGrid } from './components/TimelineGrid';
import { BookingModal } from './components/BookingModal';
import { ConcurrencySimulatorModal } from './components/ConcurrencySimulatorModal';
import { BookingsList } from './components/BookingsList';
import { StatsModal } from './components/StatsModal';
import { ShieldCheck, Sparkles, AlertCircle, Layers } from 'lucide-react';

export function App() {
  const dispatch = useAppDispatch();

  // Redux state
  const { rooms, loading: roomsLoading, error: roomsError } = useAppSelector((state) => state.rooms);
  const { allTimelineBookings, timelineLoading } = useAppSelector((state) => state.bookings);
  const {
    bookingModalOpen,
    concurrencyModalOpen,
    statsModalOpen,
    selectedRoomForBooking,
    selectedSlotDate,
  } = useAppSelector((state) => state.ui);

  // Selected date for schedule grid
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Global initial data loading via Redux
  const refreshAll = useCallback(() => {
    dispatch(fetchRooms());
    dispatch(fetchTimelineBookings());
    dispatch(fetchPaginatedBookings({ page: 1 }));
  }, [dispatch]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Modal open helpers
  const handleOpenBooking = (room?: Room, startTime?: Date) => {
    dispatch(
      openBookingModal({
        room,
        initialDate: startTime ? startTime.toISOString() : undefined,
      })
    );
  };

  const isGlobalLoading = roomsLoading || timelineLoading;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation */}
      <Header
        onOpenBooking={() => handleOpenBooking()}
        onOpenConcurrencyLab={() => dispatch(openConcurrencyModal())}
        onOpenStats={() => dispatch(openStatsModal())}
        onRefresh={refreshAll}
        isLoading={isGlobalLoading}
      />

      {/* Main Content Area - Fully responsive from 320px up to 2560px */}
      <main className="flex-1 max-w-7xl 2xl:max-w-[1700px] 3xl:max-w-[2100px] 4xl:max-w-[2450px] w-full mx-auto px-3 sm:px-6 lg:px-8 3xl:px-12 py-4 sm:py-8 space-y-6 sm:space-y-10">
        {/* Banner: Prototype Overview & Concurrency Guarantee */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 3xl:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-3xl 3xl:max-w-5xl">
            <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] sm:text-xs font-semibold border border-blue-400/30">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                <span>Zero Double-Booking Guarantee</span>
              </div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[11px] sm:text-xs font-semibold border border-purple-400/30">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Redux Toolkit + Headless UI + Axios Interceptors</span>
              </div>
            </div>

            <h2 className="text-xl sm:text-3xl 3xl:text-4xl 4xl:text-5xl font-extrabold tracking-tight">
              Co-Working Space Smart Meeting System
            </h2>
            <p className="mt-2 text-slate-300 text-xs sm:text-base 3xl:text-lg leading-relaxed">
              Equipped with 3 fixed meeting rooms: <strong className="text-blue-400">Blue Room</strong>,{' '}
              <strong className="text-rose-400">Red Room</strong>, and{' '}
              <strong className="text-amber-400">Yellow Room</strong>. Features strict race-condition
              mutual exclusion and atomic MongoDB verification to completely eliminate double bookings.
            </p>

            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4">
              <button
                onClick={() => handleOpenBooking()}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm 3xl:text-base shadow-md shadow-blue-500/30 transition-all text-center cursor-pointer"
              >
                <Sparkles className="w-4 h-4 3xl:w-5 3xl:h-5" />
                <span>Make a Reservation</span>
              </button>

              <button
                onClick={() => dispatch(openConcurrencyModal())}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm 3xl:text-base border border-white/20 transition-all backdrop-blur-xs text-center cursor-pointer"
              >
                <span>⚡ Simulate Concurrency Race Condition</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Error Notice if API is down */}
        {roomsError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Connection Warning:</strong> {roomsError}
              <p className="text-xs text-rose-700 mt-1">
                Make sure the backend API server is running on port 4000.
              </p>
            </div>
          </div>
        )}

        {/* Section 1: 3 Fixed Meeting Rooms Overview */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Fixed Meeting Rooms</h3>
              <p className="text-xs text-slate-500">Live occupancy and tech amenities</p>
            </div>
          </div>
          <RoomCards
            rooms={rooms}
            onSelectRoomToBook={(room) => handleOpenBooking(room)}
          />
        </section>

        {/* Section 2: Interactive 24-Hour Timetable Schedule Grid */}
        <section>
          <TimelineGrid
            rooms={rooms}
            bookings={allTimelineBookings}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onSlotClick={(room, startTime) => handleOpenBooking(room, startTime)}
          />
        </section>

        {/* Section 3: Booking Dashboard (Server-Side Paginated with Redux) */}
        <section>
          <BookingsList
            onOpenBookingForRoom={(roomCode: RoomCode) => {
              const r =
                rooms.find((x) => x.code === roomCode) ||
                DEFAULT_ROOMS.find((x) => x.code === roomCode);
              handleOpenBooking(r);
            }}
          />
        </section>
      </main>

      {/* Modals with Headless UI Dialogs */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => dispatch(closeBookingModal())}
        rooms={rooms}
        initialRoom={selectedRoomForBooking}
        initialStartTime={selectedSlotDate ? new Date(selectedSlotDate) : null}
        onBookingCreated={refreshAll}
      />

      <ConcurrencySimulatorModal
        isOpen={concurrencyModalOpen}
        onClose={() => dispatch(closeConcurrencyModal())}
        rooms={rooms}
        onTestComplete={refreshAll}
      />

      <StatsModal
        isOpen={statsModalOpen}
        onClose={() => dispatch(closeStatsModal())}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-8">
        <div className="max-w-7xl 2xl:max-w-[1700px] 3xl:max-w-[2100px] 4xl:max-w-[2450px] mx-auto px-4 sm:px-6 lg:px-8 3xl:px-12 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-slate-500 gap-4">
          <div>
            <p className="font-bold text-slate-700">
              CoSpace Smart Meeting Room Booking System
            </p>
            <p className="text-slate-400 mt-0.5 text-xs">
              MERN Stack • Redux Toolkit • Headless UI • Axios Interceptor • Server-Side Pagination
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center font-semibold text-slate-600">
              <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" />
              Blue • Red • Yellow Rooms
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
