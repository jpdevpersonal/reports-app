import axios from "axios";
import { useEffect, useState } from "react";

import { EXECUTION_RESULTS_PAGE_SIZE } from "../api/constants";
import { getExecutionResults } from "../api/reports";
import type {
  ExecutionColumn,
  ExecutionColumnSource,
  ExecutionReportPayload,
} from "../types/report";

export interface NormalizedExecutionReport {
  columns: ExecutionColumn[];
  rows: Record<string, unknown>[];
  total: number;
}

interface ExecutionResultsState {
  data: NormalizedExecutionReport | null;
  loading: boolean;
  error: string;
}

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

export default function useExecutionResultsData(
  reportId: string | undefined,
  start: number,
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
      start,
      limit: EXECUTION_RESULTS_PAGE_SIZE,
      signal: controller.signal,
    })
      .then((payload) => {
        if (!controller.signal.aborted) {
          setState({
            data: normalizeExecutionReport(payload),
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
  }, [reportId, start]);

  return state;
}
