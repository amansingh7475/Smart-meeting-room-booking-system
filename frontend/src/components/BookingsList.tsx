import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Booking, RoomCode } from '../types';
import { formatDisplayDate, formatDisplayTime } from '../utils/date';
import { useAppDispatch, useAppSelector } from '../store';
import {
  fetchPaginatedBookings,
  cancelBookingThunk,
  setRoomFilter,
  setPage,
  setLimit,
  setSearchQuery,
} from '../store/slices/bookingsSlice';
import {
  Search,
  Ban,
  Mail,
  Clock,
  CheckCircle2,
  Loader2,
  Calendar,
  AlertTriangle,
  X,
  ArrowLeft,
  Zap,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface BookingsListProps {
  onOpenBookingForRoom?: (roomCode: RoomCode) => void;
}

export const BookingsList: React.FC<BookingsListProps> = ({
  onOpenBookingForRoom,
}) => {
  const dispatch = useAppDispatch();
  const {
    items: bookings,
    pagination,
    roomFilter,
    searchQuery,
    loading,
  } = useAppSelector((state) => state.bookings);

  // Local state for debounced search and cancel modal
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Initial load and filter synchronization
  useEffect(() => {
    dispatch(fetchPaginatedBookings({ page: 1 }));
  }, [dispatch]);

  // Debounced search handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        dispatch(setSearchQuery(localSearch));
        dispatch(fetchPaginatedBookings({ page: 1, search: localSearch }));
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, dispatch]);

  const handleRoomTabClick = (code: string) => {
    dispatch(setRoomFilter(code));
    dispatch(fetchPaginatedBookings({ page: 1, roomCode: code }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      dispatch(setPage(newPage));
      dispatch(fetchPaginatedBookings({ page: newPage }));
    }
  };

  const handleLimitChange = (newLimit: number) => {
    dispatch(setLimit(newLimit));
    dispatch(fetchPaginatedBookings({ page: 1, limit: newLimit }));
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    setIsCancelling(true);
    try {
      await dispatch(cancelBookingThunk(bookingToCancel._id)).unwrap();
      setBookingToCancel(null);
    } catch {
      // Handled via toast in interceptor & thunk
    } finally {
      setIsCancelling(false);
    }
  };

  const getRoomMeta = (code: RoomCode) => {
    switch (code) {
      case 'blue':
        return {
          name: 'Blue Room',
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          dot: 'bg-blue-600',
          border: 'border-l-4 border-l-blue-600',
        };
      case 'red':
        return {
          name: 'Red Room',
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
          dot: 'bg-rose-600',
          border: 'border-l-4 border-l-rose-600',
        };
      case 'yellow':
        return {
          name: 'Yellow Room',
          badge: 'bg-amber-100 text-amber-900 border-amber-200',
          dot: 'bg-amber-500',
          border: 'border-l-4 border-l-amber-500',
        };
      default:
        return {
          name: `${code} Room`,
          badge: 'bg-slate-100 text-slate-800 border-slate-200',
          dot: 'bg-slate-600',
          border: 'border-l-4 border-l-slate-400',
        };
    }
  };

  const startCount = pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endCount = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* 1. Dashboard Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/70">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-xl font-bold text-slate-900">
                Booking Dashboard
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Server-Side Paginated
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Select a room below to view existing confirmed bookings, time ranges, and user emails
            </p>
          </div>

          {/* Search by User Email or Title (Server-Side) */}
          <div className="relative w-full lg:w-auto">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user email or title..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full lg:w-72 shadow-2xs"
            />
          </div>
        </div>

        {/* Room Selection Tabs */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase mr-1">
              Room:
            </span>

            {[
              { id: 'all', label: 'All Rooms', dot: 'bg-slate-400' },
              { id: 'blue', label: 'Blue Room', dot: 'bg-blue-600' },
              { id: 'red', label: 'Red Room', dot: 'bg-rose-600' },
              { id: 'yellow', label: 'Yellow Room', dot: 'bg-amber-500' },
            ].map((tab) => {
              const isSelected = roomFilter === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleRoomTabClick(tab.id)}
                  className={`inline-flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${tab.dot} flex-shrink-0`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span>Per Page:</span>
            <select
              value={pagination.limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Bookings List Content */}
      <div className="p-3 sm:p-6 min-h-[260px] relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center z-10">
            <div className="flex items-center space-x-2 text-sm font-semibold text-slate-600 bg-white px-4 py-2 rounded-xl shadow-md border border-slate-200">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading reservations...</span>
            </div>
          </div>
        )}

        {bookings.length === 0 && !loading ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Filter className="w-6 h-6" />
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-700">
              No Bookings Found
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchQuery
                ? `No reservations match your search "${searchQuery}".`
                : `No active reservations found for the selected room filter.`}
            </p>
            {roomFilter !== 'all' && onOpenBookingForRoom && (
              <button
                onClick={() => onOpenBookingForRoom(roomFilter as RoomCode)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                + Book {roomFilter.toUpperCase()} Room Now
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            {bookings.map((b) => {
              const meta = getRoomMeta(b.roomCode);
              const isCancelled = b.status === 'CANCELLED';

              return (
                <div
                  key={b._id}
                  className={`p-4 sm:p-5 rounded-2xl border border-slate-200/90 hover:shadow-xs transition-all bg-white flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4 ${meta.border}`}
                >
                  {/* Left Column: Room Name + Status + Meeting Title */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
                      {/* Room Name */}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap flex-shrink-0 ${meta.badge}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${meta.dot} mr-1.5`}
                        />
                        {meta.name}
                      </span>

                      {/* Status */}
                      {isCancelled ? (
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 whitespace-nowrap flex-shrink-0">
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap flex-shrink-0">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Confirmed
                        </span>
                      )}

                      {/* Stress Test Indicator */}
                      {b.createdVia === 'CONCURRENCY_TEST' && (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200/80 rounded-md whitespace-nowrap flex-shrink-0">
                          <Zap className="w-3 h-3 text-amber-600 fill-amber-500 flex-shrink-0" />
                          <span>Stress Test</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      {b.title}
                    </h4>
                  </div>

                  {/* Middle Column: Time Range */}
                  <div className="flex-shrink-0 xl:px-6 xl:border-x border-slate-100 py-1 xl:py-0">
                    <div className="text-xs sm:text-sm font-bold text-slate-800 flex items-center whitespace-nowrap">
                      <Clock className="w-4 h-4 mr-1.5 text-blue-600 flex-shrink-0" />
                      <span>
                        {formatDisplayTime(b.startTime)} – {formatDisplayTime(b.endTime)}
                      </span>
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-500 flex items-center mt-0.5 whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
                      {formatDisplayDate(b.startTime)}
                    </div>
                  </div>

                  {/* Right Column: User Email & Cancel Button */}
                  <div className="flex items-center justify-between xl:justify-end gap-3 sm:gap-4 flex-shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-100">
                    <div className="text-left xl:text-right min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center xl:justify-end truncate">
                        <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                        <span className="text-blue-700 font-mono truncate max-w-[200px] sm:max-w-xs">
                          {b.organizerEmail}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                        Booked by {b.organizerName}
                      </div>
                    </div>

                    {!isCancelled && (
                      <button
                        onClick={() => setBookingToCancel(b)}
                        className="inline-flex items-center px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer flex-shrink-0 shadow-2xs"
                        title="Cancel this booking to release the room"
                      >
                        <Ban className="w-3.5 h-3.5 mr-1 text-rose-600" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. SERVER-SIDE PAGINATION CONTROLS BAR */}
      <div className="px-4 sm:px-6 py-3.5 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="font-medium">
          Showing <strong className="text-slate-900">{startCount}</strong> to{' '}
          <strong className="text-slate-900">{endCount}</strong> of{' '}
          <strong className="text-slate-900">{pagination.total}</strong> bookings
          {pagination.totalPages > 1 && (
            <span className="ml-1 text-slate-400 font-normal">
              (Page {pagination.page} of {pagination.totalPages})
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {/* Numbered Page Buttons */}
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              disabled={loading}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                pageNum === pagination.page
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || loading}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. THIRD-PARTY UI LIBRARY: @headlessui/react Accessible Dialog for Cancel Confirmation */}
      <Transition appear show={Boolean(bookingToCancel)} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => {
            if (!isCancelling) setBookingToCancel(null);
          }}
        >
          {/* Backdrop Transition */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
              {/* Modal Panel Transition */}
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all border border-slate-200">
                  {bookingToCancel && (
                    <>
                      {/* Header */}
                      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between bg-rose-50/50">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-rose-600" />
                          </div>
                          <div>
                            <Dialog.Title
                              as="h3"
                              className="text-base font-bold text-slate-900"
                            >
                              Cancel Meeting Reservation?
                            </Dialog.Title>
                            <p className="text-xs text-slate-500 mt-0.5">
                              This will release the room for other members
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setBookingToCancel(null)}
                          disabled={isCancelling}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Modal Body: Reservation Details */}
                      <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
                        <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Meeting:</span>
                            <span className="font-bold text-slate-900 truncate max-w-[200px]">
                              {bookingToCancel.title}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Room:</span>
                            <span className="font-bold text-blue-700 capitalize">
                              {bookingToCancel.roomCode} Room
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">Time Range:</span>
                            <span className="font-semibold text-slate-800">
                              {formatDisplayTime(bookingToCancel.startTime)} –{' '}
                              {formatDisplayTime(bookingToCancel.endTime)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium">User Email:</span>
                            <span className="font-mono text-slate-700 truncate max-w-[220px]">
                              {bookingToCancel.organizerEmail}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          Are you sure you want to cancel this meeting? Once cancelled, the time slot will be immediately freed on the calendar.
                        </p>
                      </div>

                      {/* Modal Footer with the 2 Required Buttons: "Back" & "Cancel Meeting" */}
                      <div className="px-4 sm:px-5 py-3.5 sm:py-4 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-3">
                        {/* BUTTON 1: BACK */}
                        <button
                          type="button"
                          onClick={() => setBookingToCancel(null)}
                          disabled={isCancelling}
                          className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all shadow-2xs"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back</span>
                        </button>

                        {/* BUTTON 2: CANCEL MEETING */}
                        <button
                          type="button"
                          onClick={handleConfirmCancel}
                          disabled={isCancelling}
                          className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-all shadow-sm shadow-rose-500/25 disabled:opacity-50"
                        >
                          {isCancelling ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Cancelling...</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-3.5 h-3.5" />
                              <span>Cancel Meeting</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};
