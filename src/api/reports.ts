import { apiClient } from "./client";
import type {
  ExecutionReportPayload,
  Report,
  ReportExecutionRequest,
} from "../types/report";
import { EXECUTION_RESULTS_PAGE_SIZE } from "./constants";

export { EXECUTION_RESULTS_PAGE_SIZE } from "./constants";

interface RequestOptions {
  signal?: AbortSignal;
}

export async function getReports({ signal }: RequestOptions = {}): Promise<
  Report[]
> {
  const response = await apiClient.get<Report[]>("/reports", { signal });
  return response.data;
}

interface ExecutionResultsRequestOptions extends RequestOptions {
  reportId: string;
  executionRequest: ReportExecutionRequest;
  start?: number;
  limit?: number;
}

export async function getExecutionResults({
  reportId,
  executionRequest,
  start = 0,
  limit = EXECUTION_RESULTS_PAGE_SIZE,
  signal,
}: ExecutionResultsRequestOptions): Promise<ExecutionReportPayload> {
  const safeLimit =
    Number.isFinite(limit) && limit > 0 ? limit : EXECUTION_RESULTS_PAGE_SIZE;
  const safeStart = Number.isFinite(start) && start > 0 ? start : 0;
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
  );
  return response.data;
}
