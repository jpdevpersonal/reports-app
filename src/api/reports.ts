import { apiClient } from './client'
import type { ExecutionReportPayload, Report } from '../types/report'
import { EXECUTION_RESULTS_PAGE_SIZE } from './constants'

export { EXECUTION_RESULTS_PAGE_SIZE } from './constants'

interface RequestOptions {
  signal?: AbortSignal
}

export async function getReports({ signal }: RequestOptions = {}): Promise<Report[]> {
  const response = await apiClient.get<Report[]>('/reports', { signal })
  return response.data
}

interface ExecutionResultsRequestOptions extends RequestOptions {
  reportId: string
  start?: number
  limit?: number
}

export async function getExecutionResults({
  reportId,
  start = 0,
  limit = EXECUTION_RESULTS_PAGE_SIZE,
  signal,
}: ExecutionResultsRequestOptions): Promise<ExecutionReportPayload> {
  const response = await apiClient.get<ExecutionReportPayload>(
    `/reports/${encodeURIComponent(reportId)}/results`,
    { params: { start, limit }, signal },
  )
  return response.data
}
