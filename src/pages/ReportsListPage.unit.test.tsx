import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { Report } from "../types/report";

import ReportsListPage from "./ReportsListPage";

const { mockUseReportsData } = vi.hoisted(() => ({
  mockUseReportsData: vi.fn<
    () => {
      data: Report[] | null;
      loading: boolean;
      error: string;
    }
  >(),
}));

vi.mock("../hooks/useReportsData", () => ({
  default: mockUseReportsData,
}));

const reports: Report[] = [
  {
    id: "report-42",
    title: "Quarterly sales",
    category: "Sales",
    date: "2026-10-31",
    summary: "Sales results for the quarter.",
    content: "Full sales report.",
  },
  {
    id: "report-99",
    title: "Support overview",
    category: "Support",
    date: "2026-11-01",
    summary: "A summary of support requests.",
    content: "Full support report.",
  },
];

beforeEach(() => {
  mockUseReportsData.mockReset();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <ReportsListPage />
    </MemoryRouter>,
  );
}

describe("ReportsListPage with a mocked hook", () => {
  it("shows a loading message while reports are being fetched", () => {
    mockUseReportsData.mockReturnValue({
      data: null,
      loading: true,
      error: "",
    });

    renderPage();

    expect(
      screen.getByRole("heading", { name: "Reports" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Loading reports...");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(mockUseReportsData).toHaveBeenCalledWith();
  });

  it("displays report columns, rows and links when data is available", () => {
    mockUseReportsData.mockReturnValue({
      data: reports,
      loading: false,
      error: "",
    });

    renderPage();

    const table = within(screen.getByRole("table", { name: "Reports Table" }));
    expect(
      table.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual(["Title", "Category", "Date", "Summary"]);

    const rows = table.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(reports.length);

    reports.forEach((report, index) => {
      const row = within(rows[index]);
      expect(row.getByRole("rowheader")).toHaveTextContent(report.title);
      expect(row.getByRole("link", { name: report.title })).toHaveAttribute(
        "href",
        `/reports/${report.id}`,
      );
      expect(
        row.getByRole("cell", { name: report.category }),
      ).toBeInTheDocument();
      expect(row.getByRole("cell", { name: report.date })).toBeInTheDocument();
      expect(
        row.getByRole("cell", { name: report.summary }),
      ).toBeInTheDocument();
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no reports", () => {
    mockUseReportsData.mockReturnValue({ data: [], loading: false, error: "" });

    renderPage();

    expect(screen.getByText("No reports available.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("displays the error message returned by the hook", () => {
    const error = "Unable to load reports. Please try again later.";
    mockUseReportsData.mockReturnValue({ data: null, loading: false, error });

    renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent(error);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText("No reports available.")).not.toBeInTheDocument();
  });
});
