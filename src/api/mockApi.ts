import MockAdapter from 'axios-mock-adapter'
import type { AxiosInstance } from 'axios'
import reports from '../data/reports.json'

export function setupMockApi(client: AxiosInstance) {
  const mock = new MockAdapter(client, { delayResponse: 150 })

  mock.onGet('/reports').reply(200, reports)
  mock.onGet(/^\/reports\/[^/]+$/).reply((config) => {
    if (!config.url) throw new Error('Mock report request is missing its URL.')
    const id = decodeURIComponent(config.url.slice('/reports/'.length))
    const report = reports.find((item) => item.id === id)
    return report
      ? [200, report]
      : [404, { message: 'Report not found.' }]
  })

  return mock
}
