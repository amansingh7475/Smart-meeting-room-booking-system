import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Room, RoomCode, DEFAULT_ROOMS } from '../types';
import { checkAvailability } from '../api/client';
import { useAppDispatch } from '../store';
import { createBookingThunk } from '../store/slices/bookingsSlice';
import { X, Calendar, Clock, Mail, Users, AlertTriangle, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { format, addMinutes, setHours, setMinutes } from 'date-fns';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  initialRoom?: Room | null;
  initialStartTime?: Date | null;
  onBookingCreated?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  rooms,
  initialRoom,
  initialStartTime,
  onBookingCreated,
}) => {
  const dispatch = useAppDispatch();
  const availableRooms = rooms && rooms.length > 0 ? rooms : DEFAULT_ROOMS;

  const [selectedRoomCode, setSelectedRoomCode] = useState<RoomCode>('blue');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [startTimeStr, setStartTimeStr] = useState<string>('10:00');
  const [endTimeStr, setEndTimeStr] = useState<string>('11:00');
  const [userEmail, setUserEmail] = useState('');
  const [title, setTitle] = useState('');
  const [attendeesCount, setAttendeesCount] = useState<number>(2);

  // Availability checking state
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityConflict, setAvailabilityConflict] = useState<string | null>(null);
  const [isSlotAvailable, setIsSlotAvailable] = useState<boolean | null>(null);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialRoom) {
        setSelectedRoomCode(initialRoom.code);
      } else {
        setSelectedRoomCode('blue');
      }

      if (initialStartTime) {
        setSelectedDate(format(initialStartTime, 'yyyy-MM-dd'));
        setStartTimeStr(format(initialStartTime, 'HH:mm'));
        const autoEnd = addMinutes(initialStartTime, 60);
        setEndTimeStr(format(autoEnd, 'HH:mm'));
      }
      setErrorMessage(null);
    }
  }, [isOpen, initialRoom, initialStartTime]);

  const activeRoom = availableRooms.find((r) => r.code === selectedRoomCode) || availableRooms[0];

  const getStartAndEndDates = (): { start: Date; end: Date; startISO: string; endISO: string } | null => {
    try {
      const [startHour, startMin] = startTimeStr.split(':').map(Number);
      const [endHour, endMin] = endTimeStr.split(':').map(Number);
      const [year, month, day] = selectedDate.split('-').map(Number);

      const start = new Date(year, month - 1, day, startHour, startMin, 0, 0);
      const end = new Date(year, month - 1, day, endHour, endMin, 0, 0);

      return {
        start,
        end,
        startISO: start.toISOString(),
        endISO: end.toISOString(),
      };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!selectedRoomCode || !selectedDate || !startTimeStr || !endTimeStr) {
      setIsSlotAvailable(null);
      setAvailabilityConflict(null);
      return;
    }

    const dateInfo = getStartAndEndDates();
    if (!dateInfo || dateInfo.end <= dateInfo.start) {
      setIsSlotAvailable(false);
      setAvailabilityConflict('End time must be after start time.');
      return;
    }

    let isMounted = true;
    setIsCheckingAvailability(true);

    const timer = setTimeout(async () => {
      try {
        const result = await checkAvailability({
          roomId: activeRoom._id || selectedRoomCode,
          startTime: dateInfo.startISO,
          endTime: dateInfo.endISO,
        });

        if (isMounted) {
          setIsSlotAvailable(result.isAvailable);
          setAvailabilityConflict(result.conflict ? result.conflict.message : null);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('Live availability check notice:', err.message);
        }
      } finally {
        if (isMounted) {
          setIsCheckingAvailability(false);
        }
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedRoomCode, selectedDate, startTimeStr, endTimeStr, activeRoom._id]);

  const setQuickDuration = (minutes: number) => {
    const [startH, startM] = startTimeStr.split(':').map(Number);
    const base = setMinutes(setHours(new Date(), startH), startM);
    const end = addMinutes(base, minutes);
    setEndTimeStr(format(end, 'HH:mm'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const dateInfo = getStartAndEndDates();
    if (!dateInfo) {
      setErrorMessage('Please provide a valid date and time range.');
      return;
    }

    if (dateInfo.end <= dateInfo.start) {
      setErrorMessage('End time must be strictly after start time.');
      return;
    }

    if (!userEmail.trim()) {
      setErrorMessage('Please provide a valid user email.');
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(
        createBookingThunk({
          roomId: activeRoom._id || selectedRoomCode,
          userEmail: userEmail.trim(),
          title: title.trim() || `${activeRoom.name} Meeting`,
          organizerName: userEmail.split('@')[0],
          attendeesCount,
          startTime: dateInfo.startISO,
          endTime: dateInfo.endISO,
        })
      ).unwrap();

      if (onBookingCreated) onBookingCreated();
      onClose();
      setUserEmail('');
      setTitle('');
    } catch (err: any) {
      setErrorMessage(err || 'Failed to submit booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all border border-slate-200 flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
                  <div>
                    <Dialog.Title as="h2" className="text-base sm:text-lg font-bold text-slate-900">
                      Book Meeting Room
                    </Dialog.Title>
                    <p className="text-[11px] sm:text-xs text-slate-500">
                      Select room, date, and time slot with instant double-booking check
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable Form Content */}
                <form
                  onSubmit={handleSubmit}
                  className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto overscroll-contain flex-1"
                >
                  {/* 1. SELECT ROOM */}
                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      1. Select Room *
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                      {availableRooms.map((room) => {
                        const isSelected = room.code === selectedRoomCode;
                        const colors = {
                          blue: isSelected
                            ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/30'
                            : 'border-slate-200 hover:border-blue-300 bg-white text-slate-700',
                          red: isSelected
                            ? 'border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-500/30'
                            : 'border-slate-200 hover:border-rose-300 bg-white text-slate-700',
                          yellow: isSelected
                            ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/30'
                            : 'border-slate-200 hover:border-amber-300 bg-white text-slate-700',
                        };

                        const dotColors = {
                          blue: 'bg-blue-600',
                          red: 'bg-rose-600',
                          yellow: 'bg-amber-500',
                        };

                        return (
                          <button
                            key={room.code}
                            type="button"
                            onClick={() => setSelectedRoomCode(room.code)}
                            className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all ${colors[room.code]}`}
                          >
                            <div className="flex items-center space-x-1.5">
                              <span className={`w-2 h-2 rounded-full ${dotColors[room.code]} flex-shrink-0`} />
                              <span className="font-bold text-xs sm:text-sm truncate">{room.name}</span>
                            </div>
                            <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {room.capacity} seats
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. SELECT DATE & TIMES */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                      <div>
                        <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          Start Time *
                        </label>
                        <input
                          type="time"
                          required
                          step="900"
                          value={startTimeStr}
                          onChange={(e) => setStartTimeStr(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          End Time *
                        </label>
                        <input
                          type="time"
                          required
                          step="900"
                          value={endTimeStr}
                          onChange={(e) => setEndTimeStr(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                    </div>

                    {/* Quick Duration Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold uppercase mr-1">
                        Duration:
                      </span>
                      {[30, 45, 60, 90, 120].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setQuickDuration(mins)}
                          className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors"
                        >
                          {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* LIVE AVAILABILITY BANNER */}
                  <div className="rounded-xl text-xs transition-all">
                    {isCheckingAvailability ? (
                      <div className="flex items-center text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-600" />
                        Checking slot availability...
                      </div>
                    ) : isSlotAvailable === true ? (
                      <div className="flex items-center text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
                        <CheckCircle className="w-4 h-4 mr-2 text-emerald-600 flex-shrink-0" />
                        <span>
                          <strong>Available!</strong> {activeRoom.name} is free for this time slot.
                        </span>
                      </div>
                    ) : isSlotAvailable === false ? (
                      <div className="flex items-start text-rose-800 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                        <AlertTriangle className="w-4 h-4 mr-2 text-rose-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-semibold">Slot Unavailable</strong>
                          <p className="mt-0.5 text-rose-700 text-[11px]">{availabilityConflict}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* USER EMAIL & DETAILS */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center">
                        <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        User Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="user@example.com"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1">
                          Meeting Title (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Business Strategy, Sync"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1 flex items-center">
                          <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          Attendees Count
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={activeRoom.capacity}
                          value={attendeesCount}
                          onChange={(e) => setAttendeesCount(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SUBMISSION ERROR BANNER */}
                  {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs flex items-start">
                      <AlertTriangle className="w-4 h-4 mr-2 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Booking Failed:</strong> {errorMessage}
                      </div>
                    </div>
                  )}

                  {/* RESPONSIVE SUBMIT BUTTONS */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-3 flex-shrink-0">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || isSlotAvailable === false}
                      className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors shadow-sm shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting Request...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Submit Booking Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
