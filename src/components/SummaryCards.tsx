import React from 'react';
import { Users, Building2, AlertCircle, CalendarClock } from 'lucide-react';
import { DailyReportItem } from '../types/report';

interface SummaryCardsProps {
  reports: DailyReportItem[];
  allReportsCount: number;
  selectedDate: string;
  onFilterRemarks?: () => void;
  isRemarksFiltered?: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  reports,
  allReportsCount,
  selectedDate,
  onFilterRemarks,
  isRemarksFiltered,
}) => {
  // Compute metrics
  const teamsSet = new Set(reports.map((r) => r.team));
  const totalTeams = teamsSet.size;
  const totalMembers = reports.length;

  const remarksList = reports.filter(
    (r) => r.remarks && r.remarks.trim() !== '' && !r.remarks.includes('특이사항 없음')
  );
  const totalRemarks = remarksList.length;

  const plannedTasksCount = reports.filter(
    (r) => r.tomorrowTasks && r.tomorrowTasks.trim() !== '' && r.tomorrowTasks !== '-'
  ).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 no-print">
      {/* Total Members */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">보고 인원</span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            {totalMembers}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {allReportsCount !== totalMembers ? `/ 전체 ${allReportsCount}명` : '명 작성 완료'}
          </span>
        </div>
      </div>

      {/* Total Teams */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">보고 팀</span>
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            {totalTeams}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">개 부서/팀</span>
        </div>
      </div>

      {/* Issues & Remarks */}
      <div
        onClick={onFilterRemarks}
        className={`bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-xs transition-all cursor-pointer hover:border-amber-400 dark:hover:border-amber-600 ${
          isRemarksFiltered
            ? 'border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/20 bg-amber-50/20'
            : 'border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">특이사항 / 이슈</span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
            {totalRemarks}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            건 {isRemarksFiltered ? '(필터 적용 중)' : '(클릭하여 필터)'}
          </span>
        </div>
      </div>

      {/* Tomorrow Plans */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">익일 계획 수립</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CalendarClock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            {plannedTasksCount}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            /{totalMembers}명 작성 완료
          </span>
        </div>
      </div>
    </div>
  );
};
