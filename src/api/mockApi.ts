import MockAdapter from 'axios-mock-adapter'
import type { AxiosInstance } from 'axios'
import reports from '../data/reports.json'
import reportFields from '../data/reportFields.json'

export function setupMockApi(client: AxiosInstance) {
  const mock = new MockAdapter(client, { delayResponse: 150 })

  mock.onGet('/reports').reply(200, reports)

  // Matches URLs such as /reports/1/fields
  mock.onGet(/^\/reports\/[^/]+\/fields$/).reply((config) => {
    const reportId = decodeURIComponent(config.url?.split('/')[2] ?? '')
    const entry = reportFields.find((item) => item.reportId === reportId)

    return entry ? [200, entry.fields] : [404, { message: 'Report not found' }]
  })

  return mock
}
