import { apiClient } from './client'
import type { Report } from '../types/report'

interface RequestOptions {
  signal?: AbortSignal
}

export async function getReports({ signal }: RequestOptions = {}): Promise<Report[]> {
  const response = await apiClient.get<Report[]>('/reports', { signal })
  return response.data
}
