import React, { useState } from 'react';
import { DailyReportItem } from '../types/report';
import { ArrowUpDown, AlertCircle, Copy, Check } from 'lucide-react';

interface ReportTableProps {
  reports: DailyReportItem[];
  onOpenDetail: (item: DailyReportItem) => void;
  selectedDate: string;
}

export const ReportTable: React.FC<ReportTableProps> = ({
  reports,
  onOpenDetail,
  selectedDate,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'team' | 'author' | 'none'>('none');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const handleSort = (field: 'team' | 'author') => {
    if (sortField === field) {
      if (sortAsc) setSortAsc(false);
      else {
        setSortField('none');
        setSortAsc(true);
      }
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedReports = [...reports].sort((a, b) => {
    if (sortField === 'team') {
      return sortAsc ? a.team.localeCompare(b.team) : b.team.localeCompare(a.team);
    }
    if (sortField === 'author') {
      return sortAsc ? a.author.localeCompare(b.author) : b.author.localeCompare(a.author);
    }
    return 0;
  });

  const handleCopy = (item: DailyReportItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const formatted = `[${selectedDate} 일일 업무보고]\n- 부서: ${item.team}\n- 담당자: ${item.author}\n- 금일 업무:\n${item.todayTasks}\n- 업무 결과:\n${item.workResult || '-'}\n- 익일 업무:\n${item.tomorrowTasks}\n- 이슈사항 / 비고:\n${item.remarks}`;
    navigator.clipboard.writeText(formatted);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (reports.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center my-6">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          표시할 일일 업무보고 데이터가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs my-6 transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-3.5 w-12 text-center font-mono">No</th>
              <th
                onClick={() => handleSort('team')}
                className="py-3 px-4 w-36 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
              >
                <div className="flex items-center gap-1">
                  <span>팀명</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('author')}
                className="py-3 px-4 w-28 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
              >
                <div className="flex items-center gap-1">
                  <span>담당자</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 min-w-[220px]">금일 업무</th>
              <th className="py-3 px-4 min-w-[250px] bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 font-bold">
                업무 결과
              </th>
              <th className="py-3 px-4 min-w-[220px]">익일 업무</th>
              <th className="py-3 px-4 min-w-[180px]">이슈사항 / 비고</th>
              <th className="py-3 px-3 w-16 text-center no-print">복사</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {sortedReports.map((item, index) => {
              const hasRemarks =
                item.remarks &&
                item.remarks.trim() !== '' &&
                !item.remarks.includes('특이사항 없음');

              return (
                <tr
                  key={item.id}
                  onClick={() => onOpenDetail(item)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-3.5 text-center font-mono tabular-nums text-slate-400 dark:text-slate-500 text-xs">
                    {index + 1}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {item.team}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {item.author}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line">
                    {item.todayTasks}
                  </td>
                  <td className="py-3.5 px-4 text-slate-900 dark:text-slate-100 leading-relaxed font-normal whitespace-pre-line bg-emerald-50/20 dark:bg-emerald-950/10">
                    {item.workResult || '-'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line">
                    {item.tomorrowTasks}
                  </td>
                  <td className="py-3.5 px-4">
                    {hasRemarks ? (
                      <span className="inline-flex items-start gap-1 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-1 rounded text-xs leading-relaxed border border-amber-200/60 dark:border-amber-800/50">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span>{item.remarks}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">
                        {item.remarks || '-'}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center no-print" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleCopy(item, e)}
                      title="클립보드 복사"
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
