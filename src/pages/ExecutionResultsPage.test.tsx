import { afterEach, beforeEach, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import MockAdapter from "axios-mock-adapter";

import { apiClient } from "../api/client";
import { EXECUTION_RESULTS_PAGE_SIZE } from "../api/constants";
import reports from "../data/reports.json";
import ExecutionResultsPage from "./ExecutionResultsPage";

let mock: MockAdapter;

beforeEach(() => {
  mock = new MockAdapter(apiClient, {
    delayResponse: 10,
    onNoMatch: "throwException",
  });
});

afterEach(() => {
  cleanup();
  mock.restore();
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/reports/1"]}>
      <Routes>
        <Route path="/reports/:id" element={<ExecutionResultsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

it("loads report details and execution results through the hooks", async () => {
  mock.onGet("/reports").reply(200, reports);
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
    rows: [{ entries: ["The Hobbit", true] }],
  });

  renderPage();

  expect(await screen.findByRole("heading", { name: "Monthly sales" }))
    .toBeInTheDocument();
  const table = within(await screen.findByRole("table", {
    name: "Execution results",
  }));
  expect(table.getByRole("columnheader", { name: "Title" })).toBeInTheDocument();
  expect(table.getByRole("cell", { name: "The Hobbit" })).toBeInTheDocument();
  expect(table.getByRole("cell", { name: "Yes" })).toBeInTheDocument();
  const request = mock.history.post.find((item) =>
    item.url === "/reports/1/executions",
  );
  expect(request?.params).toEqual({
    page: 0,
    size: EXECUTION_RESULTS_PAGE_SIZE,
  });
  expect(JSON.parse(request?.data)).toEqual({
    inputParameters: {},
  });
});

it("requests the next page when pagination changes", async () => {
  mock.onGet("/reports").reply(200, reports);
  mock.onPost("/reports/1/executions").reply(200, {
    pagination: {
      pageNumber: 0,
      pageSize: 20,
      numberOfRecords: 21,
      numberOfPages: 2,
    },
    columns: [
      { id: "title", displayName: "Title", dataType: "string" },
    ],
    rows: [{ entries: ["The Hobbit"] }],
  });

  const user = userEvent.setup();
  renderPage();

  await screen.findByRole("table", { name: "Execution results" });
  await user.click(screen.getByRole("button", { name: "Next" }));

  expect(mock.history.post.filter((request) =>
    request.url === "/reports/1/executions",
  ).at(-1)?.params).toEqual({
    page: 1,
    size: EXECUTION_RESULTS_PAGE_SIZE,
  });
});

it("shows an error when execution results fail to load", async () => {
  mock.onGet("/reports").reply(200, reports);
  mock.onPost("/reports/1/executions").reply(500);

  renderPage();

  expect(await screen.findByRole("alert"))
    .toHaveTextContent("Unable to load execution results");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});
