# 1. Overall architecture

When a user clicks a report, the following happens:

```text
Reports list
    │
    │ User clicks a report title
    ▼
/reports/:id
    │
    ▼
ExecutionResultsPage
    ├── Loads reports to find the selected report's title
    ├── Requests a page of results from the API
    ├── Converts the API response into a table-friendly shape
    └── Passes the columns and rows to DynamicResultsTable
                                            │
                                            ├── Generates table headers and cells
                                            └── Calls the page when pagination changes
```

The API side looks like this:

```text
getExecutionResults()
    │
    ▼
Axios API client
    │
    ▼
Mock API intercepts the request
    │
    ▼
Reads books from executionResults.json
    │
    ▼
Returns only the requested page and the total record count
```

### Responsibilities

| Part | Responsibility |
|---|---|
| `App.tsx` | Connects a URL to a page. |
| `reports.ts` | Provides functions for requesting data. |
| `mockApi.ts` | Pretends to be a backend while developing. |
| `report.ts` | Describes the expected data using TypeScript. |
| `ExecutionResultsPage.tsx` | Fetches and prepares data, and manages the current page. |
| `DynamicResultsTable.tsx` | Displays the supplied data and pagination controls. |

The distinction between the last two is important:

- The **page** knows where the data comes from.
- The **table** only knows how to display data it receives.

That separation makes the table easier to reuse with another API later.

> **Current mock limitation:** the selected report ID changes the URL and page title, but every report currently receives the same mock book data. There is no separate backend yet.

---

# 2. Connect report links to the results page

The reports table already contains this link in `ReportTable.tsx`:

```tsx
<Link to={`/reports/${report.id}`}>{report.title}</Link>
```

Suppose a report has:

```ts
{
  id: "1",
  title: "Monthly sales"
}
```

The link points to:

```text
/reports/1
```

### Syntax explained

- `<Link>` is React Router’s navigation component. It changes pages inside the React app.
- `to={...}` supplies the destination.
- The backticks create a **template string**.
- `${report.id}` inserts the report ID into that string.
- `{report.title}` displays the title as the link text. Curly braces in JSX mean “evaluate this JavaScript expression.”

## Register the route

In `App.tsx`, import the page:

```tsx
import ExecutionResultsPage from "./pages/ExecutionResultsPage";
```

Then add its route inside the existing `RootLayout` route:

```tsx
<Route path="/reports/:id" element={<ExecutionResultsPage />} />
```

- `:id` means “match a value in this part of the URL.”
- For `/reports/1`, the value of `id` is `"1"`.
- `element={<ExecutionResultsPage />}` tells React Router which component to render.
- The outer `{...}` in `element={...}` embeds a JSX expression inside a JSX attribute.

The page will read that ID later with `useParams()`.

---

# 3. Define the data types

In `report.ts`, the existing `Report` type describes the reports list. Add the execution-results types underneath it:

```ts
export type ExecutionColumnType = 'string' | 'number' | 'boolean'

export interface ExecutionColumn {
  description: string
  type: ExecutionColumnType
}

export interface ExecutionColumnSource {
  Description?: string
  description?: string
  Name?: string
  name?: string
  Type?: ExecutionColumnType
  type?: ExecutionColumnType
  Value?: unknown
  value?: unknown
}

export interface ExecutionBookSource {
  Columns?: ExecutionColumnSource[]
  columns?: ExecutionColumnSource[]
  [key: string]: unknown
}

export interface ExecutionReportPayload {
  executionReport?: {
    Books?: ExecutionBookSource[]
    books?: ExecutionBookSource[]
    Columns?: ExecutionColumn[]
    columns?: ExecutionColumn[]
    total?: number
    Total?: number
  }
}
```

## Why define types?

TypeScript checks that the code uses data consistently. For example, it can warn you if you accidentally use `column.name` where the prepared column object has `column.description`.

Types are used during development and compilation. **They do not validate actual data received from an API at runtime.**

## Syntax explained

### A union type

```ts
export type ExecutionColumnType = 'string' | 'number' | 'boolean'
```

The `|` means **or**. A column type can be one of these three text values.

`export` allows other files to import the type.

### An interface

```ts
export interface ExecutionColumn {
  description: string
  type: ExecutionColumnType
}
```

This says a prepared column must have:

```ts
{
  description: "Title",
  type: "string"
}
```

### Optional fields

```ts
Description?: string
```

The `?` means that property may be absent.

The source type allows variations such as `Description` and `description`, because the normalization code can handle either spelling. This is a limited attempt to accommodate future API changes—not a guarantee that every future structure will work.

### Arrays and unknown values

```ts
Columns?: ExecutionColumnSource[]
```

`ExecutionColumnSource[]` means an array of column objects.

```ts
Value?: unknown
```

`unknown` means the value could be any type, but TypeScript requires us to consider its type before treating it as something more specific.

```ts
[key: string]: unknown
```

This allows a book object to have additional properties whose names are strings. The normalizer uses this when handling a possible alternative shape where values are properties of the book.

---

# 4. Set the page size

Create `constants.ts`:

```ts
export const EXECUTION_RESULTS_PAGE_SIZE = 20
```

`const` declares a value that the code does not reassign. The uppercase name signals that this is a shared constant.

Both the page and mock API can import this value. Keeping it in a small separate file also avoids making the mock API import the API service, which itself imports the client that sets up the mock.

To show, for example, ten records per page instead, change it to:

```ts
export const EXECUTION_RESULTS_PAGE_SIZE = 10
```

---

# 5. Add the API request function

Open `reports.ts`. Its existing `getReports` function remains in place.

Add the imports:

```ts
import type { ExecutionReportPayload, Report } from '../types/report'
import { EXECUTION_RESULTS_PAGE_SIZE } from './constants'
```

The file also re-exports the constant:

```ts
export { EXECUTION_RESULTS_PAGE_SIZE } from './constants'
```

That allows another file to import the constant from `reports.ts`, although the page currently imports it directly from `constants.ts`.

Add this request-options interface:

```ts
interface ExecutionResultsRequestOptions extends RequestOptions {
  reportId: string
  start?: number
  limit?: number
}
```

- `extends RequestOptions` includes its optional `signal` property.
- `reportId` is required.
- `start` and `limit` are optional because the function supplies defaults.

Then add:

```ts
export async function getExecutionResults({
  reportId,
  start = 0,
  limit = EXECUTION_RESULTS_PAGE_SIZE,
  signal,
}: ExecutionResultsRequestOptions): Promise<ExecutionReportPayload & {
  executionReport: { total: number }
}> {
  const response = await apiClient.get<ExecutionReportPayload>(
    `/reports/${encodeURIComponent(reportId)}/results`,
    { params: { start, limit }, signal },
  )

  return response.data as ExecutionReportPayload & {
    executionReport: { total: number }
  }
}
```

## What this sends

For report `"1"`, the first request is conceptually:

```text
GET /api/reports/1/results?start=0&limit=20
```

The second page uses:

```text
GET /api/reports/1/results?start=20&limit=20
```

The third uses `start=40`.

## Syntax explained

### `async` and `await`

```ts
export async function getExecutionResults(...)
```

`async` means the function returns a **Promise**: a value that will be available later, after the request finishes.

```ts
const response = await apiClient.get(...)
```

`await` waits for that Promise inside this function. If the request fails, the error is propagated to the caller.

### Destructuring and defaults

```ts
{
  reportId,
  start = 0,
  limit = EXECUTION_RESULTS_PAGE_SIZE,
  signal,
}
```

This extracts properties from the object passed to the function. If `start` or `limit` is omitted, its default is used.

### URL and query parameters

```ts
`/reports/${encodeURIComponent(reportId)}/results`
```

`encodeURIComponent` makes the ID safe to place in a URL path segment.

```ts
{ params: { start, limit }, signal }
```

The inner `{ start, limit }` is shorthand for:

```ts
{ start: start, limit: limit }
```

Axios turns `params` into query parameters. `signal` allows the caller to cancel the request.

### Type assertion

```ts
return response.data as ExecutionReportPayload & {
  executionReport: { total: number }
}
```

`as` tells TypeScript to treat the response as having this shape. `&` combines types.

**Important:** this assertion does not check the server response. If the response lacks `executionReport` or `total`, TypeScript cannot catch that at runtime. The current mock supplies both; a real API should have a clearly agreed contract or runtime validation.

---

# 6. Understand the shared Axios client

The client already exists in `client.ts`:

```ts
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

if (import.meta.env.VITE_USE_MOCK_API !== 'false') {
  setupMockApi(apiClient)
}
```

### Why use a shared client?

Every request can reuse the same base URL and timeout rather than repeating them.

- `baseURL` is added in front of paths such as `/reports/1/results`.
- `timeout: 10000` sets a ten-second request timeout.
- `|| '/api'` uses `/api` if the environment value is missing or empty.
- Unless `VITE_USE_MOCK_API` is the string `"false"`, the mock is attached to this client.

The mock intercepts requests **in the app**. It is not a separately running API server.

---

# 7. Make the mock API paginate

In `mockApi.ts`, import the data and constant:

```ts
import executionResults from '../data/executionResults.json'
import { EXECUTION_RESULTS_PAGE_SIZE } from './constants'
```

Keep the existing `/reports` handler. Add this handler inside `setupMockApi`, before `return mock`:

```ts
mock.onGet(/\/reports\/[^/]+\/results$/).reply((config) => {
  const start = Number(config.params?.start ?? 0)
  const limit = Number(config.params?.limit ?? EXECUTION_RESULTS_PAGE_SIZE)
  const books = executionResults.executionReport.Books

  const safeStart = Number.isFinite(start) && start > 0 ? start : 0
  const safeLimit = Number.isFinite(limit) && limit > 0
    ? limit
    : EXECUTION_RESULTS_PAGE_SIZE

  const page = books.slice(safeStart, safeStart + safeLimit)

  return [200, {
    executionReport: {
      ...executionResults.executionReport,
      Books: page,
      total: books.length,
    },
  }]
})
```

## How this works

### Match the request

```ts
mock.onGet(/\/reports\/[^/]+\/results$/)
```

This is a **regular expression**, used here to match URLs such as:

```text
/reports/1/results
/reports/2/results
```

- `\/` represents a literal `/` inside the regular expression.
- `[^/]+` matches one or more characters other than `/`: the report ID.
- `$` means the match ends at the end of the URL.

The ID is matched but is not currently used to select different book data.

### Read the parameters

```ts
const start = Number(config.params?.start ?? 0)
```

- `config` describes the intercepted request.
- `?.` means “read this property if `params` exists.”
- `?? 0` uses `0` if the value is `null` or `undefined`.
- `Number(...)` converts a value to a number.

`limit` works the same way, defaulting to the shared page size.

### Choose the slice

```ts
const page = books.slice(safeStart, safeStart + safeLimit)
```

`slice(start, end)` returns part of an array. The start is included; the end is excluded.

For a page size of 20:

| Request | `slice` | Records shown to user |
|---|---|---|
| `start=0` | `slice(0, 20)` | 1–20 |
| `start=20` | `slice(20, 40)` | 21–40 |
| `start=40` | `slice(40, 60)` | 41–52 |

JavaScript array indexes begin at **zero**, while the UI shows people-friendly record numbers starting at one.

### Return a response

```ts
return [200, {
  executionReport: {
    ...executionResults.executionReport,
    Books: page,
    total: books.length,
  },
}]
```

- `200` is the HTTP success status.
- `...executionResults.executionReport` copies existing properties from the mock report.
- `Books: page` replaces the full book array with the requested slice.
- `total: books.length` tells the UI how many records exist across **all** pages.

The total is necessary so the table can know whether another page exists.

---

# 8. Prepare the data on the page

Create `ExecutionResultsPage.tsx`. Start with these imports:

```tsx
import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import DynamicResultsTable from "../components/DynamicResultsTable";
import { getExecutionResults, getReports } from "../api/reports";
import { EXECUTION_RESULTS_PAGE_SIZE } from "../api/constants";
import PageLayout from "../layouts/PageLayout";

import type {
  ExecutionColumn,
  ExecutionColumnSource,
  ExecutionReportPayload,
  Report,
} from "../types/report";
```

`import type` imports TypeScript-only definitions. They do not become runtime JavaScript values.

## Define the table-friendly shape

Add this below the imports:

```ts
interface NormalizedExecutionReport {
  columns: ExecutionColumn[];
  rows: Record<string, unknown>[];
  total: number;
}
```

For example, after conversion the data looks conceptually like:

```ts
{
  columns: [
    { description: "Title", type: "string" },
    { description: "Price", type: "number" },
  ],
  rows: [
    { Title: "The Hobbit", Price: 11.25 },
    { Title: "Dune", Price: 10.49 },
  ],
  total: 52,
}
```

`Record<string, unknown>` describes an object with string property names and values whose types are not yet known.

### Why convert the data?

The API’s mock format places a `Columns` array inside each book. Converting it once gives the table a simpler job:

- use `columns` for headings;
- use `rows` for cell values;
- use `total` for pagination.

If the API changes later, you can often update the conversion rather than the table itself.

## Add the conversion function

Add this function above the page component:

```ts
function normalizeExecutionReport(
  payload: ExecutionReportPayload,
): NormalizedExecutionReport {
  const report = payload.executionReport;

  if (!report) return { columns: [], rows: [], total: 0 };

  const books = report.Books ?? report.books ?? [];
  const reportColumns = report.Columns ?? report.columns ?? [];

  const columns: ExecutionColumn[] = reportColumns.map((column) => ({
    description: column.description,
    type: column.type,
  }));

  const rows = books.map((book) => {
    const sourceColumns = book.Columns ?? book.columns;

    if (sourceColumns) {
      return sourceColumns.reduce<Record<string, unknown>>((row, column) => {
        const description =
          column.Description ?? column.description ?? column.Name ?? column.name;

        if (description) row[description] = column.Value ?? column.value;

        return row;
      }, {});
    }

    if (columns.length > 0) {
      return columns.reduce<Record<string, unknown>>((row, column) => {
        row[column.description] = book[column.description];
        return row;
      }, {});
    }

    return { ...book } as Record<string, unknown>;
  });

  if (columns.length === 0 && books[0]) {
    const sourceColumns = books[0].Columns ?? books[0].columns;

    if (sourceColumns) {
      sourceColumns.forEach((column: ExecutionColumnSource) => {
        const description =
          column.Description ?? column.description ?? column.Name ?? column.name;

        const type = column.Type ?? column.type;

        if (description && type) {
          columns.push({ description, type });
        }
      });
    }
  }

  const total = report.total ?? report.Total ?? rows.length;

  return { columns, rows, total };
}
```

### Walk through it

#### Find the books

```ts
const books = report.Books ?? report.books ?? [];
```

Try `Books`, then `books`, then an empty array. `??` only falls back when the value is `null` or `undefined`.

#### Convert each book into a row

```ts
const rows = books.map((book) => {
  // ...
});
```

`map` creates a new array by running the function once for each book.

For a book with columns such as:

```ts
[
  { Description: "Title", Value: "Dune" },
  { Description: "Price", Value: 10.49 },
]
```

the `reduce` produces:

```ts
{ Title: "Dune", Price: 10.49 }
```

This line adds each value:

```ts
row[description] = column.Value ?? column.value;
```

Square brackets are used because the property name is held in the variable `description`.

The `??` also preserves valid values such as `false` and `0`.

#### Decide the headers

For the current mock data, the API does not provide a separate report-level list of columns. Therefore, the code uses the first book’s `Columns` array:

```ts
if (columns.length === 0 && books[0]) {
  // Add descriptions and types from the first book.
}
```

**Current assumption:** the books on a page have consistent columns. If later books contain additional columns not present in the first one, those extra columns will not automatically become headers.

#### Read the total

```ts
const total = report.total ?? report.Total ?? rows.length;
```

The mock supplies `total`. If it is absent, the fallback is the number of rows in the current response. That fallback cannot tell the UI about additional pages, so a real paginated API should return the full total.

---

# 9. Add the page component and state

Below `normalizeExecutionReport`, start the page component:

```tsx
export default function ExecutionResultsPage() {
  const { id } = useParams<{ id: string }>();

  const [start, setStart] = useState(0);
  const [title, setTitle] = useState("Report Name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [result, setResult] = useState<NormalizedExecutionReport>({
    columns: [],
    rows: [],
    total: 0,
  });

  // Effects and JSX go here.
}
```

## State explained

`useState` gives React a value and a function to update it:

```ts
const [start, setStart] = useState(0);
```

- `start` is the current zero-based offset.
- `setStart(...)` updates it.
- React re-renders the component after the state changes.

The other state values control the title, loading message, error message and prepared results.

```ts
useState<NormalizedExecutionReport>(...)
```

The part in `<...>` tells TypeScript the expected type of the state.

`useParams` reads the route:

```ts
const { id } = useParams<{ id: string }>();
```

For `/reports/1`, `id` is `"1"`. The component checks that it exists before making requests.

---

# 10. Reset the offset when the report changes

Inside the component, after the state declarations, add:

```tsx
useEffect(() => {
  setStart(0);
}, [id]);
```

`useEffect` runs code after React renders. Its second argument is a **dependency array**:

```ts
[id]
```

React re-runs this effect when `id` changes. Resetting the offset means that navigating to another report starts at its first page.

---

# 11. Load the report title

Add the following effect:

```tsx
useEffect(() => {
  if (!id) return;

  const controller = new AbortController();

  getReports({ signal: controller.signal })
    .then((reports: Report[]) => {
      if (!controller.signal.aborted) {
        const report = reports.find((item) => item.id === id);

        if (report) setTitle(report.title);
      }
    })
    .catch((requestError: unknown) => {
      if (!axios.isCancel(requestError) && !controller.signal.aborted) {
        setTitle("Report Name");
      }
    });

  return () => controller.abort();
}, [id]);
```

### What it does

1. Fetches the report list.
2. Finds the report whose ID matches the URL.
3. Sets its title as the page heading.

```ts
reports.find((item) => item.id === id)
```

`find` returns the first matching item, or `undefined` if none exists. `===` checks for equality.

### Why use `AbortController`?

```ts
const controller = new AbortController();
```

This creates a cancellation controller.

```ts
return () => controller.abort();
```

This is the effect’s **cleanup function**. React calls it when the effect is being replaced or the component is removed. It prevents an old request from updating the page after navigation.

### Current behavior to be aware of

If the title request fails, the page silently uses `"Report Name"`. If an ID is not found, there is no dedicated “report not found” message. Those are current limitations, not features of the mock API.

---

# 12. Load the results whenever the page changes

Add another effect:

```tsx
useEffect(() => {
  if (!id) return;

  const controller = new AbortController();

  setLoading(true);
  setError("");

  getExecutionResults({
    reportId: id,
    start,
    limit: EXECUTION_RESULTS_PAGE_SIZE,
    signal: controller.signal,
  })
    .then((payload) => {
      if (!controller.signal.aborted) {
        setResult(normalizeExecutionReport(payload));
        setLoading(false);
      }
    })
    .catch((requestError: unknown) => {
      if (axios.isCancel(requestError) || controller.signal.aborted) return;

      setError("Unable to load execution results. Please try again later.");
      setLoading(false);
    });

  return () => controller.abort();
}, [id, start]);
```

The key part is the dependency array:

```ts
[id, start]
```

When the report ID **or** the starting offset changes, React runs the effect again and requests the corresponding data.

### Success and failure

```ts
.then((payload) => {
  setResult(normalizeExecutionReport(payload));
})
```

`.then(...)` handles a successful Promise. The API response is normalized before it goes into state.

```ts
.catch((requestError: unknown) => {
  // ...
})
```

`.catch(...)` handles failure. Cancelled requests are ignored because cancellation is expected during navigation or page changes; other failures show an error.

---

# 13. Render the page

Still inside `ExecutionResultsPage`, add the return statement after the effects:

```tsx
return (
  <PageLayout>
    <h1>{title}</h1>

    {loading && <p role="status">Loading execution results...</p>}

    {error && <p role="alert">{error}</p>}

    {!loading && !error && (
      <DynamicResultsTable
        columns={result.columns}
        rows={result.rows}
        start={start}
        pageSize={EXECUTION_RESULTS_PAGE_SIZE}
        total={result.total}
        onPageChange={setStart}
      />
    )}
  </PageLayout>
);
```

Close the function with `}`.

### JSX syntax

```tsx
{loading && <p>Loading...</p>}
```

This displays the paragraph only when `loading` is true.

```tsx
{!loading && !error && (...)}
```

`!` means “not.” The table appears only when the request is no longer loading and there is no error.

### Passing props

```tsx
<DynamicResultsTable
  columns={result.columns}
  rows={result.rows}
  onPageChange={setStart}
/>
```

These are **props**: values passed from a parent component to a child component.

`onPageChange={setStart}` passes the function itself. The table can call it with a new offset, causing the page to request another set of records.

`PageLayout` provides the shared page wrapper and spacing.

---

# 14. Create the reusable table

Create `DynamicResultsTable.tsx`.

## Imports and props

```tsx
import "./DynamicResultsTable.scss";

import type { ExecutionColumn } from "../types/report";

export interface DynamicResultsTableProps {
  columns: ExecutionColumn[];
  rows: Record<string, unknown>[];
  start: number;
  pageSize: number;
  total: number;
  onPageChange: (start: number) => void;
}
```

The props describe everything the table needs. It does **not** make API requests itself.

```ts
onPageChange: (start: number) => void;
```

This describes a function that accepts a number and does not return a useful value. The table calls it when the user selects a page.

## Format cell values

Add:

```tsx
function formatValue(value: unknown, type: ExecutionColumn["type"]) {
  if (value === null || value === undefined || value === "") return "-";

  if (type === "boolean") return value ? "Yes" : "No";

  if (type === "number" && typeof value === "number") {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(value);
  }

  return String(value);
}
```

- `ExecutionColumn["type"]` reuses the type of the `type` property from `ExecutionColumn`.
- `===` compares values.
- `||` means “or.”
- The ternary `value ? "Yes" : "No"` selects one of two results.
- `typeof value === "number"` checks the value before treating it as a number.
- `Intl.NumberFormat` formats numbers using the environment’s locale.
- `String(value)` converts other values to displayable text.

**Assumption:** a column declared as boolean actually contains a boolean. For example, the string `"false"` is truthy in JavaScript and would display as “Yes.” A real API should send actual `true`/`false` values.

## Define the component

Add:

```tsx
export function DynamicResultsTable({
  columns,
  rows,
  start,
  pageSize,
  total,
  onPageChange,
}: DynamicResultsTableProps) {
  if (columns.length === 0) {
    return <p>No result columns available.</p>;
  }

  const end = Math.min(start + rows.length, total);
  const canGoPrevious = start > 0;
  const canGoNext = start + pageSize < total;

  return (
    <div className="dynamic-results">
      <div
        className="table-container"
        role="region"
        aria-label="Execution results table"
        tabIndex={0}
      >
        <table className="dynamic-results-table" aria-label="Execution results">
          <thead>
            <tr>
              {columns.map((column) => (
                <th scope="col" key={column.description}>
                  {column.description}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column.description}>
                    {formatValue(row[column.description], column.type)}
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
          onClick={() => onPageChange(Math.max(0, start - pageSize))}
        >
          Previous
        </button>

        <span role="status">
          {total === 0
            ? "No records"
            : `Showing ${start + 1}-${end} of ${total}`}
        </span>

        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => onPageChange(start + pageSize)}
        >
          Next
        </button>
      </nav>
    </div>
  );
}

export const dynamicResultsTable = DynamicResultsTable;
export default DynamicResultsTable;
```

The last two lines provide both a named lowercase alias and the default export. The page uses the default import named `DynamicResultsTable`. React component names conventionally begin with a capital letter.

## How the dynamic columns work

```tsx
{columns.map((column) => (
  <th scope="col" key={column.description}>
    {column.description}
  </th>
))}
```

For every column, `map` produces a `<th>` heading. No particular book fields are hard-coded into the table.

- `scope="col"` identifies the cell as a column heading.
- `key` helps React identify items in a rendered list.
- The current implementation assumes descriptions are unique within a table.

## How the rows and cells work

```tsx
{rows.map((row, index) => (
  <tr key={index}>
    {columns.map((column) => (
      <td key={column.description}>
        {formatValue(row[column.description], column.type)}
      </td>
    ))}
  </tr>
))}
```

There are two loops:

1. The outer `map` creates a `<tr>` for each row.
2. The inner `map` creates a `<td>` for each column.

If `column.description` is `"Title"`, then:

```ts
row[column.description]
```

is equivalent to:

```ts
row["Title"]
```

The current implementation uses the row’s array index as its key. If the API later supplies stable unique row IDs, those would be preferable—especially if rows can be reordered or edited.

## How pagination works

```ts
const canGoPrevious = start > 0;
const canGoNext = start + pageSize < total;
```

At the start, `start` is `0`, so Previous is disabled.

With `start=40`, `pageSize=20`, and `total=52`:

```text
40 + 20 < 52  →  false
```

So Next is disabled on the last page.

When Next is clicked:

```tsx
onClick={() => onPageChange(start + pageSize)}
```

The arrow function delays the call until the click occurs. It calls the parent’s `setStart`, which triggers the results effect to fetch again.

Previous uses:

```ts
Math.max(0, start - pageSize)
```

That prevents the offset from going below zero.

### Accessibility

- `aria-label` gives the table and pagination region useful names.
- `role="status"` identifies changing status text.
- `tabIndex={0}` makes the horizontally scrollable region keyboard-focusable.
- `disabled` prevents unavailable pagination actions.

---

# 15. Add table styling

Create `DynamicResultsTable.scss`:

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

.dynamic-results-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  button {
    font: inherit;
    padding: 8px 12px;
    border: 1px solid #dbe2ea;
    border-radius: 4px;
    background: white;
  }

  button:not(:disabled) {
    cursor: pointer;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  span {
    color: #526074;
  }
}

@media (max-width: 600px) {
  .dynamic-results-pagination {
    align-items: stretch;
    flex-wrap: wrap;

    span {
      order: -1;
      width: 100%;
      text-align: center;
    }
  }
}
```

### Why these styles?

- `display: flex` and `gap` arrange the table and controls with spacing.
- `min-width: 720px` gives the columns room.
- `border-collapse: collapse` combines table borders.
- The media query adjusts the pagination layout on narrow screens.
- SCSS allows nesting selectors, such as `button` inside `.dynamic-results-pagination`.

The scrollable wrapper uses `.table-container`, whose `overflow-x: auto` style currently lives in `ReportTable.scss`. That stylesheet is imported by the reports table. If you reuse the dynamic table in an app without that stylesheet, give its wrapper the same horizontal-scroll styling or move the shared style to a shared stylesheet.

---

# 16. Try it manually

Start the existing development server:

```sh
npm run dev
```

Open the URL Vite prints, then:

1. Click **Monthly sales** on the reports page.
2. Check that the heading says **Monthly sales**.
3. Check that the book columns are generated from the mock data.
4. The first page should show **1–20 of 52**.
5. Click **Next**: it should show **21–40 of 52**.
6. Click **Next** again: it should show **41–52 of 52**, and Next should be disabled.
7. Click **Previous** to return to the second page.
8. Try opening `/reports/2` directly: the heading should be **Customer feedback**.

For now, both reports show the same book dataset; the mock does not yet vary results by report ID.