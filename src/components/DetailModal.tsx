import React, { useState } from 'react';
import { X, Copy, Check, Printer, Building, User as UserIcon, CheckCircle2, Award, Clock, AlertTriangle } from 'lucide-react';
import { DailyReportItem } from '../types/report';

interface DetailModalProps {
  item: DailyReportItem | null;
  onClose: () => void;
  selectedDate: string;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  item,
  onClose,
  selectedDate,
}) => {
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const handleCopyMarkdown = () => {
    const text = `### [${selectedDate} 일일 업무보고]\n- **부서/팀**: ${item.team}\n- **담당자**: ${item.author}\n\n#### 1. 금일 업무\n${item.todayTasks}\n\n#### 2. 업무 결과\n${item.workResult || '-'}\n\n#### 3. 익일 업무\n${item.tomorrowTasks}\n\n#### 4. 이슈사항 / 비고\n${item.remarks}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasRemarks =
    item.remarks &&
    item.remarks.trim() !== '' &&
    !item.remarks.includes('특이사항 없음');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 transition-colors max-h-[90vh] overflow-y-auto print:shadow-none print:border-none print:p-0">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <Building className="w-3.5 h-3.5" />
              <span>{item.team}</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="text-slate-500 dark:text-slate-400 font-mono">{selectedDate}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-slate-400" />
              <span>{item.author}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors no-print"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-3.5 text-xs">
          {/* 1. 금일 업무 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>금일 업무</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 p-3.5 rounded-xl text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line text-xs font-normal">
              {item.todayTasks}
            </div>
          </div>

          {/* 2. 업무 결과 (새로운 섹션) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 text-xs">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>업무 결과</span>
            </div>
            <div className="bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-3.5 rounded-xl text-emerald-950 dark:text-emerald-100 leading-relaxed whitespace-pre-line text-xs font-normal">
              {item.workResult || '-'}
            </div>
          </div>

          {/* 3. 익일 업무 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs">
              <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>익일 업무</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 p-3.5 rounded-xl text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line text-xs font-normal">
              {item.tomorrowTasks}
            </div>
          </div>

          {/* 4. 이슈사항 / 비고 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs">
              <AlertTriangle className={`w-4 h-4 ${hasRemarks ? 'text-amber-500' : 'text-slate-400'}`} />
              <span>이슈사항 / 비고</span>
            </div>
            <div
              className={`p-3.5 rounded-xl border leading-relaxed whitespace-pre-line text-xs font-normal ${
                hasRemarks
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-400'
              }`}
            >
              {item.remarks || '특이사항 없음'}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 no-print">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>인쇄하기</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>복사 완료!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Slack/보고서 양식 복사</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
