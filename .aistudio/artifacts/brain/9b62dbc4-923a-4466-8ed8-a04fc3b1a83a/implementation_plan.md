# 팀별 일일 업무보고 통합 시스템 (Daily Work Report Integration System)

Google Sheets에 기록되는 일일 업무일지를 실시간 동기화하여 팀별 업무 현황을 한눈에 파악하고, 통합 검색 및 엑셀(Excel/CSV) 다운로드를 지원하는 통합 관리 대시보드 시스템입니다.

## User Review & Critical Decisions

> [!IMPORTANT]
> 사전 질의응답을 통해 확정된 요구사항을 바탕으로 설계를 구성하였습니다.
>
> - **확정된 연동 방식**: Google 계정 로그인(Google Workspace OAuth) 직접 연동을 통한 안전한 시트 읽기 (`spreadsheets.readonly`, `drive.readonly`)
> - **확정된 컬럼 구조**: `팀명`, `성명`, `금일 진행 업무`, `익일 예정 업무`, `특이사항` (5개 핵심 필드)
> - **확정된 동기화/조회 범위**: 오늘 날짜("MM/DD (요일)", 예: 11/03 (화)) 시트 탭 자동 동기화 및 이전/이후 날짜 탭 자유 선택 전환 지원
> - **엑셀 및 데이터 내보내기**: 현재 필터링된 결과 또는 전체 팀 보고서를 `.xlsx` / `.csv`로 즉시 내보내기

---

## 1. Overview & Core Concept

- **What It Does**: 
  - Google Spreadsheet의 각 일자별 탭(예: `11/02 (월)`, `11/03 (화)` 등)에서 팀별 일일 업무일지 데이터를 동기화합니다.
  - 당일 기준 업무보고를 자동으로 감지하여 팀별(예: SW개발팀, HW설계팀, 선행연구팀, 기획팀 등) 카드 및 테이블로 일목요연하게 표시합니다.
  - 팀별/작성자별/진행상태별 필터링, 실시간 키워드 검색, 인쇄용 보고서 뷰, Excel 내보내기 기능을 원클릭으로 제공합니다.
  - Google 계정 미연동 상태에서도 시스템 기능을 즉시 검증할 수 있는 샘플 데이터 및 오프라인 모드를 함께 제공합니다.
- **Target Audience / Persona**:
  - 일일 업무보고를 취합하고 전체 팀의 진척 및 익일 계획, 병목/특이사항을 점검하는 팀장, 부서장, PM, 경영진 및 팀원.
- **Key Value**:
  - 기존의 로컬 폴더 수동 탐색 및 엑셀 파일 개별 취합 번거로움을 완전히 제거하고, 구글 시트 기반 클라우드 일원화 및 즉각적인 통합 통계/검색 제공.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **헤더 & 날짜 선택기 (Top Navigation & Date Picker)**:
   - 상단에서 오늘 날짜(`11/03 (화)`)가 기본 선택되어 있으며, 스프레드시트에 존재하는 탭 목록(`11/02 (월)`, `11/04 (수)` 등)을 드롭다운 또는 날짜 칩으로 손쉽게 전환.
   - [Google 시트 동기화] 버튼 및 구글 로그인 프로필 연동 상태 표시.
2. **요약 메트릭 & 팀별 현황 바 (Summary KPIs)**:
   - 보고 완료 팀 수, 총 보고 인원, 주요 특이사항/이슈 발생 건수, 익일 예정 과업 수를 깔끔한 통계 카드로 한눈에 확인.
3. **팀별 업무보고 뷰 모드 전환 (Dual View Modes)**:
   - **카드형 그리드 뷰 (Team Kanban/Card View)**: 팀별로 그룹화되어 담당자별 [금일 진행 업무], [익일 예정 업무], [특이사항]을 직관적으로 확인.
   - **스프레드시트 테이블 뷰 (Data Table View)**: 정렬, 열 필터링, 고밀도 행 조회가 가능한 엑셀 친화적 테이블.
4. **검색 & 다중 필터 (Search & Filters)**:
   - 팀 선택 필터 (전체 / SW팀 / HW팀 / 연구팀 등)
   - 담당자 성명 검색 및 업무 내용/특이사항 실시간 텍스트 검색
   - 특이사항/이슈가 있는 항목만 모아보기 토글
5. **엑셀 내보내기 & 인쇄 모드 (Export & Print)**:
   - 현재 조회 중인 날짜 또는 필터링된 전체 팀 업무보고를 Excel 포맷(`xlsx`/`csv`)으로 다운로드.
   - A4 보고서에 최적화된 깔끔한 인쇄(Print) 프리뷰 및 PDF 출력 스타일.

### Visual Identity & Theme
- **Aesthetic Direction**: 신뢰감과 가독성을 극대화한 모던 엔터프라이즈 B2B 대시보드 (클린 미니멀, 제로 필 원칙 준수).
- **Color Palette**:
  - Dominant Neutral: Crisp White / Cool Off-White (`#F8FAFC`, `#FFFFFF`), Dark mode Slate (`#0F172A`)
  - Accent Color: Indigo / Deep Blue (`#2563EB`, `#1E40AF`) - 안정적이고 신뢰감 있는 비즈니스 톤
  - Status Accents: 진행 완료 Emerald (`#059669`), 주의/이슈 Amber (`#D97706`), 긴급 Rose (`#E11D48`)
- **Typography**:
  - Heading & UI: `Plus Jakarta Sans` / System Sans-Serif
  - Data, Dates & Numbers: `font-mono tabular-nums` (열 정렬 오차 방지)

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Google Workspace OAuth (Sheets API v4) 기반 연동**
  - *Chosen Approach*: `spreadsheets.readonly` 스코프의 클라이언트 측 Firebase/Google OAuth 팝업 인증. 사용자의 스프레드시트 ID 또는 URL을 저장하고 즉시 데이터를 읽어옴.
  - *Why*: 사용자의 시트 권한을 안전하게 위임받으며, 회사 도메인 구글 계정으로 로그인하여 별도 복잡한 API 키 발급 없이 손쉽게 사용 가능.
  - *Alternatives Considered*: 서비스 계정(JSON 키 필요하여 보안 부담), 공개 웹게시(사내 보안상 민감할 수 있음).
- **Decision 2: 탭 이름 스마트 파싱 & 오늘 날짜 자동 감지**
  - *Chosen Approach*: 현재 월/일/요일(`MM/DD (요일)` 형식, 예: `11/03 (화)`)을 파싱하여 구글 시트의 탭 목록 중 가장 일치하는 시트를 자동 기본값으로 설정.
  - *Why*: 사용자가 매일 접속했을 때 별도 탭 이동 없이 오늘자 보고서를 즉시 확인할 수 있어 워크플로우 생산성 대폭 향상.
- **Decision 3: 내장 데모 데이터셋 & 스프레드시트 설정 가이드**
  - *Chosen Approach*: 첨부파일(`R&D 11월 업무일지`)의 2026년 11월 날짜 구성에 맞춘 고품질 R&D 팀 샘플 데이터를 탑재하여 시트 연동 전에도 즉시 모든 기능(검색, 필터, 엑셀 출력)을 테스트할 수 있도록 제공.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   App Header & Controls                │
│  [구글 로그인]  [시트 URL/ID 설정]  [날짜 탭 선택기]     │
│  [실시간 동기화]  [엑셀 다운로드]  [인쇄 모드]          │
└───────────────────────────────────┬────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
        ┌──────────────────┐                ┌──────────────────┐
        │  Google Sheets   │                │  Demo Fallback   │
        │  API v4 Service  │                │  Local Dataset   │
        └─────────┬────────┘                └─────────┬────────┘
                  │                                   │
                  └─────────────────┬─────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────┐
│               Report State Management Store            │
│  - sheets: Available Date Tabs ("11/02 (월)", ...)     │
│  - selectedDateTab: Active Tab ("11/03 (화)")          │
│  - reports: TeamReportItem[]                           │
│  - filter: { team, query, onlyWithRemarks }            │
└───────────────────────────────────┬────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
┌──────────────────────────────────┐ ┌──────────────────────────────────┐
│   Team Card Grid View (팀별 카드) │ │ High-Density Table View (표형태) │
│ - 팀별 그룹화 및 담당자 카드     │ │ - 정렬 가능한 5개 열             │
│ - 금일진행 / 익일예정 / 특이사항 │ │ - 엑셀 친화적 레이아웃           │
└──────────────────────────────────┘ └──────────────────────────────────┘
```

### Data Model
```typescript
export interface DailyReportItem {
  id: string;
  team: string;            // 팀명 (예: R&D SW개발팀, HW설계팀 등)
  author: string;          // 성명 (예: 김철수 팀장, 이영희 수석)
  todayTasks: string;      // 금일 진행 업무
  tomorrowTasks: string;   // 익일 예정 업무
  remarks: string;         // 특이사항 / 이슈 / 비고
  rawRowIndex?: number;
}

export interface SheetTabInfo {
  sheetId: number;
  title: string;           // e.g., "11/03 (화)"
  isToday?: boolean;
}
```

### Component Hierarchy
- `src/App.tsx`: 메인 통합 뷰 및 상태 오케스트레이션
- `src/components/Navbar.tsx`: 1-Row 탑바 (브랜드, 동기화 상태, 구글 로그인 버튼, 스프레드시트 설정 모달 열기)
- `src/components/Toolbar.tsx`: 날짜 탭 선택기(오늘 날짜 자동 강조), 팀 필터, 검색창, 뷰 모드 토글(카드/테이블), 엑셀 다운로드 버튼
- `src/components/SummaryCards.tsx`: 총 보고 팀/인원수, 특이사항 건수, 완료율 지표
- `src/components/TeamCardGrid.tsx`: 팀별 섹션 및 담당자별 카드 뷰
- `src/components/ReportTable.tsx`: 고밀도 데이터 그리드 뷰
- `src/components/SheetConfigModal.tsx`: 스프레드시트 URL/ID 입력 및 탭 파싱 가이드 모달
- `src/services/sheetsService.ts`: Google Sheets API v4 통신 및 2차원 배열 데이터 파싱
- `src/services/exportService.ts`: 엑셀(.xlsx/.csv) 생성 및 다운로드 모듈
- `src/data/mockReports.ts`: 11월 업무일지 탭 기반 풍부한 사전 탑재 샘플 데이터
