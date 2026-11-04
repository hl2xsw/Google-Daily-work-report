import React from 'react';
import { User } from 'firebase/auth';
import { Settings2, RefreshCw, FileSpreadsheet, LogIn, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { SyncSource } from '../types/report';

interface NavbarProps {
  user: User | null;
  hasAccessToken: boolean;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  syncSource: SyncSource;
  onOpenSettings: () => void;
  onManualSync: () => void;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  spreadsheetId: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  hasAccessToken,
  onLogin,
  onLogout,
  isLoggingIn,
  syncSource,
  onOpenSettings,
  onManualSync,
  isSyncing,
  lastSyncedAt,
  spreadsheetId,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight whitespace-nowrap">
              팀별 일일 업무보고 통합 시스템
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
              Google Sheets 일일 업무일지 실시간 연동
            </p>
          </div>
        </div>

        {/* Zone 2: Navigation & Sync Source Info */}
        <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            {syncSource === 'google_sheets' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-slate-800 dark:text-slate-200 font-semibold">Google Sheets 실시간 연동</span>
                <span className="text-slate-400 dark:text-slate-500">·</span>
                <span className="text-slate-500 dark:text-slate-400 max-w-[140px] truncate font-mono" title={spreadsheetId}>
                  {spreadsheetId ? `ID: ${spreadsheetId.slice(0, 10)}...` : '시트 미설정'}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">11월 업무일지 데모 모드</span>
                <span className="text-slate-400 dark:text-slate-500">·</span>
                <span className="text-slate-500 dark:text-slate-400">R&D 통합 데이터</span>
              </>
            )}
          </div>

          {lastSyncedAt && (
            <span className="text-slate-400 dark:text-slate-500 whitespace-nowrap font-mono tabular-nums">
              최근 동기화: {lastSyncedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>

        {/* Zone 3: Actions & Auth */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onManualSync}
            disabled={isSyncing}
            title="시트 최신 데이터 동기화"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? '동기화 중...' : '새로고침'}</span>
          </button>

          <button
            onClick={onOpenSettings}
            title="Google Sheets 연동 설정"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">시트 설정</span>
          </button>

          {user && hasAccessToken ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
              )}
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200 hidden lg:inline max-w-[120px] truncate">
                {user.displayName || user.email}
              </span>
              <button
                onClick={onLogout}
                title="로그아웃"
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : user && !hasAccessToken ? (
            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              title="세션 만료: Google 토큰 갱신이 필요합니다"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200 rounded-lg border border-amber-300 dark:border-amber-700 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>{isLoggingIn ? '갱신 중...' : 'Google 인증 갱신'}</span>
            </button>
          ) : (
            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-60"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isLoggingIn ? '인증 진행 중...' : 'Google 로그인'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
