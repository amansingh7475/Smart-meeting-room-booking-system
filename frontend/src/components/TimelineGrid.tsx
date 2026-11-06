import React, { useRef, useEffect } from 'react';
import { Room, Booking } from '../types';
import { formatDisplayTime } from '../utils/date';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Plus, MoveHorizontal } from 'lucide-react';
import { format, addDays, subDays, parseISO } from 'date-fns';

interface TimelineGridProps {
  rooms: Room[];
  bookings: Booking[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onSlotClick: (room: Room, startTime: Date) => void;
}

// Full 24 Hours of the day: 0 (12 AM) to 23 (11 PM)
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const ROOM_COLUMN_WIDTH = 210; // Exact px width for sticky room column across all viewports
const HOUR_COLUMN_WIDTH = 76; // px per hour column for clean, spacious layout
const TOTAL_TRACK_WIDTH = HOUR_COLUMN_WIDTH * 24; // 1824px
const TOTAL_TABLE_MIN_WIDTH = ROOM_COLUMN_WIDTH + TOTAL_TRACK_WIDTH; // 2034px

export const TimelineGrid: React.FC<TimelineGridProps> = ({
  rooms,
  bookings,
  selectedDate,
  onDateChange,
  onSlotClick,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;

  // Scroll to a specific hour on demand
  const scrollToHour = (hour: number) => {
    if (scrollContainerRef.current) {
      const targetScroll = hour * HOUR_COLUMN_WIDTH;
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
  };

  // Auto-scroll to 8 AM on initial load so normal daytime hours are in view
  useEffect(() => {
    if (scrollContainerRef.current) {
      const targetScroll = 8 * HOUR_COLUMN_WIDTH;
      scrollContainerRef.current.scrollLeft = Math.max(0, targetScroll);
    }
  }, [dateStr]);

  // Filter bookings for the selected date and confirmed status
  const dayBookings = bookings.filter((b) => {
    if (b.status === 'CANCELLED') return false;
    const bookingDate = format(parseISO(b.startTime), 'yyyy-MM-dd');
    return bookingDate === dateStr;
  });

  const getRoomBookings = (room: Room) => {
    return dayBookings.filter(
      (b) =>
        b.roomCode === room.code ||
        (typeof b.roomId === 'object' && b.roomId?._id === room._id) ||
        b.roomId === room._id
    );
  };

  // Convert time to percentage across full 24 hours (1440 minutes total)
  const calculatePosition = (startTimeStr: string, endTimeStr: string) => {
    const start = parseISO(startTimeStr);
    const end = parseISO(endTimeStr);

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();

    const leftPercent = (startMinutes / 1440) * 100;
    const widthPercent = Math.max(1.2, ((endMinutes - startMinutes) / 1440) * 100);

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
    };
  };

  const formatHourLabel = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  const getRoomColors = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          badge: 'bg-blue-600',
          blockBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs border border-blue-400/40',
        };
      case 'red':
        return {
          badge: 'bg-rose-600',
          blockBg: 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-xs border border-rose-400/40',
        };
      case 'yellow':
        return {
          badge: 'bg-amber-500',
          blockBg: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-xs border border-amber-400/40',
        };
      default:
        return {
          badge: 'bg-slate-600',
          blockBg: 'bg-slate-700 text-white',
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl flex-shrink-0 shadow-2xs">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                24-Hour Room Schedule
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Full 24 Hours
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Scroll horizontally to navigate all 24 hours (12:00 AM – 11:59 PM)
            </p>
          </div>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => onDateChange(subDays(selectedDate, 1))}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => onDateChange(new Date())}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                isToday
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Today
            </button>

            <button
              onClick={() => onDateChange(addDays(selectedDate, 1))}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-xs sm:text-sm font-bold text-slate-800 ml-1">
            {format(selectedDate, 'EEE, MMM d, yyyy')}
          </span>
        </div>
      </div>

      {/* 2. Scroll Guidance Hint Bar with Quick Jump Shortcuts */}
      <div className="px-4 py-2 bg-slate-100/90 border-b border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center font-medium">
          <MoveHorizontal className="w-4 h-4 mr-1.5 text-blue-600 flex-shrink-0" />
          Scroll horizontally across all 24 hours. Room column remains pinned on the left.
        </span>

        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden md:inline">Jump to:</span>
          <button
            onClick={() => scrollToHour(0)}
            className="px-2 py-0.5 text-[11px] font-bold bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded border border-slate-200 transition-colors"
          >
            12 AM
          </button>
          <button
            onClick={() => scrollToHour(8)}
            className="px-2 py-0.5 text-[11px] font-bold bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded border border-slate-200 transition-colors"
          >
            8 AM
          </button>
          <button
            onClick={() => scrollToHour(13)}
            className="px-2 py-0.5 text-[11px] font-bold bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded border border-slate-200 transition-colors"
          >
            1 PM
          </button>
          <button
            onClick={() => scrollToHour(18)}
            className="px-2 py-0.5 text-[11px] font-bold bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded border border-slate-200 transition-colors"
          >
            6 PM
          </button>
        </div>
      </div>

      {/* 3. SYNCHRONIZED 24-HOUR HORIZONTAL SCROLL TABLE */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto touch-pan-x scrollbar-thin relative"
      >
        <div style={{ minWidth: `${TOTAL_TABLE_MIN_WIDTH}px` }} className="w-full">
          {/* HEADER ROW: STICKY CORNER + 24 HOURS */}
          <div className="flex border-b border-slate-200 bg-slate-100">
            {/* Sticky Top-Left Header Cell (Pinned on scroll, matching exact room column width) */}
            <div
              style={{
                width: `${ROOM_COLUMN_WIDTH}px`,
                minWidth: `${ROOM_COLUMN_WIDTH}px`,
                maxWidth: `${ROOM_COLUMN_WIDTH}px`,
              }}
              className="flex-shrink-0 sticky left-0 z-30 bg-slate-100 px-4 py-2.5 border-r border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center justify-between shadow-[4px_0_10px_-2px_rgba(0,0,0,0.08)]"
            >
              <span>Rooms</span>
              <span className="text-[10px] text-slate-400 font-semibold lowercase">24 Hours</span>
            </div>

            {/* 24 Hour Labels (Horizontally scrolling, 1:1 aligned with tracks below) */}
            <div
              className="flex-1 grid"
              style={{
                gridTemplateColumns: `repeat(24, minmax(${HOUR_COLUMN_WIDTH}px, 1fr))`,
                minWidth: `${TOTAL_TRACK_WIDTH}px`,
              }}
            >
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="text-center py-2.5 text-xs font-bold text-slate-600 border-r border-slate-200/80 last:border-r-0 select-none bg-slate-100"
                >
                  {formatHourLabel(hour)}
                </div>
              ))}
            </div>
          </div>

          {/* ROOM ROWS: STICKY ROOM COLUMN + 24 HOUR TRACK */}
          <div className="divide-y divide-slate-200 bg-white">
            {rooms.map((room) => {
              const roomBookings = getRoomBookings(room);
              const colors = getRoomColors(room.themeColor);

              return (
                <div key={room._id} className="flex hover:bg-slate-50/50 transition-colors group">
                  {/* Sticky Left Room Cell (Always pinned on horizontal scroll, 100% opaque) */}
                  <div
                    style={{
                      width: `${ROOM_COLUMN_WIDTH}px`,
                      minWidth: `${ROOM_COLUMN_WIDTH}px`,
                      maxWidth: `${ROOM_COLUMN_WIDTH}px`,
                    }}
                    className="flex-shrink-0 sticky left-0 z-20 bg-white group-hover:bg-slate-50 p-4 border-r border-slate-200 flex flex-col justify-center shadow-[4px_0_10px_-2px_rgba(0,0,0,0.08)]"
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${colors.badge} flex-shrink-0`} />
                      <span className="font-bold text-sm text-slate-900 truncate">
                        {room.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
                      <span>{room.capacity} seats</span>
                      <button
                        onClick={() => {
                          const slot = new Date(selectedDate);
                          slot.setHours(10, 0, 0, 0);
                          onSlotClick(room, slot);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center hover:underline"
                      >
                        <Plus className="w-3 h-3 mr-0.5" />
                        Book
                      </button>
                    </div>
                  </div>

                  {/* Right Track: Matches the 24 columns in the header with 100% precision */}
                  <div
                    className="flex-1 relative h-20"
                    style={{ minWidth: `${TOTAL_TRACK_WIDTH}px` }}
                  >
                    {/* 24 Vertical Grid Hour Lines */}
                    <div
                      className="absolute inset-0 grid h-full pointer-events-none"
                      style={{
                        gridTemplateColumns: `repeat(24, minmax(${HOUR_COLUMN_WIDTH}px, 1fr))`,
                      }}
                    >
                      {HOURS.map((hour) => (
                        <div
                          key={hour}
                          className="border-r border-slate-100 h-full last:border-r-0 hover:bg-blue-50/20"
                        />
                      ))}
                    </div>

                    {/* Booking Blocks positioned accurately */}
                    {roomBookings.map((b) => {
                      const pos = calculatePosition(b.startTime, b.endTime);
                      return (
                        <div
                          key={b._id}
                          style={{ left: pos.left, width: pos.width }}
                          className={`absolute top-2.5 bottom-2.5 rounded-xl px-3 py-1.5 overflow-hidden transition-all duration-150 z-10 cursor-pointer ${colors.blockBg}`}
                          title={`${b.title}\nBy: ${b.organizerEmail}\n${formatDisplayTime(b.startTime)} - ${formatDisplayTime(b.endTime)}`}
                        >
                          <div className="text-xs font-bold truncate leading-tight">
                            {b.title}
                          </div>
                          <div className="text-[10px] opacity-90 truncate flex items-center space-x-1 mt-0.5 whitespace-nowrap">
                            <Clock className="w-3 h-3 mr-1 inline-block shrink-0" />
                            <span>
                              {formatDisplayTime(b.startTime)} – {formatDisplayTime(b.endTime)}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Empty Track Hint */}
                    {roomBookings.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-300 pointer-events-none font-medium">
                        No meetings scheduled for this room today
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Footer Legend */}
      <div className="p-3 sm:p-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center space-x-4">
          <span className="flex items-center font-medium">
            <span className="w-2.5 h-2.5 rounded bg-blue-600 mr-1.5" /> Blue Room
          </span>
          <span className="flex items-center font-medium">
            <span className="w-2.5 h-2.5 rounded bg-rose-600 mr-1.5" /> Red Room
          </span>
          <span className="flex items-center font-medium">
            <span className="w-2.5 h-2.5 rounded bg-amber-500 mr-1.5" /> Yellow Room
          </span>
        </div>
        <div className="text-emerald-700 font-bold flex items-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1.5 animate-pulse" />
          Full 24-Hour Coverage • Zero Double-Booking Collision
        </div>
      </div>
    </div>
  );
};
