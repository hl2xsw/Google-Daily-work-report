import React from 'react';
import { X, ShieldAlert, CheckCircle, ExternalLink, Globe, HelpCircle } from 'lucide-react';

interface PopupBlockGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetryLogin: () => void;
  spreadsheetId: string;
}

export const PopupBlockGuideModal: React.FC<PopupBlockGuideModalProps> = ({
  isOpen,
  onClose,
  onRetryLogin,
  spreadsheetId,
}) => {
  if (!isOpen) return null;

  const sheetUrl = spreadsheetId.startsWith('http')
    ? spreadsheetId
    : `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                로그인 팝업 차단 해결 가이드
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                브라우저 보안 설정으로 인한 팝업 차단 해제 방법
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

        {/* Quick Solution 1: Zero-login Link Sharing (Recommended) */}
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
              방법 1 (가장 추천): 구글 시트 링크 공유 설정 (로그인/팝업 불필요!)
            </span>
          </div>
          <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed pl-6">
            스프레드시트를 <strong>"링크가 있는 모든 사용자(뷰어)"</strong>로 설정하시면, 팝업 차단 걱정 없이 로그인 과정 없이도 시트 데이터를 실시간으로 즉시 불러옵니다.
          </p>
          <div className="pl-6 pt-1">
            <a
              href={sheetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline"
            >
              <span>내 구글 시트에서 [공유] 설정 바로가기</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Solution 2: Browser Popup Unblock Steps */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>방법 2: 브라우저 주소창에서 팝업 차단 해제하기</span>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-slate-800 dark:text-slate-200">주소창 우측 아이콘 확인:</strong>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  브라우저 상단 주소창 맨 오른쪽(북마크 별표 근처)에 표시된 <strong>🚫 (팝업 차단됨)</strong> 아이콘을 클릭합니다.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-slate-800 dark:text-slate-200">항상 허용 선택:</strong>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  <strong>'이 사이트의 팝업 및 리디렉션을 항상 허용'</strong> 라디오 버튼을 선택한 후 <strong>[완료]</strong> 버튼을 누릅니다.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-slate-800 dark:text-slate-200">로그인 재시도:</strong>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  아래의 <strong>[다시 로그인하기]</strong> 버튼을 누르면 정상적으로 Google 계정 로그인 팝업이 열립니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onRetryLogin();
            }}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            다시 로그인하기
          </button>
        </div>
      </div>
    </div>
  );
};
