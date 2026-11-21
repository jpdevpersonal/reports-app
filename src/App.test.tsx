import { afterEach, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { apiClient } from './api/client'
import { setupMockApi } from './api/mockApi'
import reports from './data/reports.json'

let mock = setupMockApi(apiClient)

afterEach(() => {
  mock.restore()
  mock = setupMockApi(apiClient)
})

function renderApp(path = '/') {
  return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)
}

it('loads the report table and opens execution results when a title is clicked', async () => {
  const user = userEvent.setup()
  renderApp()
  expect(screen.getByRole('status')).toHaveTextContent('Loading reports')
  const table = await screen.findByRole('table', { name: 'Reports Table' })
  expect(within(table).getAllByRole('columnheader').map((header) => header.textContent))
    .toEqual(['Title', 'Category', 'Date', 'Summary'])
  const rows = within(table).getAllByRole('row').slice(1)
  expect(rows).toHaveLength(reports.length)
  reports.forEach((report, index) => {
    const row = within(rows[index])
    expect(row.getByRole('rowheader')).toHaveTextContent(report.title)
    expect(row.getByRole('cell', { name: report.category })).toBeInTheDocument()
    expect(row.getByRole('cell', { name: report.date })).toBeInTheDocument()
    expect(row.getByRole('cell', { name: report.summary })).toBeInTheDocument()
  })
  const reportLink = within(table).getByRole('link', { name: 'Monthly sales' })
  expect(screen.getAllByRole('link')).toHaveLength(reports.length)
  await user.click(reportLink)
  expect(await screen.findByRole('heading', { name: 'Monthly sales' })).toBeInTheDocument()
  expect(await screen.findByRole('table', { name: 'Execution results' })).toBeInTheDocument()
  expect(mock.history.get.map((request) => request.url))
    .toEqual(['/reports', '/reports', '/reports/1/results'])
})

it('shows execution results when opening a report URL directly', async () => {
  renderApp('/reports/2')
  expect(await screen.findByRole('heading', { name: 'Customer feedback' })).toBeInTheDocument()
  expect(await screen.findByRole('table', { name: 'Execution results' })).toBeInTheDocument()
  expect(mock.history.get.map((request) => request.url))
    .toContain('/reports/2/results')
})

it('shows execution results for an unknown report ID', async () => {
  renderApp('/reports/missing')
  expect(await screen.findByRole('heading', { name: 'Report Name' })).toBeInTheDocument()
  expect(await screen.findByRole('table', { name: 'Execution results' })).toBeInTheDocument()
  expect(mock.history.get.map((request) => request.url))
    .toContain('/reports/missing/results')
})

it('shows an error when fetching reports fails', async () => {
  mock.onGet('/reports').reply(500)
  renderApp()
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load reports')
})

it('shows an empty state when there are no reports', async () => {
  mock.onGet('/reports').reply(200, [])
  renderApp()
  expect(await screen.findByText('No reports available.')).toBeInTheDocument()
})

it('shows the not-found page for an unknown route', () => {
  renderApp('/unknown')
  expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back to reports' })).toHaveAttribute('href', '/')
})
