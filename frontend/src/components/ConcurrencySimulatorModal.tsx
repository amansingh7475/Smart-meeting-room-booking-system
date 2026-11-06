import React, { useState } from 'react';
import { Room, RoomCode, ConcurrencyResponse } from '../types';
import { simulateConcurrency } from '../api/client';
import { X, Zap, ShieldCheck, CheckCircle2, XCircle, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { formatDisplayTime } from '../utils/date';

interface ConcurrencySimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  onTestComplete: () => void;
}

export const ConcurrencySimulatorModal: React.FC<ConcurrencySimulatorModalProps> = ({
  isOpen,
  onClose,
  rooms,
  onTestComplete,
}) => {
  const [selectedRoomCode, setSelectedRoomCode] = useState<RoomCode>('blue');
  const [attemptsCount, setAttemptsCount] = useState<number>(5);
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<ConcurrencyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunTest = async () => {
    setIsRunning(true);
    setError(null);
    setTestResult(null);

    try {
      const response = await simulateConcurrency({
        roomCode: selectedRoomCode,
        attemptsCount,
      });

      setTestResult(response);
      onTestComplete();
    } catch (err: any) {
      console.error('Concurrency simulation error:', err);
      setError(err.response?.data?.error || err.message || 'Simulation failed to run');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent flex-shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="p-2 sm:p-2.5 bg-amber-500 text-white rounded-xl shadow-md shadow-amber-500/30 flex-shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-bold text-slate-900 flex items-center">
                Double-Booking Stress Test Lab
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Demonstrates race-condition resistance under simultaneous requests
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto overscroll-contain flex-1">
          {/* Explanation Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center text-slate-900 font-bold text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mr-1.5 flex-shrink-0" />
              Critical Requirement Verification:
            </div>
            <p className="text-[11px] sm:text-xs leading-relaxed">
              If multiple members click &quot;Book&quot; at the exact same millisecond for the same room and slot, naive systems create double bookings.
            </p>
            <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
              This lab executes simultaneous asynchronous requests concurrently via <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">Promise.all()</code> to verify that our Mutex locking guarantees <strong>exactly 1 success (`201`)</strong> and rejects all <strong>competitors with `HTTP 409 Conflict`</strong>.
            </p>
          </div>

          {/* Test Setup Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Target Room
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['blue', 'red', 'yellow'] as RoomCode[]).map((code) => {
                  const isSelected = selectedRoomCode === code;
                  const roomMeta = rooms.find((r) => r.code === code);
                  const colors = {
                    blue: isSelected ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                    red: isSelected ? 'bg-rose-600 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                    yellow: isSelected ? 'bg-amber-600 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                  };
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setSelectedRoomCode(code)}
                      className={`py-2 px-2.5 text-xs rounded-xl transition-colors capitalize text-center ${colors[code]}`}
                    >
                      <div className="font-bold">{code}</div>
                      {roomMeta && <div className="text-[10px] opacity-80">{roomMeta.capacity} seats</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Simultaneous Requests
              </label>
              <div className="flex space-x-1.5 sm:space-x-2">
                {[3, 5, 8, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setAttemptsCount(num)}
                    className={`flex-1 py-2 text-xs rounded-xl border font-bold transition-colors ${
                      attemptsCount === num
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Trigger Button */}
          <div>
            <button
              onClick={handleRunTest}
              disabled={isRunning}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Firing Parallel Requests...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Fire {attemptsCount} Simultaneous Race-Condition Requests</span>
                </>
              )}
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Test Results Display */}
          {testResult && (
            <div className="space-y-3 sm:space-y-4 pt-2 border-t border-slate-100">
              {/* Verdict Banner */}
              <div
                className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  testResult.isDoubleBookingPrevented
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-emerald-600 text-white flex-shrink-0">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold">
                      {testResult.isDoubleBookingPrevented
                        ? '🏆 Double-Booking 100% Prevented!'
                        : '⚠️ Double Booking Occurred'}
                    </div>
                    <div className="text-[11px] opacity-90 mt-0.5">
                      Target: {testResult.room.name} ({formatDisplayTime(testResult.timeSlot.start)} - {formatDisplayTime(testResult.timeSlot.end)})
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <div className="bg-white/90 px-2.5 py-1 rounded-lg border border-emerald-300 text-xs font-bold text-emerald-800">
                    {testResult.successfulCount} Won (201)
                  </div>
                  <div className="bg-white/90 px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-bold text-slate-700">
                    {testResult.rejectedCount} Blocked (409)
                  </div>
                </div>
              </div>

              {/* Individual Request Breakdown Table with Horizontal Scroll */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="overflow-x-auto touch-pan-x">
                  <div className="min-w-[480px]">
                    <div className="bg-slate-100 px-3.5 py-2 font-semibold text-slate-700 grid grid-cols-12 gap-2 text-[11px]">
                      <div className="col-span-1">#</div>
                      <div className="col-span-4">Organizer</div>
                      <div className="col-span-3">Status</div>
                      <div className="col-span-4">Result</div>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
                      {testResult.results.map((res) => (
                        <div
                          key={res.attempt}
                          className={`px-3.5 py-2 grid grid-cols-12 gap-2 items-center text-[11px] ${
                            res.status === 'SUCCESS' ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="col-span-1 font-mono text-slate-400">#{res.attempt}</div>
                          <div className="col-span-4 font-semibold text-slate-800 truncate">
                            {res.organizer}
                          </div>
                          <div className="col-span-3">
                            {res.status === 'SUCCESS' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                                201 CREATED
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                <XCircle className="w-3 h-3 mr-1 text-rose-600" />
                                409 CONFLICT
                              </span>
                            )}
                          </div>
                          <div className="col-span-4 text-slate-500 truncate" title={res.message}>
                            {res.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            Close Lab
          </button>
        </div>
      </div>
    </div>
  );
};
