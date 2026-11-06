import React, { useState } from 'react';
import { Calendar, ShieldCheck, Zap, BarChart3, Plus, RefreshCw, Menu, X } from 'lucide-react';

interface HeaderProps {
  onOpenBooking: () => void;
  onOpenConcurrencyLab: () => void;
  onOpenStats: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenBooking,
  onOpenConcurrencyLab,
  onOpenStats,
  onRefresh,
  isLoading,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* 2560px Responsive Container: max-w-7xl 2xl:max-w-[1800px] 3xl:max-w-[2200px] */}
      <div className="max-w-7xl 2xl:max-w-[1800px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Logo & Brand Name */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 flex-shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0">
              <Calendar className="w-5 h-5 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base sm:text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                  CoSpace Hub
                </span>
                <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                  Anti-Double Booking Active
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium whitespace-nowrap">
                Blue • Red • Yellow Rooms
              </p>
            </div>
          </div>

          {/* Desktop Navigation (md and up: 768px+) */}
          <div className="hidden md:flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh Schedule"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            <button
              onClick={onOpenStats}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs lg:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              <BarChart3 className="w-4 h-4 text-slate-500" />
              <span>Analytics</span>
            </button>

            <button
              onClick={onOpenConcurrencyLab}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs lg:text-sm font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors shadow-2xs"
            >
              <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
              <span className="hidden lg:inline">Stress Test:</span>
              <span>Lab</span>
            </button>

            <button
              onClick={onOpenBooking}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs lg:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors shadow-sm shadow-blue-500/30"
            >
              <Plus className="w-4 h-4" />
              <span>Book Room</span>
            </button>
          </div>

          {/* Mobile Right: Hamburger 3-Line Menu Button (< md: 768px) */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Quick Mobile "+ Book" shortcut */}
            <button
              onClick={onOpenBooking}
              className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/25"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book</span>
            </button>

            {/* 3-Line Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-800" />
              ) : (
                <Menu className="w-5 h-5 text-slate-800" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (Opened via 3-Line Hamburger Button) */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 space-y-2 animate-in slide-in-from-top-2 duration-150">
            {/* Book Room Action */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-sm shadow-blue-500/30"
            >
              <div className="flex items-center space-x-2.5">
                <Plus className="w-4 h-4" />
                <span>Book Meeting Slot</span>
              </div>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md font-semibold">
                Available
              </span>
            </button>

            {/* Stress Test Action */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenConcurrencyLab();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-semibold text-sm transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>Stress Test: Concurrency Lab</span>
              </div>
              <span className="text-xs bg-amber-200/60 px-2 py-0.5 rounded-md font-bold text-amber-900">
                Test
              </span>
            </button>

            {/* Analytics Action */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenStats();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-sm transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <BarChart3 className="w-4 h-4 text-slate-600" />
                <span>Analytics & Utilization</span>
              </div>
            </button>

            {/* Refresh Action */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onRefresh();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
                <span>Refresh Schedule</span>
              </div>
              <span className="text-xs text-slate-400">Live</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
