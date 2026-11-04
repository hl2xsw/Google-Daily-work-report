/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout
} from './services/firebaseAuth';
import {
  fetchSpreadsheetTabs,
  fetchSheetData,
  isMatchingTodayTab,
  getTodayFormatted
} from './services/sheetsService';
import { exportToExcel, exportToCsv } from './services/exportService';
import { MOCK_TABS, MOCK_REPORTS_BY_DATE } from './data/mockReports';
import { DailyReportItem, SheetTabInfo, ViewMode, SyncSource } from './types/report';

import { Navbar } from './components/Navbar';
import { Toolbar } from './components/Toolbar';
import { SummaryCards } from './components/SummaryCards';
import { TeamCardGrid } from './components/TeamCardGrid';
import { ReportTable } from './components/ReportTable';
import { SheetConfigModal } from './components/SheetConfigModal';
import { DetailModal } from './components/DetailModal';
import { PopupBlockGuideModal } from './components/PopupBlockGuideModal';
import { AlertCircle, FileSpreadsheet, RefreshCw, Sun, Moon, Info, LogIn, ExternalLink, HelpCircle } from 'lucide-react';

const STORAGE_KEY_SHEET_ID = 'daily_report_spreadsheet_id';
const STORAGE_KEY_SYNC_SOURCE = 'daily_report_sync_source';

export default function App() {
  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dynamic Today Date (e.g. "11/04 (수)")
  const initialToday = useMemo(() => getTodayFormatted(), []);

  // Sheet & Sync Configuration with safe storage
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_SHEET_ID) || '';
    } catch {
      return '';
    }
  });

  const [syncSource, setSyncSource] = useState<SyncSource>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SYNC_SOURCE);
      if (saved === 'google_sheets' || saved === 'demo_data') return saved;
      return 'google_sheets'; // Default to Google Sheets as requested
    } catch {
      return 'google_sheets';
    }
  });

  // Tabs & Reports Data
  const [tabs, setTabs] = useState<SheetTabInfo[]>(MOCK_TABS);
  const [selectedTab, setSelectedTab] = useState<string>(initialToday.full);
  const [todayTabTitle, setTodayTabTitle] = useState<string>(initialToday.full);
  const [reports, setReports] = useState<DailyReportItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Filters & Views
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyRemarks, setOnlyRemarks] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Modals
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [detailItem, setDetailItem] = useState<DailyReportItem | null>(null);

  // Dark Mode Class Sync
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Initialize Firebase Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const [showPopupHelp, setShowPopupHelp] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setSyncError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setShowPopupHelp(false);
        // Automatically sync with newly acquired token
        synchronizeData(result.accessToken);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err.message || 'Google 로그인에 실패하였습니다.';
      setSyncError(msg);
      if (msg.includes('팝업') || err.code === 'auth/popup-blocked') {
        setShowPopupHelp(true);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
  };

  const handleSaveSpreadsheetId = (id: string) => {
    setSpreadsheetId(id);
    try {
      localStorage.setItem(STORAGE_KEY_SHEET_ID, id);
      localStorage.setItem(STORAGE_KEY_SYNC_SOURCE, 'google_sheets');
    } catch {}
    setSyncSource('google_sheets');
    setSyncError(null);
  };

  const handleSwitchSource = (source: SyncSource) => {
    setSyncSource(source);
    try {
      localStorage.setItem(STORAGE_KEY_SYNC_SOURCE, source);
    } catch {}
    setSyncError(null);
    setSyncNotice(null);
  };

  // Synchronize Tabs and Report Data
  const synchronizeData = useCallback(async (tokenOverride?: string | null) => {
    setIsSyncing(true);
    setSyncError(null);
    setSyncNotice(null);

    const activeToken = tokenOverride !== undefined ? tokenOverride : accessToken;

    if (syncSource === 'google_sheets') {
      if (!spreadsheetId) {
        setIsSyncing(false);
        setReports([]);
        setSyncError('연동할 Google Spreadsheet URL 또는 ID를 설정해주세요. 상단의 [시트 설정] 버튼을 클릭하세요.');
        return;
      }

      try {
        // Fetch tabs from Google Sheets (OAuth token or public/link-shared GViz)
        const fetchedTabs = await fetchSpreadsheetTabs(spreadsheetId, activeToken);
        if (fetchedTabs.length > 0) {
          setTabs(fetchedTabs);

          // Find today's tab dynamically
          const matchedToday = fetchedTabs.find((t) => t.isToday);
          let targetTab: string;

          if (matchedToday) {
            targetTab = matchedToday.title;
            setTodayTabTitle(matchedToday.title);
          } else {
            // If today's tab (e.g. 11/04) is not found, default to most recent matching or first tab
            const fallbackTab = fetchedTabs.find((t) => t.title.includes('11/03')) || fetchedTabs[0];
            targetTab = fallbackTab.title;
            setTodayTabTitle(targetTab);
            const { full } = getTodayFormatted();
            setSyncNotice(`시트에 오늘 날짜(${full}) 탭이 아직 등록되지 않아, 가장 최근 일자인 '${targetTab}' 탭의 데이터를 표시합니다.`);
          }

          // If current selectedTab is already valid in fetchedTabs, keep user choice, else switch to targetTab
          const finalTabToLoad = (selectedTab && fetchedTabs.some((t) => t.title === selectedTab))
            ? selectedTab
            : targetTab;

          setSelectedTab(finalTabToLoad);

          // Fetch sheet data for that tab
          const data = await fetchSheetData(spreadsheetId, finalTabToLoad, activeToken);
          setReports(data);
          setLastSyncedAt(new Date());
        } else {
          throw new Error('스프레드시트에 시트 탭이 존재하지 않습니다.');
        }
      } catch (err: any) {
        console.error('Google Sheets sync failed:', err);
        setReports([]);
        setSyncError(err.message || 'Google Sheets 데이터를 불러오지 못했습니다.');
      } finally {
        setIsSyncing(false);
      }
      return;
    }

    // Demo Mode: 11월 업무일지 사전 탑재 데이터
    setTabs(MOCK_TABS);
    const todayMatch = MOCK_TABS.find((t) => t.isToday);
    const todayTitle = todayMatch ? todayMatch.title : '11/03 (화)';
    setTodayTabTitle(todayTitle);

    const tabToLoad = selectedTab || todayTitle;
    const data = MOCK_REPORTS_BY_DATE[tabToLoad] || MOCK_REPORTS_BY_DATE['11/03 (화)'] || [];
    setReports(data);
    setLastSyncedAt(new Date());
    setIsSyncing(false);
  }, [syncSource, spreadsheetId, accessToken, selectedTab]);

  // Initial load and sync on dependencies update
  useEffect(() => {
    synchronizeData();
  }, [selectedTab, syncSource, spreadsheetId, accessToken]);

  // Extract unique teams for filtering
  const allTeams = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      if (r.team) set.add(r.team);
    });
    return Array.from(set);
  }, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      // Team filter
      if (selectedTeam !== 'all' && item.team !== selectedTeam) {
        return false;
      }

      // Remarks only filter
      if (onlyRemarks) {
        const hasRemark =
          item.remarks &&
          item.remarks.trim() !== '' &&
          !item.remarks.includes('특이사항 없음');
        if (!hasRemark) return false;
      }

      // Search query filter across all fields including workResult
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchAuthor = item.author.toLowerCase().includes(query);
        const matchTeam = item.team.toLowerCase().includes(query);
        const matchToday = item.todayTasks.toLowerCase().includes(query);
        const matchResult = (item.workResult || '').toLowerCase().includes(query);
        const matchTomorrow = item.tomorrowTasks.toLowerCase().includes(query);
        const matchRemarks = item.remarks.toLowerCase().includes(query);

        return matchAuthor || matchTeam || matchToday || matchResult || matchTomorrow || matchRemarks;
      }

      return true;
    });
  }, [reports, selectedTeam, onlyRemarks, searchQuery]);

  // Export handlers
  const handleExportExcel = () => {
    exportToExcel(filteredReports, selectedTab);
  };

  const handleExportCsv = () => {
    exportToCsv(filteredReports, selectedTab);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* 1. Header Navigation Bar */}
      <Navbar
        user={user}
        hasAccessToken={!!accessToken}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        syncSource={syncSource}
        onOpenSettings={() => setIsConfigOpen(true)}
        onManualSync={() => synchronizeData()}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
        spreadsheetId={spreadsheetId}
      />

      {/* 2. Error / Action Banner */}
      {syncError && (
        <div className="bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-900 px-4 py-3 text-xs text-rose-800 dark:text-rose-200 no-print">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="font-medium">{syncError}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!accessToken && (
                <>
                  <button
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Google 로그인하기</span>
                  </button>
                  <button
                    onClick={() => setShowPopupHelp(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>팝업 차단 해결법</span>
                  </button>
                </>
              )}
              <button
                onClick={() => setIsConfigOpen(true)}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded border border-rose-300 dark:border-rose-800 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                시트 주소 설정
              </button>
              <button
                onClick={() => handleSwitchSource('demo_data')}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-800 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                데모 모드로 전환
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notice Banner (e.g. today tab missing fallback) */}
      {syncNotice && !syncError && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 px-4 py-2 text-xs text-amber-800 dark:text-amber-200 no-print">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{syncNotice}</span>
          </div>
        </div>
      )}

      {/* Demo Mode Notice Banner */}
      {syncSource === 'demo_data' && (
        <div className="bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 px-4 py-2 text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between no-print">
          <div className="max-w-7xl mx-auto flex items-center gap-2 w-full">
            <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              현재 <strong>11월 업무일지 사전 탑재 데모 데이터</strong>가 표시 중입니다. 사용자의 실제 Google Sheets와 연동하려면 상단 <strong>[시트 설정]</strong>에서 URL을 지정하세요.
            </span>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="ml-auto underline font-semibold whitespace-nowrap text-blue-700 dark:text-blue-200"
            >
              내 시트 연결하기 →
            </button>
          </div>
        </div>
      )}

      {/* 3. Filter & Control Toolbar */}
      <Toolbar
        tabs={tabs}
        selectedTab={selectedTab}
        onSelectTab={(tab) => setSelectedTab(tab)}
        teams={allTeams}
        selectedTeam={selectedTeam}
        onSelectTeam={(team) => setSelectedTeam(team)}
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
        onlyRemarks={onlyRemarks}
        onToggleOnlyRemarks={() => setOnlyRemarks((prev) => !prev)}
        viewMode={viewMode}
        onViewModeChange={(m) => setViewMode(m)}
        onExportExcel={handleExportExcel}
        onExportCsv={handleExportCsv}
        onPrint={handlePrint}
        todayTabTitle={todayTabTitle}
      />

      {/* 4. Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Printable Document Header (shown when printed) */}
        <div className="hidden print:block mb-6 border-b pb-4">
          <div className="text-xl font-bold text-black">팀별 일일 업무보고 종합 보고서</div>
          <div className="text-sm text-gray-600 mt-1">
            보고 일자: {selectedTab} · 출력 일시: {new Date().toLocaleString('ko-KR')}
          </div>
        </div>

        {/* Summary Metric Cards */}
        <SummaryCards
          reports={filteredReports}
          allReportsCount={reports.length}
          selectedDate={selectedTab}
          onFilterRemarks={() => setOnlyRemarks((prev) => !prev)}
          isRemarksFiltered={onlyRemarks}
        />

        {/* Loading / Content States */}
        {isSyncing ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {syncSource === 'google_sheets' ? 'Google Sheets 데이터를 불러오는 중...' : '업무보고 데이터를 로딩하는 중...'}
            </p>
          </div>
        ) : syncSource === 'google_sheets' && !accessToken && reports.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-10 text-center my-6 max-w-lg mx-auto shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 mx-auto flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Google 계정 인증 또는 시트 공유 설정 필요
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                비공개 스프레드시트의 데이터를 가져오려면 Google 로그인이 필요합니다.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all disabled:opacity-60"
              >
                <LogIn className="w-4 h-4" />
                <span>{isLoggingIn ? '로그인 진행 중...' : 'Google 로그인으로 연동'}</span>
              </button>
              <button
                onClick={() => setShowPopupHelp(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-xl border border-amber-200 dark:border-amber-800 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>팝업 차단 해결 가이드</span>
              </button>
            </div>
            <div className="pt-2 text-left bg-emerald-50/70 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900 text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
              <div className="font-semibold flex items-center gap-1 text-emerald-900 dark:text-emerald-200">
                <span>💡 로그인 팝업 없이 바로 보는 방법:</span>
              </div>
              <p className="leading-relaxed">
                스프레드시트 우측 상단 <strong>[공유]</strong>에서 일반 액세스를 <strong>"링크가 있는 모든 사용자 (뷰어)"</strong>로 설정하시면 로그인/팝업 없이 즉시 실시간 연동됩니다.
              </p>
            </div>
          </div>
        ) : viewMode === 'cards' ? (
          <TeamCardGrid
            reports={filteredReports}
            searchQuery={searchQuery}
            onOpenDetail={(item) => setDetailItem(item)}
            selectedDate={selectedTab}
          />
        ) : (
          <ReportTable
            reports={filteredReports}
            onOpenDetail={(item) => setDetailItem(item)}
            selectedDate={selectedTab}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 dark:text-slate-400 no-print transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>팀별 일일 업무보고 통합 관리 시스템 · Google Sheets API v4 Sync</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDarkMode((prev) => !prev)}
              className="inline-flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>라이트 모드</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5" />
                  <span>다크 모드</span>
                </>
              )}
            </button>
            <span>v1.0</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SheetConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        spreadsheetId={spreadsheetId}
        onSaveSpreadsheetId={handleSaveSpreadsheetId}
        syncSource={syncSource}
        onSwitchSource={handleSwitchSource}
        isLoggedIn={!!user}
        hasAccessToken={!!accessToken}
        onLogin={handleLogin}
      />

      <DetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        selectedDate={selectedTab}
      />

      <PopupBlockGuideModal
        isOpen={showPopupHelp}
        onClose={() => setShowPopupHelp(false)}
        onRetryLogin={handleLogin}
        spreadsheetId={spreadsheetId}
      />
    </div>
  );
}
