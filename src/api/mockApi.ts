import MockAdapter from 'axios-mock-adapter'
import type { AxiosInstance } from 'axios'
import reports from '../data/reports.json'
import executionResults from '../data/executionResults2.json'
import { EXECUTION_RESULTS_PAGE_SIZE } from './constants'

export function setupMockApi(client: AxiosInstance) {
  const mock = new MockAdapter(client, { delayResponse: 150 })

  mock.onGet('/reports').reply(200, reports)
  mock.onPost(/\/reports\/[^/]+\/executions$/).reply((config) => {
    const pageNumber = Number(config.params?.page ?? 0)
    const pageSize = Number(config.params?.size ?? EXECUTION_RESULTS_PAGE_SIZE)
    const rows = executionResults.rows
    const safePageNumber = Number.isFinite(pageNumber) && pageNumber > 0
      ? Math.floor(pageNumber)
      : 0
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0
      ? pageSize
      : EXECUTION_RESULTS_PAGE_SIZE
    const safeStart = safePageNumber * safePageSize
    const page = rows.slice(safeStart, safeStart + safePageSize)
    const numberOfRecords = rows.length
    const numberOfPages = Math.ceil(numberOfRecords / safePageSize)

    return [200, {
      ...executionResults,
      pagination: {
        pageNumber: safePageNumber,
        pageSize: safePageSize,
        numberOfRecords,
        numberOfPages,
      },
      rows: page,
    }]
  })

  return mock
}
