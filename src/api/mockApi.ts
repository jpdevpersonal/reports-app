import MockAdapter from 'axios-mock-adapter'
import type { AxiosInstance } from 'axios'
import reports from '../data/reports.json'
import executionResults from '../data/executionResults2.json'
import { EXECUTION_RESULTS_PAGE_SIZE } from './constants'

export function setupMockApi(client: AxiosInstance) {
  const mock = new MockAdapter(client, { delayResponse: 150 })

  mock.onGet('/reports').reply(200, reports)
  mock.onGet(/\/reports\/[^/]+\/results$/).reply((config) => {
    const start = Number(config.params?.start ?? 0)
    const limit = Number(config.params?.limit ?? EXECUTION_RESULTS_PAGE_SIZE)
    const rows = executionResults.rows
    const safeStart = Number.isFinite(start) && start > 0 ? start : 0
    const safeLimit = Number.isFinite(limit) && limit > 0
      ? limit
      : EXECUTION_RESULTS_PAGE_SIZE
    const page = rows.slice(safeStart, safeStart + safeLimit)
    const numberOfRecords = rows.length
    const numberOfPages = Math.ceil(numberOfRecords / safeLimit)

    return [200, {
      ...executionResults,
      pagination: {
        pageNumber: Math.floor(safeStart / safeLimit),
        pageSize: safeLimit,
        numberOfRecords,
        numberOfPages,
      },
      rows: page,
    }]
  })

  return mock
}
