import React from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Printer,
  LayoutGrid,
  Table as TableIcon,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { SheetTabInfo, ViewMode } from '../types/report';

interface ToolbarProps {
  tabs: SheetTabInfo[];
  selectedTab: string;
  onSelectTab: (tabTitle: string) => void;
  teams: string[];
  selectedTeam: string;
  onSelectTeam: (team: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onlyRemarks: boolean;
  onToggleOnlyRemarks: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  onPrint: () => void;
  todayTabTitle: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  tabs,
  selectedTab,
  onSelectTab,
  teams,
  selectedTeam,
  onSelectTeam,
  searchQuery,
  onSearchChange,
  onlyRemarks,
  onToggleOnlyRemarks,
  viewMode,
  onViewModeChange,
  onExportExcel,
  onExportCsv,
  onPrint,
  todayTabTitle,
}) => {
  const currentIndex = tabs.findIndex((t) => t.title === selectedTab);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < tabs.length - 1;

  const handlePrev = () => {
    if (hasPrev) onSelectTab(tabs[currentIndex - 1].title);
  };

  const handleNext = () => {
    if (hasNext) onSelectTab(tabs[currentIndex + 1].title);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3.5 px-4 sm:px-6 lg:px-8 space-y-3 transition-colors no-print">
      {/* Top Row: Date Navigation & Primary Export Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Date Selector Group */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={handlePrev}
              disabled={!hasPrev}
              title="이전 날짜"
              className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-2.5">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <select
                value={selectedTab}
                onChange={(e) => onSelectTab(e.target.value)}
                className="bg-transparent font-semibold text-sm text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer py-1"
              >
                {tabs.map((tab) => (
                  <option
                    key={tab.title}
                    value={tab.title}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    {tab.title} {tab.isToday ? '(오늘)' : ''}
                  </option>
                ))}
                {!tabs.some((t) => t.title === selectedTab) && selectedTab && (
                  <option value={selectedTab}>{selectedTab}</option>
                )}
              </select>
            </div>

            <button
              onClick={handleNext}
              disabled={!hasNext}
              title="다음 날짜"
              className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick "Today" Jump Button */}
          {todayTabTitle && selectedTab !== todayTabTitle && (
            <button
              onClick={() => onSelectTab(todayTabTitle)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 transition-colors border border-blue-200 dark:border-blue-800"
            >
              오늘 ({todayTabTitle})
            </button>
          )}
        </div>

        {/* View Mode & Export Actions */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onViewModeChange('cards')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>팀별 카드</span>
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>표 형태</span>
            </button>
          </div>

          {/* Excel Export Menu */}
          <div className="flex items-center gap-1">
            <button
              onClick={onExportExcel}
              title="엑셀 파일 (.xlsx) 다운로드"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>엑셀(.xlsx) 내보내기</span>
            </button>

            <button
              onClick={onExportCsv}
              title="CSV 파일 다운로드"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>

          <button
            onClick={onPrint}
            title="업무보고서 인쇄 / PDF 출력"
            className="p-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Row: Team Filters & Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/60">
        {/* Team Segmented Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <button
            onClick={() => onSelectTeam('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
              selectedTeam === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            전체 팀
          </button>

          {teams.map((team) => (
            <button
              key={team}
              onClick={() => onSelectTeam(team)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedTeam === team
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {team}
            </button>
          ))}
        </div>

        {/* Search & Only Remarks Filter */}
        <div className="flex items-center gap-2">
          {/* Remarks Only Toggle */}
          <button
            onClick={onToggleOnlyRemarks}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              onlyRemarks
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${onlyRemarks ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
            <span>특이사항만 보기</span>
          </button>

          {/* Search Box */}
          <div className="relative min-w-[200px] sm:min-w-[260px]">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="작성자, 업무내용, 특이사항 검색..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
