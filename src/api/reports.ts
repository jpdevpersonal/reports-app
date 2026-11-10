import { apiClient } from './client'
import type { Report } from '../types/report'
import type { ReportField } from '../types/reportField'

interface RequestOptions {
  signal?: AbortSignal
}

export async function getReports({ signal }: RequestOptions = {}): Promise<Report[]> {
  const response = await apiClient.get<Report[]>('/reports', { signal })
  return response.data
}

export async function getReportFields(
  reportId: string,
  { signal }: RequestOptions = {},
): Promise<ReportField[]> {
  const response = await apiClient.get<ReportField[]>(
    `/reports/${encodeURIComponent(reportId)}/fields`,
    { signal },
  )
  return response.data
}
