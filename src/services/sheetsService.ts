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

  // Detect header row or start index
  let headerIndex = -1;
  let teamCol = 0;
  let authorCol = 1;
  let todayCol = 2;
  let tomorrowCol = 3;
  let remarksCol = 4;

  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i].map((c) => String(c || '').trim().toLowerCase());
    const hasTeam = row.some((c) => c.includes('팀') || c.includes('부서'));
    const hasAuthor = row.some((c) => c.includes('성명') || c.includes('작성자') || c.includes('담당자') || c.includes('이름'));
    const hasTasks = row.some((c) => c.includes('업무') || c.includes('내용') || c.includes('금일'));

    if ((hasTeam || hasAuthor) && hasTasks) {
      headerIndex = i;
      // Map columns
      row.forEach((cell, idx) => {
        if (cell.includes('팀') || cell.includes('부서')) teamCol = idx;
        else if (cell.includes('성명') || cell.includes('작성자') || cell.includes('담당자') || cell.includes('이름')) authorCol = idx;
        else if (cell.includes('금일') || (cell.includes('진행') && !cell.includes('익일'))) todayCol = idx;
        else if (cell.includes('익일') || cell.includes('예정')) tomorrowCol = idx;
        else if (cell.includes('특이') || cell.includes('비고') || cell.includes('이슈')) remarksCol = idx;
      });
      break;
    }
  }

  const dataRows = headerIndex >= 0 ? rows.slice(headerIndex + 1) : rows;
  const reports: DailyReportItem[] = [];

  let lastTeam = '기타/미지정';

  dataRows.forEach((row, idx) => {
    // If row is completely empty, skip
    if (!row || row.every((c) => !c || String(c).trim() === '')) {
      return;
    }

    let team = String(row[teamCol] || '').trim();
    const author = String(row[authorCol] || '').trim();
    const todayTasks = String(row[todayCol] || '').trim();
    const tomorrowTasks = String(row[tomorrowCol] || '').trim();
    const remarks = String(row[remarksCol] || '').trim();

    // If author and both task fields are empty, this might be a section header
    if (!author && !todayTasks && !tomorrowTasks) {
      if (team) lastTeam = team;
      return;
    }

    // Forward-fill team if blank
    if (!team) {
      team = lastTeam;
    } else {
      lastTeam = team;
    }

    reports.push({
      id: `sheet-row-${idx + 1}`,
      team: team || '공통팀',
      author: author || '미기재',
      todayTasks: todayTasks || '작성된 업무 내용 없음',
      tomorrowTasks: tomorrowTasks || '-',
      remarks: remarks || '특이사항 없음',
      rawRowIndex: idx + (headerIndex >= 0 ? headerIndex + 2 : 1),
    });
  });

  return reports;
}
