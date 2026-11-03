import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MockAdapter from 'axios-mock-adapter'
import { apiClient } from '../api/client'
import type { Report } from '../types/report'
import ReportsListPage from './ReportsListPage'

const reports: Report[] = [
  {
    id: 'report-42',
    title: 'Quarterly sales',
    category: 'Sales',
    date: '2026-10-31',
    summary: 'Sales results for the quarter.',
    content: 'Full sales report.',
  },
  {
    id: 'report-99',
    title: 'Support overview',
    category: 'Support',
    date: '2026-11-01',
    summary: 'A summary of support requests.',
    content: 'Full support report.',
  },
]

let mock: MockAdapter

beforeEach(() => {
  mock = new MockAdapter(apiClient, {
    delayResponse: 10,
    onNoMatch: 'throwException',
  })
})

afterEach(() => {
  cleanup()
  mock.restore()
})

function renderPage() {
  return render(
    <MemoryRouter>
      <ReportsListPage />
    </MemoryRouter>,
  )
}

describe('ReportsListPage', () => {
  it('shows loading, fetches reports and displays their columns and detail links', async () => {
    mock.onGet('/reports').reply(200, reports)

    renderPage()

    expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Loading reports...')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    const table = within(await screen.findByRole('table', { name: 'Reports Table' }))

    expect(table.getAllByRole('columnheader').map((header) => header.textContent))
      .toEqual(['Title', 'Category', 'Date', 'Summary'])

    const rows = table.getAllByRole('row').slice(1)
    expect(rows).toHaveLength(reports.length)

    reports.forEach((report, index) => {
      const row = within(rows[index])
      expect(row.getByRole('rowheader')).toHaveTextContent(report.title)
      expect(row.getByRole('link', { name: report.title }))
        .toHaveAttribute('href', `/reports/${report.id}`)
      expect(row.getByRole('cell', { name: report.category })).toBeInTheDocument()
      expect(row.getByRole('cell', { name: report.date })).toBeInTheDocument()
      expect(row.getByRole('cell', { name: report.summary })).toBeInTheDocument()
    })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(mock.history.get).toHaveLength(1)
    expect(mock.history.get[0].url).toBe('/reports')
  })

  it('shows an empty state when the API returns no reports', async () => {
    mock.onGet('/reports').reply(200, [])

    renderPage()

    expect(await screen.findByText('No reports available.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows an error and stops loading when the request fails', async () => {
    mock.onGet('/reports').reply(500)

    renderPage()

    expect(await screen.findByRole('alert'))
      .toHaveTextContent('Unable to load reports. Please try again later.')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByText('No reports available.')).not.toBeInTheDocument()
  })
})
