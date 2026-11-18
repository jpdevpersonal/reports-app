import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "../api/client";
import { setupMockApi } from "../api/mockApi";
import reportFields from "../data/reportFields.json";
import type { ReportField } from "../types/reportField";
import ReportPage from "./ReportPage";

let mock: MockAdapter;

beforeEach(() => {
  // Serves the real data/reportFields.json file, just like the running app.
  mock = setupMockApi(apiClient);
});

afterEach(() => {
  mock.restore();
});

function NavigateButton({ to }: { to: string }) {
  const navigate = useNavigate();
  return <button onClick={() => navigate(to)}>Go to {to}</button>;
}

function renderPage(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/reports/:id"
          element={
            <>
              <NavigateButton to="/reports/3" />
              <ReportPage />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ReportPage", () => {
  it("reads the JSON file and adds a component for every field in it", async () => {
    renderPage("/reports/1");

    expect(screen.getByRole("heading", { name: "Report Name" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Loading report fields...");

    const expected = reportFields.find((entry) => entry.reportId === "1")!;
    expect(await screen.findByRole("textbox", { name: "Author" })).toHaveValue("Alex Morgan");

    const region = screen.getByRole("combobox", { name: "Region" });
    expect(region).toHaveValue("");
    expect(screen.getAllByRole("option").slice(1).map((option) => option.textContent))
      .toEqual(expected.fields[1].value);

    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(mock.history.get.map((request) => request.url)).toEqual(["/reports/1/fields"]);
  });

  it("adds a CustomText for string fields and a CustomArray for array fields", async () => {
    const fields: ReportField[] = [
      { id: "a", label: "First text", dataType: "string", value: "one" },
      { id: "b", label: "Choice", dataType: "array", value: ["X", "Y"] },
      { id: "c", label: "Second text", dataType: "string", value: "two" },
    ];
    mock.reset();
    mock.onGet("/reports/42/fields").reply(200, fields);

    renderPage("/reports/42");

    expect(await screen.findByRole("textbox", { name: "First text" })).toHaveValue("one");
    expect(screen.getByRole("textbox", { name: "Second text" })).toHaveValue("two");
    expect(screen.getByRole("combobox", { name: "Choice" })).toBeInTheDocument();
  });

  it("keeps what the user types and selects", async () => {
    const user = userEvent.setup();
    renderPage("/reports/1");

    const author = await screen.findByRole("textbox", { name: "Author" });
    await user.clear(author);
    await user.type(author, "Jo Smith");
    await user.selectOptions(screen.getByRole("combobox", { name: "Region" }), "West");

    expect(author).toHaveValue("Jo Smith");
    expect(screen.getByRole("combobox", { name: "Region" })).toHaveValue("West");
  });

  it("loads new fields and clears entered values when the report changes", async () => {
    const user = userEvent.setup();
    renderPage("/reports/1");

    await user.selectOptions(
      await screen.findByRole("combobox", { name: "Region" }),
      "West",
    );
    await user.click(screen.getByRole("button", { name: "Go to /reports/3" }));

    expect(await screen.findByRole("combobox", { name: "Channel" })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "Period" })).toHaveValue("");
    expect(screen.queryByRole("combobox", { name: "Region" })).not.toBeInTheDocument();
    expect(mock.history.get.map((request) => request.url))
      .toEqual(["/reports/1/fields", "/reports/3/fields"]);
  });

  it("shows a message when the report has no fields", async () => {
    mock.reset();
    mock.onGet("/reports/1/fields").reply(200, []);

    renderPage("/reports/1");

    expect(await screen.findByText("This report has no fields.")).toBeInTheDocument();
  });

  it("shows an error when the report cannot be found", async () => {
    renderPage("/reports/unknown");

    expect(await screen.findByRole("alert"))
      .toHaveTextContent("Unable to load report fields. Please try again later.");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
