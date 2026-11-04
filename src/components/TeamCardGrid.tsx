import React, { useState } from 'react';
import {
  Copy,
  Check,
  Maximize2,
  AlertTriangle,
  Building,
  CheckCircle2,
  Award,
  Clock
} from 'lucide-react';
import { DailyReportItem, SearchScope } from '../types/report';

interface TeamCardGridProps {
  reports: DailyReportItem[];
  searchQuery: string;
  onOpenDetail: (item: DailyReportItem) => void;
  selectedDate: string;
  searchScope?: SearchScope;
}

export const TeamCardGrid: React.FC<TeamCardGridProps> = ({
  reports,
  searchQuery,
  onOpenDetail,
  selectedDate,
  searchScope = 'current',
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Group reports by team
  const teamsMap = new Map<string, DailyReportItem[]>();
  reports.forEach((item) => {
    const list = teamsMap.get(item.team) || [];
    list.push(item);
    teamsMap.set(item.team, list);
  });

  const handleCopy = (item: DailyReportItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const itemDate = item.date || selectedDate;
    const formatted = `[${itemDate} 일일 업무보고]\n- 부서/팀: ${item.team}\n- 담당자: ${item.author}\n\n■ 금일 업무\n${item.todayTasks}\n\n■ 업무 결과\n${item.workResult || '-'}\n\n■ 익일 업무\n${item.tomorrowTasks}\n\n■ 이슈사항 / 비고\n${item.remarks}`;
    navigator.clipboard.writeText(formatted);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (reports.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center my-6">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <Building className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">일치하는 업무보고가 없습니다</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {searchQuery
            ? `'${searchQuery}' (${searchScope === 'all' ? '전체 일자' : selectedDate}) 검색 조건에 맞는 항목이 없습니다.`
            : '등록된 일일 업무보고 데이터가 없습니다.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 my-6">
      {Array.from(teamsMap.entries()).map(([teamName, teamMembers]) => (
        <section key={teamName} className="space-y-3">
          {/* Team Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {teamName}
              </h2>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                ({teamMembers.length}건)
              </span>
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              {searchScope === 'all' ? '전체 일자 검색' : selectedDate}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((item) => {
              const hasRemarks =
                item.remarks &&
                item.remarks.trim() !== '' &&
                !item.remarks.includes('특이사항 없음');

              return (
                <div
                  key={item.id}
                  onClick={() => onOpenDetail(item)}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
                >
                  <div className="space-y-3">
                    {/* Card Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.author}
                          </h3>
                          {(searchScope === 'all' || (item.date && item.date !== selectedDate)) && item.date && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-semibold font-mono">
                              {item.date}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {item.team}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleCopy(item, e)}
                          title="업무보고 복사"
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetail(item);
                          }}
                          title="상세보기"
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 1. 금일 업무 */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>금일 업무</span>
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 whitespace-pre-line line-clamp-3 font-normal">
                        {item.todayTasks}
                      </div>
                    </div>

                    {/* 2. 업무 결과 (신규 추가된 핵심 섹션) */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>업무 결과</span>
                      </div>
                      <div className="text-xs text-emerald-950 dark:text-emerald-100 leading-relaxed bg-emerald-50/60 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200/70 dark:border-emerald-800/50 whitespace-pre-line line-clamp-4 font-normal">
                        {item.workResult || '-'}
                      </div>
                    </div>

                    {/* 3. 익일 업무 */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                        <span>익일 업무</span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 whitespace-pre-line line-clamp-3 font-normal">
                        {item.tomorrowTasks}
                      </div>
                    </div>
                  </div>

                  {/* 4. 이슈사항 / 비고 Banner */}
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    {hasRemarks ? (
                      <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-semibold block text-[11px] text-amber-700 dark:text-amber-300">이슈사항 / 비고</span>
                          <span className="line-clamp-2 leading-relaxed">{item.remarks}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
                        <span>이슈/비고: 없음</span>
                        <span className="text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                          상세보기 →
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};
