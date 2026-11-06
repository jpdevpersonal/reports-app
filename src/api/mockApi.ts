import MockAdapter from 'axios-mock-adapter'
import type { AxiosInstance } from 'axios'
import reports from '../data/reports.json'

export function setupMockApi(client: AxiosInstance) {
  const mock = new MockAdapter(client, { delayResponse: 150 })

  mock.onGet('/reports').reply(200, reports)

  return mock
}
