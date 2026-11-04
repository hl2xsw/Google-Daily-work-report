export interface DailyReportItem {
  id: string;
  team: string;            // 팀명 (예: SW개발 1팀, HW설계팀)
  author: string;          // 성명 (예: 김철수 팀장, 이진아 책임)
  todayTasks: string;      // 금일 진행 업무
  tomorrowTasks: string;   // 익일 예정 업무
  remarks: string;         // 특이사항 / 비고
  rawRowIndex?: number;
}

export interface SheetTabInfo {
  sheetId: number;
  title: string;           // e.g. "11/03 (화)", "11/02 (월)"
  isToday?: boolean;
}

export type ViewMode = 'cards' | 'table';

export type SyncSource = 'google_sheets' | 'demo_data';

export interface ReportFilter {
  selectedTeam: string;
  searchQuery: string;
  onlyRemarks: boolean;
}
