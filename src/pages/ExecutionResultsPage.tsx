import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import DynamicResultsTable from "../components/DynamicResultsTable";
import {
  getExecutionResults,
  getReports,
} from "../api/reports";
import { EXECUTION_RESULTS_PAGE_SIZE } from "../api/constants";
import PageLayout from "../layouts/PageLayout";
import type {
  ExecutionColumn,
  ExecutionColumnSource,
  ExecutionReportPayload,
  Report,
} from "../types/report";

interface NormalizedExecutionReport {
  columns: ExecutionColumn[];
  rows: Record<string, unknown>[];
  total: number;
}

function normalizeExecutionReport(payload: ExecutionReportPayload): NormalizedExecutionReport {
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

  useEffect(() => {
    setStart(0);
  }, [id]);

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
}
