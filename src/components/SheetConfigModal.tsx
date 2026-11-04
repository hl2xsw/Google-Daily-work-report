import React, { useState } from 'react';
import { X, FileSpreadsheet, Key, ExternalLink, Check, AlertCircle, HelpCircle } from 'lucide-react';
import { SyncSource } from '../types/report';
import { extractSpreadsheetId } from '../services/sheetsService';

interface SheetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  spreadsheetId: string;
  onSaveSpreadsheetId: (id: string) => void;
  syncSource: SyncSource;
  onSwitchSource: (source: SyncSource) => void;
  isLoggedIn: boolean;
  onLogin: () => void;
}

export const SheetConfigModal: React.FC<SheetConfigModalProps> = ({
  isOpen,
  onClose,
  spreadsheetId,
  onSaveSpreadsheetId,
  syncSource,
  onSwitchSource,
  isLoggedIn,
  onLogin,
}) => {
  const [inputVal, setInputVal] = useState(spreadsheetId);
  const [errorMsg, setErrorMsg] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = extractSpreadsheetId(inputVal);
    if (!cleanId) {
      setErrorMsg('스프레드시트 URL 또는 ID를 올바르게 입력해주세요.');
      return;
    }
    setErrorMsg('');
    onSaveSpreadsheetId(cleanId);
    onSwitchSource('google_sheets');
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleUseDemo = () => {
    onSwitchSource('demo_data');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Google Sheets 연동 설정
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                일일 업무일지가 저장된 구글 스프레드시트 주소를 지정합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sync Mode Selector */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            현재 데이터 소스
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSwitchSource('google_sheets')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                syncSource === 'google_sheets'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Google Sheets 실시간 연동
            </button>
            <button
              type="button"
              onClick={handleUseDemo}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                syncSource === 'demo_data'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              11월 업무일지 데모 데이터
            </button>
          </div>
        </div>

        {/* Google Account Authentication Status */}
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Google 계정 인증 상태
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {isLoggedIn
                  ? '구글 계정이 연결되어 시트를 안전하게 조회할 수 있습니다.'
                  : '시트 접근을 위해 Google 로그인이 필요할 수 있습니다.'}
              </div>
            </div>
          </div>
          {!isLoggedIn && (
            <button
              type="button"
              onClick={onLogin}
              className="px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
            >
              로그인
            </button>
          )}
        </div>

        {/* Sheet URL/ID Input Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Google Spreadsheet URL 또는 ID
            </label>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                setErrorMsg('');
              }}
              placeholder="예: https://docs.google.com/spreadsheets/d/1BxiMVs0... 또는 Sheet ID"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
            {errorMsg && (
              <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </p>
            )}
          </div>

          {/* Guide Tips */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
              <span>시트 탭 및 열(컬럼) 형식 안내:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 pl-1 leading-relaxed">
              <li>
                시트 탭 이름은 <strong>"11/02 (월)"</strong>, <strong>"11/03 (화)"</strong> 형식이어야 오늘 날짜 탭으로 자동 인식됩니다.
              </li>
              <li>
                열 구조는 <strong>[담당자, 금일 업무, 업무 결과, 익일 업무, 이슈사항, 비고]</strong> 순서를 지원합니다.
              </li>
            </ul>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>설정 완료</span>
                </>
              ) : (
                <span>저장 및 동기화</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
