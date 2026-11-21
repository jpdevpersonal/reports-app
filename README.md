# Reports app

A minimal React + Vite example using TypeScript, Axios and React Router.

Styles use Sass (SCSS syntax). Global styles live in
[src/styles.scss](src/styles.scss), and reusable table styles live alongside
the component in [src/components/DataTable.scss](src/components/DataTable.scss).
Vite compiles imported SCSS automatically during development and production builds.

## Run locally

Requires Node.js 22.12+ (22.x), 24.x or 26+ for the app and test tooling.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite.

```sh
npm test
npm run typecheck
npm run build
npm run preview
```

## How it works

- `/` displays reports in a table with title, category, date and summary columns. Enter a report name above the table and select Search (or press Enter) to filter locally by case-insensitive partial title. An empty search shows all reports. The table scrolls horizontally on narrow screens.
- `/reports/:id` reads the matching report definition from local JSON and renders editable fields based on each field's `dataType`, without an API request. Unknown IDs show "Report not found".
- [src/api/reports.ts](src/api/reports.ts) exposes the typed `getReports` function.
- [src/api/client.ts](src/api/client.ts) configures the shared Axios client.
- [src/data/reports.json](src/data/reports.json) contains the example data.
- [src/api/mockApi.ts](src/api/mockApi.ts) intercepts Axios requests and serves that JSON for `GET /reports`. No separate backend is needed; this also works in the production build.

Loading, empty and error states are included. Tests cover the API service,
failed requests, cancellation, navigation, dynamic report fields and direct report-page access.

## JSON-driven report components

[src/pages/ReportPage.tsx](src/pages/ReportPage.tsx) imports
[src/data/reportDefinitions.json](src/data/reportDefinitions.json). This mock file
contains one definition per report ID; keep IDs aligned with
[src/data/reports.json](src/data/reports.json). For example:

```json
{
  "id": "1",
  "title": "Monthly sales",
  "fields": [
    { "id": "notes", "label": "Notes", "dataType": "string", "value": "" },
    {
      "id": "region",
      "label": "Region",
      "dataType": "array",
      "options": ["North", "South"],
      "value": "North"
    }
  ]
}
```

Add that object to the JSON file's top-level array. Any number or combination
of fields is supported, in JSON order. `string` renders `CustomText`, a text box;
`array` renders `CustomArray`, a single-selection dropdown whose string choices
come from `options`. Its `value` is the selected string, not an array.
An empty value means no selection. Report IDs must be unique; field IDs must be
unique within each report. Labels and IDs must be nonblank. Dropdown options
must be unique, nonempty strings, and a nonempty value must match an option.
Malformed definitions and unsupported data types show an alert instead of
silently dropping controls. All definitions are validated before rendering.

Both controls inherit shared label/layout rendering from the generic
`CustomComponent<TValue, TField>` base in
[src/components/customComponent.tsx](src/components/customComponent.tsx).
React class names use PascalCase so JSX treats them as components; their file
names retain `customComponent`, `customText` and `customArray`.
Controls are controlled: they receive a typed `field` and `onChange(value)`.
Edits remain local to the open report, do not modify the JSON, and reset when
navigating to a different report. There is no save/backend persistence.
JSON imports are bundled by Vite, so changes require a rebuild in production.

To support another data type:

1. Add its field shape to `FieldTypeMap` in
   [src/types/reportDefinition.ts](src/types/reportDefinition.ts).
2. Extend `CustomComponent` and implement `renderControl()`.
3. Add a validator and component using `registerField` in
   [src/components/reportFieldRegistry.tsx](src/components/reportFieldRegistry.tsx).
   The registry drives both validation and rendering; no new page rendering
   branch is needed. For non-string values, also extend the page's edit-state
   value type (currently `string`).
4. Add JSON fields and tests for the new type.

## Project structure

- [src/App.tsx](src/App.tsx) defines routes and the shared page container.
- [src/pages/](src/pages/) contains the reports list, report details and not-found pages. Add new pages here and register their routes in `App.tsx`.
- [src/components/DataTable.tsx](src/components/DataTable.tsx) is a generic, API-independent table with its own stylesheet. Pass `label`, `rows`, `columns` and `getRowKey`; optionally pass `emptyMessage`. Use `TableColumn<YourRowType>[]` to type column definitions. Row fields must be renderable React values.
- [src/hooks/useReportsData.ts](src/hooks/useReportsData.ts) fetches the reports list and manages loading/error state and cancellation.
- [src/types/report.ts](src/types/report.ts) defines the shared report model.
- [src/api/](src/api/) contains Axios services and the mock API.

The reports hook takes no arguments and only calls `getReports`. Its initial
state supplies the loading state; the effect starts/cancels the request and
updates state asynchronously when it settles, with no synchronous state reset.

Each table column defines a unique `key` and a `header`. By default, cells
display `row[column.key]`. Supply `render(row)` for custom content such as
links or dates, and `rowHeader: true` for a row's identifying column.
`getRowKey(row)` must return a stable, unique key.

Strict TypeScript checking covers source files, tests and Vite configuration.
`npm run build` runs the type checker before producing the production bundle.
Axios response types describe the expected API contract; they do not perform
runtime validation of backend responses.

## Connect a real API

Copy `.env.example` to `.env.local`, then set:

```dotenv
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:3000/api
```

Restart Vite after changing environment variables. These settings are public,
build-time configuration; do not put secrets in them.

The API should return an array for `GET /reports`, using the fields in the
example JSON. Configure CORS on the backend if it runs on a different origin.

When hosting the built `dist` folder, configure the host to serve `index.html`
for frontend routes such as `/reports/1` so refreshing a report page works.
