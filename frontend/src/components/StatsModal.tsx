import React, { useEffect, useState } from 'react';
import { getStats } from '../api/client';
import { X, BarChart3, Users, CheckCircle2, Ban, Layers, Loader2 } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getStats()
        .then((data) => setStats(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl flex-shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Co-Working Space Analytics</h2>
              <p className="text-[11px] sm:text-xs text-slate-500">Real-time room utilization & booking metrics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <span className="text-xs">Loading analytics...</span>
            </div>
          ) : stats ? (
            <div className="space-y-5 sm:space-y-6">
              {/* Metric KPI cards */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div className="p-3 sm:p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="flex items-center text-blue-700 text-[11px] sm:text-xs font-semibold mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                    Confirmed
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-blue-900">
                    {stats.totalConfirmed}
                  </div>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-purple-50 border border-purple-100">
                  <div className="flex items-center text-purple-700 text-[11px] sm:text-xs font-semibold mb-1">
                    <Layers className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                    Today&apos;s Total
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-purple-900">
                    {stats.todayTotalBookings}
                  </div>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center text-slate-700 text-[11px] sm:text-xs font-semibold mb-1">
                    <Users className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                    Fixed Rooms
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">
                    {stats.totalRooms || 3}
                  </div>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-rose-50 border border-rose-100">
                  <div className="flex items-center text-rose-700 text-[11px] sm:text-xs font-semibold mb-1">
                    <Ban className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                    Cancelled
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-rose-900">
                    {stats.totalCancelled}
                  </div>
                </div>
              </div>

              {/* Per-Room Distribution */}
              <div>
                <h4 className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Today&apos;s Meetings by Room
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center font-semibold text-slate-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mr-2 flex-shrink-0" />
                      Blue Room
                    </span>
                    <span className="font-bold text-slate-900">
                      {stats.todayBookingsByRoom?.blue || 0} meetings
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, ((stats.todayBookingsByRoom?.blue || 0) / Math.max(1, stats.todayTotalBookings)) * 100)}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="flex items-center font-semibold text-slate-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 mr-2 flex-shrink-0" />
                      Red Room
                    </span>
                    <span className="font-bold text-slate-900">
                      {stats.todayBookingsByRoom?.red || 0} meetings
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-600 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, ((stats.todayBookingsByRoom?.red || 0) / Math.max(1, stats.todayTotalBookings)) * 100)}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="flex items-center font-semibold text-slate-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2 flex-shrink-0" />
                      Yellow Room
                    </span>
                    <span className="font-bold text-slate-900">
                      {stats.todayBookingsByRoom?.yellow || 0} meetings
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, ((stats.todayBookingsByRoom?.yellow || 0) / Math.max(1, stats.todayTotalBookings)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-6 text-xs">
              Unable to load statistics.
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
