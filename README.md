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
- `/reports/:id` displays a placeholder page without fetching an individual report.
- [src/api/reports.ts](src/api/reports.ts) exposes the typed `getReports` function.
- [src/api/client.ts](src/api/client.ts) configures the shared Axios client.
- [src/data/reports.json](src/data/reports.json) contains the example data.
- [src/api/mockApi.ts](src/api/mockApi.ts) intercepts Axios requests and serves that JSON for `GET /reports`. No separate backend is needed; this also works in the production build.

Loading, empty and error states are included. Tests cover the API service,
failed requests, cancellation, navigation and direct placeholder-page access.

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
for frontend routes such as `/reports/1` so refreshing a placeholder page works.
