import { DailyReportItem, SheetTabInfo } from '../types/report';

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  // Handle full URL pattern
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export function getTodayTabPattern(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = daysOfWeek[now.getDay()];
  
  // Format: "11/03 (화)"
  return `${month}/${day} (${dayName})`;
}

export function isMatchingTodayTab(tabTitle: string): boolean {
  const cleanTitle = tabTitle.replace(/\s+/g, '').toLowerCase();
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const shortMonth = String(now.getMonth() + 1);
  const shortDay = String(now.getDate());
  
  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = daysOfWeek[now.getDay()];

  // Variations: "11/03(화)", "11/3(화)", "11/03", "11/3"
  const expectedFull = `${month}/${day}(${dayName})`.toLowerCase();
  const expectedShort = `${shortMonth}/${shortDay}(${dayName})`.toLowerCase();
  const expectedDateOnly1 = `${month}/${day}`;
  const expectedDateOnly2 = `${shortMonth}/${shortDay}`;

  return (
    cleanTitle.includes(expectedFull) ||
    cleanTitle.includes(expectedShort) ||
    cleanTitle === expectedDateOnly1 ||
    cleanTitle === expectedDateOnly2
  );
}

export async function fetchSpreadsheetTabs(
  spreadsheetId: string,
  accessToken: string
): Promise<SheetTabInfo[]> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?fields=sheets(properties(sheetId,title))`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`구글 시트 정보를 불러오지 못했습니다 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const sheets = data.sheets || [];

  return sheets.map((item: any) => {
    const title = item.properties?.title || 'Untitled';
    return {
      sheetId: item.properties?.sheetId || 0,
      title,
      isToday: isMatchingTodayTab(title),
    };
  });
}

export async function fetchSheetData(
  spreadsheetId: string,
  tabTitle: string,
  accessToken: string
): Promise<DailyReportItem[]> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const encodedRange = encodeURIComponent(`'${tabTitle}'!A1:Z200`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodedRange}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`시트 데이터를 불러오지 못했습니다 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rows: any[][] = data.values || [];

  if (rows.length === 0) {
    return [];
  }

  // Detect title banner team (e.g. "R&D 기획 일일업무보고서" -> "R&D 기획팀")
  let defaultTeam = 'R&D 기획팀';
  for (let i = 0; i < Math.min(3, rows.length); i++) {
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

  // Detect header row or start index
  let headerIndex = -1;
  let teamCol = -1;
  let authorCol = 0;
  let todayCol = 1;
  let resultCol = 2;
  let tomorrowCol = 3;
  let issueCol = -1;
  let remarksCol = -1;

  for (let i = 0; i < Math.min(6, rows.length); i++) {
    const row = rows[i].map((c) => String(c || '').trim().toLowerCase());
    const hasAuthor = row.some((c) => c.includes('담당자') || c.includes('성명') || c.includes('작성자') || c.includes('이름'));
    const hasToday = row.some((c) => c.includes('금일'));
    const hasResult = row.some((c) => c.includes('결과') || c.includes('업무 결과') || c.includes('진행현황'));

    if (hasAuthor || (hasToday && hasResult)) {
      headerIndex = i;
      // Map columns
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
    // If row is completely empty, skip
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

    // If author and all task/result fields are empty, might be a section header
    if (!author && !todayTasks && !workResult && !tomorrowTasks) {
      if (team) lastTeam = team;
      return;
    }

    // Forward-fill team if blank
    if (!team) {
      team = lastTeam || defaultTeam;
    } else {
      lastTeam = team;
    }

    // Combine issues and note for remarks
    const remarksCombined = [issues, note].filter(Boolean).join(' / ') || '특이사항 없음';

    reports.push({
      id: `sheet-row-${idx + 1}`,
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
