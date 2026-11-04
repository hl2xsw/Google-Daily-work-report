/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken
} from './services/firebaseAuth';
import {
  fetchSpreadsheetTabs,
  fetchSheetData,
  isMatchingTodayTab,
  getTodayTabPattern
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
import { AlertCircle, FileSpreadsheet, RefreshCw, Sun, Moon, Info } from 'lucide-react';

const STORAGE_KEY_SHEET_ID = 'daily_report_spreadsheet_id';
const STORAGE_KEY_SYNC_SOURCE = 'daily_report_sync_source';

export default function App() {
  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Sheet & Sync Configuration
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_SHEET_ID) || '';
  });
  const [syncSource, setSyncSource] = useState<SyncSource>(() => {
    return (localStorage.getItem(STORAGE_KEY_SYNC_SOURCE) as SyncSource) || 'demo_data';
  });

  // Tabs & Reports Data
  const [tabs, setTabs] = useState<SheetTabInfo[]>(MOCK_TABS);
  const [selectedTab, setSelectedTab] = useState<string>('11/03 (화)');
  const [todayTabTitle, setTodayTabTitle] = useState<string>('11/03 (화)');
  const [reports, setReports] = useState<DailyReportItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());

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
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setSyncError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setSyncError('Google 로그인에 실패하였습니다. 팝업 차단 여부를 확인해주세요.');
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
    localStorage.setItem(STORAGE_KEY_SHEET_ID, id);
    setSyncSource('google_sheets');
    localStorage.setItem(STORAGE_KEY_SYNC_SOURCE, 'google_sheets');
  };

  const handleSwitchSource = (source: SyncSource) => {
    setSyncSource(source);
    localStorage.setItem(STORAGE_KEY_SYNC_SOURCE, source);
    setSyncError(null);
  };

  // Synchronize Tabs and Report Data
  const synchronizeData = useCallback(async () => {
    setIsSyncing(true);
    setSyncError(null);

    try {
      if (syncSource === 'google_sheets' && spreadsheetId && accessToken) {
        // Fetch real tabs from Google Sheets API
        const fetchedTabs = await fetchSpreadsheetTabs(spreadsheetId, accessToken);
        if (fetchedTabs.length > 0) {
          setTabs(fetchedTabs);

          // Find today's tab among fetched tabs
          const matchedToday = fetchedTabs.find((t) => t.isToday);
          const activeTodayTitle = matchedToday ? matchedToday.title : fetchedTabs[0].title;
          setTodayTabTitle(activeTodayTitle);

          // If selectedTab is not in fetched tabs, default to today or first tab
          const targetTab = fetchedTabs.some((t) => t.title === selectedTab)
            ? selectedTab
            : activeTodayTitle;
          setSelectedTab(targetTab);

          // Fetch rows for the target tab
          const data = await fetchSheetData(spreadsheetId, targetTab, accessToken);
          setReports(data);
        } else {
          throw new Error('스프레드시트에 시트 탭이 존재하지 않습니다.');
        }
      } else {
        // Fallback to Rich Mock Dataset matching user's 11월 업무일지 tabs
        setTabs(MOCK_TABS);
        const todayMatch = MOCK_TABS.find((t) => t.isToday);
        const todayTitle = todayMatch ? todayMatch.title : '11/03 (화)';
        setTodayTabTitle(todayTitle);

        const tabToLoad = selectedTab || todayTitle;
        const data = MOCK_REPORTS_BY_DATE[tabToLoad] || MOCK_REPORTS_BY_DATE['11/03 (화)'] || [];
        setReports(data);
      }
      setLastSyncedAt(new Date());
    } catch (err: any) {
      console.error('Sync failed:', err);
      setSyncError(err.message || '데이터를 동기화하는 중 오류가 발생했습니다.');
      // Keep existing data or load mock as safe fallback
      if (reports.length === 0) {
        setReports(MOCK_REPORTS_BY_DATE[selectedTab] || MOCK_REPORTS_BY_DATE['11/03 (화)'] || []);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [syncSource, spreadsheetId, accessToken, selectedTab]);

  // Initial load and sync on tab change or token update
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

      // Search query filter
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
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        syncSource={syncSource}
        onOpenSettings={() => setIsConfigOpen(true)}
        onManualSync={synchronizeData}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
        spreadsheetId={spreadsheetId}
      />

      {/* 2. Error / Notice Banner */}
      {syncError && (
        <div className="bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-900 px-4 py-2.5 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between no-print">
          <div className="flex items-center gap-2 max-w-4xl">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="font-medium">{syncError}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {syncSource === 'google_sheets' && !user && (
              <button
                onClick={handleLogin}
                className="underline font-bold text-rose-900 dark:text-rose-100 hover:opacity-80"
              >
                Google 로그인하기
              </button>
            )}
            <button
              onClick={() => handleSwitchSource('demo_data')}
              className="px-2 py-1 bg-white dark:bg-slate-900 rounded border border-rose-200 dark:border-rose-800 text-xs font-semibold hover:bg-rose-100"
            >
              데모 모드로 전환
            </button>
          </div>
        </div>
      )}

      {/* Demo Mode Notice Banner (if in demo mode) */}
      {syncSource === 'demo_data' && (
        <div className="bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 px-4 py-2 text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between no-print">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              현재 <strong>2026년 11월 업무일지</strong> 샘플 데이터가 로드되어 있습니다. 실제 Google Sheets로 동기화하려면 상단의 <strong>[시트 설정]</strong>에서 스프레드시트 URL을 입력하세요.
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

        {/* Loading Indicator */}
        {isSyncing ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {syncSource === 'google_sheets' ? 'Google Sheets 데이터를 불러오는 중...' : '업무보고 데이터를 로딩하는 중...'}
            </p>
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
        onLogin={handleLogin}
      />

      <DetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        selectedDate={selectedTab}
      />
    </div>
  );
}
