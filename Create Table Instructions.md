# Create the dynamic execution-results table

These instructions describe the current execution-results flow and API contract.

## 1. Architecture

```text
Reports list
    |
    | User opens /reports/:id
    v
ExecutionResultsPage
    |-- Owns the current pagination offset
    |-- Loads the selected result page with useExecutionResultsData
    `-- Passes columns, rows, and pagination to DynamicResultsTable

getExecutionResults()
    |
    v
Axios API client
    |
    v
Mock API
    |-- Reads executionResults2.json
    |-- Slices the requested rows
    `-- Returns the current pagination metadata
```

The responsibilities are intentionally separated:

| Part | Responsibility |
|---|---|
| `reports.ts` | Sends the execution-results request. |
| `mockApi.ts` | Supplies and paginates development mock data. |
| `report.ts` | Defines the API response shape. |
| `useExecutionResultsData.ts` | Loads results and manages loading, errors, and cancellation. |
| `ExecutionResultsPage.tsx` | Tracks the current page offset and composes the page. |
| `DynamicResultsTable.tsx` | Renders columns, positional row entries, and pagination controls. |

Every report currently receives the same 50 mock books. The report ID changes the request URL and page title, but the mock API does not select different data for different IDs.

## 2. API response format

The API now returns a top-level `pagination`, `columns`, and `rows` object:

```json
{
  "pagination": {
    "pageNumber": 0,
    "pageSize": 20,
    "numberOfRecords": 50,
    "numberOfPages": 3
  },
  "columns": [
    {
      "id": "title",
      "displayName": "title",
      "dataType": "string"
    },
    {
      "id": "price",
      "displayName": "price",
      "dataType": "numeric"
    }
  ],
  "rows": [
    {
      "entries": ["Animal Farm", 19.99]
    }
  ]
}
```

Each `rows[].entries` value corresponds to the column at the same index:

```text
entries[0] -> columns[0]
entries[1] -> columns[1]
entries[2] -> columns[2]
```

This positional relationship is the contract. Rows should contain the same number of entries as the `columns` array and in the same order.

The repository's complete mock response is stored in `src/data/executionResults2.json`. It contains 50 books and 10 columns.

## 3. Define the response types

Update `src/types/report.ts` with types matching the API:

```ts
export type ExecutionColumnDataType =
  | 'string'
  | 'integer'
  | 'numeric'
  | 'boolean'
  | 'timestamp'

export interface ExecutionColumn {
  id: string
  displayName: string
  dataType: ExecutionColumnDataType
}

export interface ExecutionRow {
  entries: unknown[]
}

export interface ExecutionPagination {
  pageNumber: number
  pageSize: number
  numberOfRecords: number
  numberOfPages: number
}

export interface ExecutionReportPayload {
  pagination: ExecutionPagination
  columns: ExecutionColumn[]
  rows: ExecutionRow[]
}

export interface ReportExecutionRequest {
  inputParameters: Record<string, {
    displayName: string
    type: string
    value: unknown
  }>
}
```

`unknown[]` means an entry can hold any primitive or other API value, but code must narrow its type before performing type-specific operations.

TypeScript checks how application code uses these interfaces; it does not validate untrusted runtime JSON. A real backend boundary may still need runtime schema validation.

## 4. Keep the requested page size in one place

Create `src/api/constants.ts`:

```ts
export const EXECUTION_RESULTS_PAGE_SIZE = 20
```

The request hook and mock API import this value so their default page size remains synchronized.

## 5. Add the API request

In `src/api/reports.ts`, import the response and request types and page size:

```ts
import type {
  ExecutionReportPayload,
  Report,
  ReportExecutionRequest,
} from '../types/report'
import { EXECUTION_RESULTS_PAGE_SIZE } from './constants'
```

Keep the options used by the request:

```ts
interface ExecutionResultsRequestOptions extends RequestOptions {
  reportId: string
  executionRequest: ReportExecutionRequest
  start?: number
  limit?: number
}
```

Implement the request:

```ts
export async function getExecutionResults({
  reportId,
  executionRequest,
  start = 0,
  limit = EXECUTION_RESULTS_PAGE_SIZE,
  signal,
}: ExecutionResultsRequestOptions): Promise<ExecutionReportPayload> {
  const safeLimit = Number.isFinite(limit) && limit > 0
    ? limit
    : EXECUTION_RESULTS_PAGE_SIZE
  const safeStart = Number.isFinite(start) && start > 0 ? start : 0

  const response = await apiClient.post<ExecutionReportPayload>(
    `/reports/${encodeURIComponent(reportId)}/executions`,
    executionRequest,
    {
      params: {
        page: Math.floor(safeStart / safeLimit),
        size: safeLimit,
      },
      signal,
    },
  )

  return response.data
}
```

For report `books`, the request is:

```text
POST /reports/books/executions?page=0&size=20
POST /reports/books/executions?page=1&size=20
POST /reports/books/executions?page=2&size=20
```

The request body follows the Java `ReportExecutionDto` shape:

```json
{
  "inputParameters": {
    "test-1": {
      "displayName": "Test 1",
      "type": "string",
      "value": "books"
    }
  }
}
```

`start` remains a zero-based UI offset. The API converts it to Spring's zero-based `page` parameter and sends the configured limit as `size`. `signal` lets the hook cancel a request that is no longer relevant.

The function should return `response.data` directly. The old `executionReport` assertion is not needed because the response type now describes the actual top-level contract.

## 6. Make the mock API use the new JSON

In `src/api/mockApi.ts`, replace the old data import:

```ts
import executionResults from '../data/executionResults2.json'
```

Do not import or retain `executionResults.json`; it used the legacy `executionReport.Books[].Columns` structure and has been removed.

Paginate the `rows` array:

```ts
mock.onPost(/\/reports\/[^/]+\/executions$/).reply((config) => {
  const pageNumber = Number(config.params?.page ?? 0)
  const pageSize = Number(config.params?.size ?? EXECUTION_RESULTS_PAGE_SIZE)
  const rows = executionResults.rows

  const safePageNumber = Number.isFinite(pageNumber) && pageNumber > 0
    ? Math.floor(pageNumber)
    : 0
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0
    ? pageSize
    : EXECUTION_RESULTS_PAGE_SIZE

  const safeStart = safePageNumber * safePageSize
  const page = rows.slice(safeStart, safeStart + safePageSize)
  const numberOfRecords = rows.length
  const numberOfPages = Math.ceil(numberOfRecords / safePageSize)

  return [200, {
    ...executionResults,
    pagination: {
      pageNumber: safePageNumber,
      pageSize: safePageSize,
      numberOfRecords,
      numberOfPages,
    },
    rows: page,
  }]
})
```

With 50 records and a page size of 20:

| Offset | Returned rows | UI range |
|---:|---:|---:|
| 0 | 20 | 1-20 |
| 20 | 20 | 21-40 |
| 40 | 10 | 41-50 |

The mock validates the `page` and `size` values, then rebuilds pagination metadata from the complete dataset. The response preserves the column definitions and replaces only the `rows` array.

## 7. Load results in a hook

Create or update `src/hooks/useExecutionResultsData.ts`:

```ts
import axios from "axios";
import { useEffect, useState } from "react";

import { EXECUTION_RESULTS_PAGE_SIZE } from "../api/constants";
import { getExecutionResults } from "../api/reports";
import type {
  ExecutionReportPayload,
  ReportExecutionRequest,
} from "../types/report";

interface ExecutionResultsState {
  data: ExecutionReportPayload | null;
  loading: boolean;
  error: string;
}
```

The hook can store the API payload directly because rows already have the shape consumed by the table:

```ts
const EMPTY_EXECUTION_REQUEST: ReportExecutionRequest = {
  inputParameters: {},
};

export default function useExecutionResultsData(
  reportId: string | undefined,
  start: number,
  executionRequest = EMPTY_EXECUTION_REQUEST,
): ExecutionResultsState {
  const [state, setState] = useState<ExecutionResultsState>({
    data: null,
    loading: true,
    error: "",
  });

  useEffect(() => {
    if (!reportId) {
      setState({ data: null, loading: false, error: "" });
      return;
    }

    const controller = new AbortController();
    setState({ data: null, loading: true, error: "" });

    getExecutionResults({
      reportId,
      executionRequest,
      start,
      limit: EXECUTION_RESULTS_PAGE_SIZE,
      signal: controller.signal,
    })
      .then((payload) => {
        if (!controller.signal.aborted) {
          setState({
            data: payload,
            loading: false,
            error: "",
          });
        }
      })
      .catch((error: unknown) => {
        if (axios.isCancel(error) || controller.signal.aborted) return;

        setState({
          data: null,
          loading: false,
          error: "Unable to load execution results. Please try again later.",
        });
      });

    return () => controller.abort();
  }, [executionRequest, reportId, start]);

  return state;
}
```

There is no longer a normalization function converting `Books[].Columns[]` into record objects. The UI uses the API's `entries` arrays by position.

The effect reruns when either `reportId` or `start` changes. Its cleanup aborts an obsolete request when the user changes reports or pages.

## 8. Render the page

In `src/pages/ExecutionResultsPage.tsx`, import the table, hook, report hook, and layout:

```tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import DynamicResultsTable from "../components/DynamicResultsTable";
import useExecutionResultsData from "../hooks/useExecutionResultsData";
import useReportsData from "../hooks/useReportsData";
import PageLayout from "../layouts/PageLayout";
```

The page owns the zero-based offset:

```tsx
const { id } = useParams<{ id: string }>();
const [start, setStart] = useState(0);
const { data: reports } = useReportsData();
const report = reports?.find((candidate) => candidate.id === id);
const { data: result, loading, error } =
  useExecutionResultsData(id, start);
```

Reset pagination when the route selects another report:

```tsx
useEffect(() => {
  setStart(0);
}, [id]);
```

Render the table with API pagination metadata:

```tsx
<PageLayout>
  <h1>{title}</h1>

  {loading && <p role="status">Loading execution results...</p>}
  {error && <p role="alert">{error}</p>}

  {!loading && !error && result && (
    <DynamicResultsTable
      columns={result.columns}
      rows={result.rows}
      pagination={result.pagination}
      onPageChange={setStart}
    />
  )}
</PageLayout>
```

The page no longer calculates `pageSize` or `total` props separately. Those values come from `result.pagination`.

## 9. Create the dynamic table

In `src/components/DynamicResultsTable.tsx`, define props that match the response:

```tsx
import type {
  ExecutionColumn,
  ExecutionPagination,
  ExecutionRow,
} from "../types/report";

export interface DynamicResultsTableProps {
  columns: ExecutionColumn[];
  rows: ExecutionRow[];
  pagination: ExecutionPagination;
  onPageChange: (start: number) => void;
}
```

Format values according to `dataType`:

```tsx
function formatValue(
  value: unknown,
  type: ExecutionColumn["dataType"],
) {
  if (value === null || value === undefined || value === "") return "-";
  if (type === "boolean") return value ? "Yes" : "No";

  if (
    (type === "integer" || type === "numeric") &&
    typeof value === "number"
  ) {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(value);
  }

  return String(value);
}
```

Render metadata and rows:

```tsx
export function DynamicResultsTable({
  columns,
  rows,
  pagination,
  onPageChange,
}: DynamicResultsTableProps) {
  if (columns.length === 0) {
    return <p>No result columns available.</p>;
  }

  const start = pagination.pageNumber * pagination.pageSize;
  const end = Math.min(start + rows.length, pagination.numberOfRecords);
  const canGoPrevious = pagination.pageNumber > 0;
  const canGoNext =
    pagination.pageNumber + 1 < pagination.numberOfPages;

  return (
    <div className="dynamic-results">
      <div
        className="table-container"
        role="region"
        aria-label="Execution results table"
        tabIndex={0}
      >
        <table
          className="dynamic-results-table"
          aria-label="Execution results"
        >
          <thead>
            <tr>
              {columns.map((column) => (
                <th scope="col" key={column.id}>
                  {column.displayName}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column, columnIndex) => (
                  <td key={column.id}>
                    {formatValue(
                      row.entries[columnIndex],
                      column.dataType,
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav
        className="dynamic-results-pagination"
        aria-label="Execution results pagination"
      >
        <button
          type="button"
          disabled={!canGoPrevious}
          onClick={() =>
            onPageChange(Math.max(0, start - pagination.pageSize))
          }
        >
          Previous
        </button>

        <span role="status">
          {pagination.numberOfRecords === 0
            ? "No records"
            : `Showing ${start + 1}-${end} of ${pagination.numberOfRecords}`}
        </span>

        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => onPageChange(start + pagination.pageSize)}
        >
          Next
        </button>
      </nav>
    </div>
  );
}

export default DynamicResultsTable;
```

Important rendering details:

- `column.id` is the stable React key.
- `column.displayName` is the visible header.
- `column.dataType` controls formatting.
- `row.entries[columnIndex]` connects each value to its column by position.
- `pageNumber`, `numberOfPages`, and `numberOfRecords` come from the API, rather than being rebuilt separately in the table.

For the mock's final page:

```text
pageNumber = 2
pageSize = 20
numberOfPages = 3
start = 2 * 20 = 40
end = 40 + 10 = 50
```

The row index is currently used as the React row key. If the API adds a stable record identifier, use that value instead.

## 10. Keep the table styling

The table uses `src/components/DynamicResultsTable.scss`:

```scss
.dynamic-results {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dynamic-results-table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  text-align: left;

  th,
  td {
    padding: 12px 16px;
    border-bottom: 1px solid #dbe2ea;
    vertical-align: top;
  }

  thead {
    background: #edf2f7;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  tbody tr:hover {
    background: #f6f8fb;
  }
}
```

The existing `.table-container` style provides horizontal scrolling, and the pagination style arranges Previous, status text, and Next controls.

## 11. Update tests for the positional format

Mock execution responses in tests must now use the top-level shape:

```ts
mock.onPost("/reports/1/executions").reply(200, {
  pagination: {
    pageNumber: 0,
    pageSize: 20,
    numberOfRecords: 21,
    numberOfPages: 2,
  },
  columns: [
    { id: "title", displayName: "Title", dataType: "string" },
    { id: "in_stock", displayName: "In Stock", dataType: "boolean" },
  ],
  rows: [
    { entries: ["The Hobbit", true] },
  ],
})
```

Tests should verify:

- headers use `displayName`;
- cells read values from `entries` by column position;
- numeric values are formatted;
- boolean values display as `Yes` or `No`;
- Next POSTs the next Spring `page` value and retains the execution request body;
- the final page disables Next;
- the first page disables Previous;
- errors still display an alert;
- the mock returns 20, 20, and 10 rows for its three pages.

## 12. Verify the result

Run:

```sh
npm test
npm run build
```

The expected behavior is:

1. Open the reports list.
2. Select **Monthly sales**.
3. The first page shows 1-20 of 50.
4. Next shows 21-40 of 50.
5. Next shows 41-50 of 50 and becomes disabled.
6. Previous returns to the prior page.

All 50 mock rows should align with the 10 columns in `executionResults2.json`.
