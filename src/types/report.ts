export interface DailyReportItem {
  id: string;
  team: string;            // 팀명 (예: R&D 기획팀, SW개발팀)
  author: string;          // 담당자 / 성명 (예: 전재민, 최창우)
  todayTasks: string;      // 금일 업무
  workResult: string;      // 업무 결과 (신규 추가)
  tomorrowTasks: string;   // 익일 업무
  remarks: string;         // 이슈사항 / 비고 (통합 특이사항)
  issues?: string;         // 세부 이슈사항
  note?: string;           // 비고
  date?: string;           // 소속 일자 (예: "11/03 (화)")
  rawRowIndex?: number;
}

export interface SheetTabInfo {
  sheetId: number;
  title: string;           // e.g. "11/03 (화)", "11/02 (월)"
  isToday?: boolean;
}

export type ViewMode = 'cards' | 'table';

export type SyncSource = 'google_sheets' | 'demo_data';

export type SearchScope = 'current' | 'all';

export interface ReportFilter {
  selectedTeam: string;
  searchQuery: string;
  onlyRemarks: boolean;
  searchScope: SearchScope;
}
