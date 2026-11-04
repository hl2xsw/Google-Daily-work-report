import * as XLSX from 'xlsx';
import { DailyReportItem } from '../types/report';

export function exportToExcel(
  reports: DailyReportItem[],
  dateTab: string,
  isAllDates = false,
  filenamePrefix = '일일업무보고_통합'
) {
  const sanitizedDate = isAllDates ? '전체일자통합' : dateTab.replace(/[\/\s()]/g, '_');
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const filename = `${filenamePrefix}_${sanitizedDate}_${dateStr}.xlsx`;

  // Format data for Excel with 업무 결과 and optional 보고일자
  const excelData = reports.map((item, index) => {
    const row: Record<string, any> = {
      'No': index + 1,
    };
    if (isAllDates) {
      row['보고일자'] = item.date || dateTab;
    }
    row['팀명'] = item.team;
    row['담당자'] = item.author;
    row['금일 업무'] = item.todayTasks;
    row['업무 결과'] = item.workResult || '-';
    row['익일 업무'] = item.tomorrowTasks;
    row['이슈사항 / 비고'] = item.remarks;
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  worksheet['!cols'] = isAllDates ? [
    { wch: 6 },   // No
    { wch: 14 },  // 보고일자
    { wch: 16 },  // 팀명
    { wch: 12 },  // 담당자
    { wch: 38 },  // 금일 업무
    { wch: 42 },  // 업무 결과
    { wch: 38 },  // 익일 업무
    { wch: 30 },  // 이슈사항 / 비고
  ] : [
    { wch: 6 },   // No
    { wch: 16 },  // 팀명
    { wch: 12 },  // 담당자
    { wch: 38 },  // 금일 업무
    { wch: 42 },  // 업무 결과
    { wch: 38 },  // 익일 업무
    { wch: 30 },  // 이슈사항 / 비고
  ];

  const workbook = XLSX.utils.book_new();
  const sheetTitle = (isAllDates ? '전체일자통합' : dateTab.slice(0, 31)) || '업무보고';
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle);

  XLSX.writeFile(workbook, filename);
}

export function exportToCsv(
  reports: DailyReportItem[],
  dateTab: string,
  isAllDates = false,
  filenamePrefix = '일일업무보고_통합'
) {
  const sanitizedDate = isAllDates ? '전체일자통합' : dateTab.replace(/[\/\s()]/g, '_');
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const filename = `${filenamePrefix}_${sanitizedDate}_${dateStr}.csv`;

  // UTF-8 BOM for Excel Korean support
  const headers = isAllDates
    ? ['No', '보고일자', '팀명', '담당자', '금일 업무', '업무 결과', '익일 업무', '이슈사항 / 비고']
    : ['No', '팀명', '담당자', '금일 업무', '업무 결과', '익일 업무', '이슈사항 / 비고'];
  
  const escapeCsvField = (field: string | number) => {
    const stringField = String(field ?? '');
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };

  const rows = reports.map((item, index) => {
    if (isAllDates) {
      return [
        index + 1,
        escapeCsvField(item.date || dateTab),
        escapeCsvField(item.team),
        escapeCsvField(item.author),
        escapeCsvField(item.todayTasks),
        escapeCsvField(item.workResult || '-'),
        escapeCsvField(item.tomorrowTasks),
        escapeCsvField(item.remarks),
      ];
    }
    return [
      index + 1,
      escapeCsvField(item.team),
      escapeCsvField(item.author),
      escapeCsvField(item.todayTasks),
      escapeCsvField(item.workResult || '-'),
      escapeCsvField(item.tomorrowTasks),
      escapeCsvField(item.remarks),
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
