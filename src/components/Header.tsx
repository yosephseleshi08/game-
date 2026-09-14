import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Download,
  Upload,
  CheckCircle,
  Target,
  BarChart3,
  ListTodo,
} from 'lucide-react';
import { formatWeekRange } from '../utils/dateUtils';

interface HeaderProps {
  currentWeekStart: Date;
  currentWeekEnd: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onJumpToToday: () => void;
  isCurrentWeek: boolean;
  onResetData: () => void;
  onExportData: () => void;
  onImportData: (jsonData: string) => void;
  activeTab: 'tracker' | 'insights' | 'goals';
  onTabChange: (tab: 'tracker' | 'insights' | 'goals') => void;
  activeHabitCount: number;
  activeGoalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentWeekStart,
  currentWeekEnd,
  onPrevWeek,
  onNextWeek,
  onJumpToToday,
  isCurrentWeek,
  onResetData,
  onExportData,
  onImportData,
  activeTab,
  onTabChange,
  activeHabitCount,
  activeGoalCount,
}) => {
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        onImportData(content);
        setImportNotice('Data restored successfully!');
        setTimeout(() => setImportNotice(null), 3000);
      } catch {
        alert('Invalid backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Brand & Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
                  Habit Tracker
                  <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Weekly Insights
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  {activeHabitCount} habits active • {activeGoalCount} targets in progress
                </p>
              </div>
            </div>

            {/* Mobile week navigation */}
            <div className="flex md:hidden items-center gap-1">
              <button
                onClick={onPrevWeek}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
                title="Previous Week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={onNextWeek}
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
                title="Next Week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center: Week Navigator */}
          <div className="flex items-center justify-center gap-2 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/60">
            <button
              onClick={onPrevWeek}
              className="p-1.5 rounded-lg hover:bg-slate-700/80 text-slate-400 hover:text-white transition-colors"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-3">
              <CalendarIcon className="w-4 h-4 text-blue-400" />
              <span className="text-xs sm:text-sm font-medium text-slate-200">
                {formatWeekRange(currentWeekStart, currentWeekEnd)}
              </span>
            </div>

            <button
              onClick={onNextWeek}
              className="p-1.5 rounded-lg hover:bg-slate-700/80 text-slate-400 hover:text-white transition-colors"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isCurrentWeek && (
              <button
                onClick={onJumpToToday}
                className="ml-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 transition-colors"
              >
                Today
              </button>
            )}
          </div>

          {/* Right: Data Management Options */}
          <div className="flex items-center justify-end gap-2">
            <div className="relative">
              <button
                onClick={() => setShowDataMenu(!showDataMenu)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
              >
                <span>Manage Data</span>
              </button>

              {showDataMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDataMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 p-1.5 text-xs text-slate-300">
                    <button
                      onClick={() => {
                        onResetData();
                        setShowDataMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2 text-amber-300"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset to Sample Data
                    </button>
                    <button
                      onClick={() => {
                        onExportData();
                        setShowDataMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export Data (JSON)
                    </button>
                    <label className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      Import Data
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          handleFileUpload(e);
                          setShowDataMenu(false);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {importNotice && (
          <div className="mt-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-center">
            {importNotice}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-800/60 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onTabChange('tracker')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'tracker'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>Habit Matrix</span>
          </button>

          <button
            onClick={() => onTabChange('insights')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'insights'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Weekly Insights</span>
          </button>

          <button
            onClick={() => onTabChange('goals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'goals'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Goal Setting</span>
          </button>
        </div>
      </div>
    </header>
  );
};
