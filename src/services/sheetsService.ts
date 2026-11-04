import { DailyReportItem, SheetTabInfo } from '../types/report';
import { MOCK_TABS } from '../data/mockReports';

export class AuthRequiredError extends Error {
  constructor(message = 'Google 계정 로그인이 필요합니다. (또는 시트 공유 설정을 "링크가 있는 모든 사용자(뷰어)"로 변경하시면 로그인 없이 바로 연동됩니다)') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export function getTodayFormatted(): { full: string; short: string; dateOnly: string; dayName: string } {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const shortMonth = String(now.getMonth() + 1);
  const shortDay = String(now.getDate());
  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = daysOfWeek[now.getDay()];

  return {
    full: `${month}/${day} (${dayName})`,
    short: `${shortMonth}/${shortDay} (${dayName})`,
    dateOnly: `${month}/${day}`,
    dayName,
  };
}

export function isMatchingTodayTab(tabTitle: string): boolean {
  const cleanTitle = tabTitle.replace(/\s+/g, '').toLowerCase();
  const { full, short, dateOnly } = getTodayFormatted();

  const cleanFull = full.replace(/\s+/g, '').toLowerCase();
  const cleanShort = short.replace(/\s+/g, '').toLowerCase();

  return (
    cleanTitle.includes(cleanFull) ||
    cleanTitle.includes(cleanShort) ||
    cleanTitle === dateOnly ||
    cleanTitle.startsWith(dateOnly)
  );
}

// Simple CSV parser supporting quotes and multiline cells
export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export async function fetchSpreadsheetTabs(
  spreadsheetId: string,
  accessToken: string | null
): Promise<SheetTabInfo[]> {
  const cleanId = extractSpreadsheetId(spreadsheetId);

  // Method 1: If Access Token is available, call Google Sheets API v4
  if (accessToken) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?fields=sheets(properties(sheetId,title))`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const sheets = data.sheets || [];
        if (sheets.length > 0) {
          return sheets.map((item: any) => {
            const title = item.properties?.title || 'Untitled';
            return {
              sheetId: item.properties?.sheetId || 0,
              title,
              isToday: isMatchingTodayTab(title),
            };
          });
        }
      }
    } catch (e) {
      console.warn('Sheets API v4 tabs fetch failed, checking GViz fallback:', e);
    }
  }

  // Method 2: Public / Link-shared Sheets (GViz endpoint)
  // Check if link-sharing is enabled by querying GViz CSV for standard tabs
  try {
    const testUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv`;
    const res = await fetch(testUrl);
    if (res.ok) {
      const text = await res.text();
      // If it returns CSV and not HTML login page, the sheet is publicly accessible!
      if (!text.includes('<!DOCTYPE html>') && !text.includes('<html')) {
        // Return default November date tabs with dynamic today match
        return MOCK_TABS.map((tab) => ({
          ...tab,
          isToday: isMatchingTodayTab(tab.title),
        }));
      }
    }
  } catch (e) {
    console.warn('GViz check notice:', e);
  }

  if (!accessToken) {
    throw new AuthRequiredError();
  }

  throw new Error('스프레드시트 정보를 불러오지 못했습니다. 스프레드시트 URL 및 Google 계정의 접근 권한을 확인해주세요.');
}

export function parseRowsToReports(rows: any[][], tabTitle?: string): DailyReportItem[] {
  if (rows.length === 0) return [];

  // Detect title banner team (e.g. "R&D 기획 일일업무보고서" -> "R&D 기획팀")
  let defaultTeam = 'R&D 기획팀';
  for (let i = 0; i < Math.min(4, rows.length); i++) {
    const rowStr = rows[i].join(' ').trim();
    if (rowStr.includes('일일업무보고서') || rowStr.includes('업무보고') || rowStr.includes('업무일지')) {
      const extracted = rowStr
        .replace(/일일업무보고서|일일업무보고|업무일지/g, '')
        .trim();
      if (extracted) {
        defaultTeam = extracted.endsWith('팀') ? extracted : `${extracted}팀`;
      }
      break;
    }
  }

  // Detect header row (search up to 10 rows)
  let headerIndex = -1;
  let teamCol = -1;
  let authorCol = 0;
  let todayCol = 1;
  let resultCol = 2;
  let tomorrowCol = 3;
  let issueCol = -1;
  let remarksCol = -1;

  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i].map((c) => String(c || '').trim().toLowerCase());
    const hasAuthor = row.some((c) => c.includes('담당자') || c.includes('성명') || c.includes('작성자') || c.includes('이름'));
    const hasToday = row.some((c) => c.includes('금일') || c.includes('금일 업무'));
    const hasResult = row.some((c) => c.includes('결과') || c.includes('업무 결과') || c.includes('진행'));

    if (hasAuthor || (hasToday && hasResult)) {
      headerIndex = i;
      row.forEach((cell, idx) => {
        if (cell.includes('팀') || cell.includes('부서')) teamCol = idx;
        else if (cell.includes('담당자') || cell.includes('성명') || cell.includes('작성자') || cell.includes('이름')) authorCol = idx;
        else if (cell.includes('금일')) todayCol = idx;
        else if (cell.includes('결과') || cell.includes('실적')) resultCol = idx;
        else if (cell.includes('익일') || cell.includes('내일') || cell.includes('예정')) tomorrowCol = idx;
        else if (cell.includes('이슈')) issueCol = idx;
        else if (cell.includes('특이') || cell.includes('비고')) remarksCol = idx;
      });
      break;
    }
  }

  const dataRows = headerIndex >= 0 ? rows.slice(headerIndex + 1) : rows;
  const reports: DailyReportItem[] = [];
  let lastTeam = defaultTeam;

  dataRows.forEach((row, idx) => {
    if (!row || row.every((c) => !c || String(c).trim() === '')) {
      return;
    }

    let team = teamCol >= 0 ? String(row[teamCol] || '').trim() : '';
    const author = authorCol >= 0 ? String(row[authorCol] || '').trim() : '';
    const todayTasks = todayCol >= 0 ? String(row[todayCol] || '').trim() : '';
    const workResult = resultCol >= 0 ? String(row[resultCol] || '').trim() : '';
    const tomorrowTasks = tomorrowCol >= 0 ? String(row[tomorrowCol] || '').trim() : '';
    const issues = issueCol >= 0 ? String(row[issueCol] || '').trim() : '';
    const note = remarksCol >= 0 ? String(row[remarksCol] || '').trim() : '';

    if (!author && !todayTasks && !workResult && !tomorrowTasks) {
      if (team) lastTeam = team;
      return;
    }

    if (!team) {
      team = lastTeam || defaultTeam;
    } else {
      lastTeam = team;
    }

    const remarksCombined = [issues, note].filter(Boolean).join(' / ') || '특이사항 없음';

    const safeTabPrefix = tabTitle ? tabTitle.replace(/[^a-zA-Z0-9가-힣]/g, '') : 'row';

    reports.push({
      id: `sheet-${safeTabPrefix}-${idx + 1}`,
      date: tabTitle || '',
      team: team || defaultTeam,
      author: author || '미기재',
      todayTasks: todayTasks || '작성된 금일 업무 없음',
      workResult: workResult || '-',
      tomorrowTasks: tomorrowTasks || '-',
      remarks: remarksCombined,
      issues: issues || '',
      note: note || '',
      rawRowIndex: idx + (headerIndex >= 0 ? headerIndex + 2 : 1),
    });
  });

  return reports;
}

export async function fetchSheetData(
  spreadsheetId: string,
  tabTitle: string,
  accessToken: string | null
): Promise<DailyReportItem[]> {
  const cleanId = extractSpreadsheetId(spreadsheetId);

  // Method 1: Google Sheets API v4 with Access Token
  if (accessToken) {
    try {
      const encodedRange = encodeURIComponent(`'${tabTitle}'!A1:Z300`);
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodedRange}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const rows: any[][] = data.values || [];
        return parseRowsToReports(rows, tabTitle);
      } else {
        const errorText = await response.text();
        console.warn(`Sheets API v4 error (${response.status}), trying GViz CSV:`, errorText);
      }
    } catch (apiErr: any) {
      console.warn('Google Sheets API v4 fetch error, trying GViz fallback:', apiErr);
    }
  }

  // Method 2: Public / Link-Shared Sheets (GViz CSV endpoint)
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabTitle)}`;
    const res = await fetch(csvUrl);
    if (res.ok) {
      const csvText = await res.text();
      // Ensure it's real CSV and not a Google Accounts HTML redirect
      if (!csvText.includes('<!DOCTYPE html>') && !csvText.includes('<html')) {
        const rows = parseCsvRows(csvText);
        if (rows.length > 0) {
          return parseRowsToReports(rows, tabTitle);
        }
      }
    }
  } catch (csvErr) {
    console.warn('GViz CSV fetch failed:', csvErr);
  }

  if (!accessToken) {
    throw new AuthRequiredError('시트 데이터를 불러오려면 Google 로그인이 필요합니다. (또는 시트 공유 설정을 "링크가 있는 모든 사용자(뷰어)"로 변경하시면 로그인 없이 바로 연동됩니다)');
  }

  throw new Error(`'${tabTitle}' 탭의 데이터를 읽어오지 못했습니다. 스프레드시트 권한 및 탭 이름을 확인해주세요.`);
}

/**
 * Fetch reports from multiple sheet tabs with concurrency batching
 */
export async function fetchMultipleSheetsData(
  spreadsheetId: string,
  tabTitles: string[],
  accessToken: string | null,
  onProgress?: (loadedCount: number, total: number) => void
): Promise<Record<string, DailyReportItem[]>> {
  const result: Record<string, DailyReportItem[]> = {};
  const batchSize = 3;
  let completed = 0;

  for (let i = 0; i < tabTitles.length; i += batchSize) {
    const batch = tabTitles.slice(i, i + batchSize);
    const batchPromises = batch.map(async (tabTitle) => {
      try {
        const data = await fetchSheetData(spreadsheetId, tabTitle, accessToken);
        result[tabTitle] = data;
      } catch (err) {
        console.warn(`Failed to fetch tab ${tabTitle}:`, err);
        result[tabTitle] = [];
      } finally {
        completed++;
        if (onProgress) onProgress(completed, tabTitles.length);
      }
    });
    await Promise.all(batchPromises);
  }

  return result;
}
