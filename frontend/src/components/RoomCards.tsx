import React from 'react';
import { Room } from '../types';
import { Users, MapPin, Tv, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { formatDisplayTime } from '../utils/date';

interface RoomCardsProps {
  rooms: Room[];
  onSelectRoomToBook: (room: Room) => void;
}

export const RoomCards: React.FC<RoomCardsProps> = ({ rooms, onSelectRoomToBook }) => {
  const getThemeStyles = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          accentBorder: 'border-blue-500',
          ringFocus: 'focus:ring-blue-500',
          btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
          glow: 'from-blue-500/10 to-indigo-500/5',
          bannerBg: 'bg-gradient-to-r from-blue-600 to-indigo-600',
          indicator: 'bg-blue-500',
        };
      case 'red':
        return {
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
          accentBorder: 'border-rose-500',
          ringFocus: 'focus:ring-rose-500',
          btnBg: 'bg-rose-600 hover:bg-rose-700 text-white',
          glow: 'from-rose-500/10 to-red-500/5',
          bannerBg: 'bg-gradient-to-r from-rose-600 to-red-600',
          indicator: 'bg-rose-500',
        };
      case 'yellow':
        return {
          badge: 'bg-amber-100 text-amber-900 border-amber-200',
          accentBorder: 'border-amber-500',
          ringFocus: 'focus:ring-amber-500',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
          glow: 'from-amber-500/10 to-yellow-500/5',
          bannerBg: 'bg-gradient-to-r from-amber-500 to-yellow-600',
          indicator: 'bg-amber-500',
        };
      default:
        return {
          badge: 'bg-slate-100 text-slate-800 border-slate-200',
          accentBorder: 'border-slate-400',
          ringFocus: 'focus:ring-slate-400',
          btnBg: 'bg-slate-700 hover:bg-slate-800 text-white',
          glow: 'from-slate-500/10 to-slate-500/5',
          bannerBg: 'bg-slate-700',
          indicator: 'bg-slate-500',
        };
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 3xl:gap-8">
      {rooms.map((room) => {
        const theme = getThemeStyles(room.themeColor);
        const isOccupied = room.isCurrentlyOccupied;

        return (
          <div
            key={room._id}
            className={`relative bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group`}
          >
            {/* Top Color Accent Bar */}
            <div className={`h-2.5 w-full ${theme.bannerBg}`} />

            <div className="p-5 3xl:p-7 flex-1 flex flex-col justify-between">
              <div>
                {/* Header: Name & Occupancy Status */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`w-3 h-3 rounded-full ${theme.indicator} inline-block`} />
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {room.name}
                      </h3>
                    </div>
                    <div className="flex items-center text-xs text-slate-500 mt-1 space-x-3">
                      <span className="flex items-center">
                        <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        Up to {room.capacity} seats
                      </span>
                      <span>•</span>
                      <span className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {room.floor}
                      </span>
                    </div>
                  </div>

                  {/* Current Status Badge */}
                  <div>
                    {isOccupied ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                        <Clock className="w-3 h-3 mr-1" />
                        In Use
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Available
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {room.description}
                </p>

                {/* In Use Details Banner */}
                {isOccupied && room.currentBooking && (
                  <div className="mb-4 p-2.5 bg-rose-50/70 border border-rose-100 rounded-lg text-xs text-rose-900">
                    <p className="font-semibold truncate">Current: {room.currentBooking.title}</p>
                    <p className="text-rose-700 text-[11px] mt-0.5">
                      Until {formatDisplayTime(room.currentBooking.endTime)} • {room.currentBooking.organizerName}
                    </p>
                  </div>
                )}

                {/* Amenities Badges */}
                <div className="space-y-1.5 mb-5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Room Equipment
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {room.amenities.slice(0, 4).map((amenity, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        <Tv className="w-3 h-3 mr-1 text-slate-400" />
                        {amenity}
                      </span>
                    ))}
                    {room.amenities.length > 4 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-dashed border-slate-200">
                        +{room.amenities.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  <span className="font-bold text-slate-800 text-base">${room.hourlyRate}</span> / hour
                </div>
                <button
                  onClick={() => onSelectRoomToBook(room)}
                  className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition-all ${theme.btnBg}`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Book This Room</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
