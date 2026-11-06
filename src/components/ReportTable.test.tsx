import { expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import ReportTable from './ReportTable'
import type { Report } from '../types/report'

const reports: Report[] = [
  {
    id: 'report-1',
    title: 'Quarterly sales',
    category: 'Sales',
    date: '2026-10-31',
    summary: 'Sales results for the quarter.',
    content: 'Full sales report.',
  },
]

it('renders report columns and rows', () => {
  render(
    <MemoryRouter>
      <ReportTable reports={reports} />
    </MemoryRouter>,
  )

  const table = within(screen.getByRole('table', { name: 'Reports Table' }))
  expect(table.getAllByRole('columnheader').map((cell) => cell.textContent))
    .toEqual(['Title', 'Category', 'Date', 'Summary'])
  expect(table.getByRole('rowheader', { name: reports[0].title })).toBeInTheDocument()
  expect(table.getByRole('link', { name: reports[0].title }))
    .toHaveAttribute('href', `/reports/${reports[0].id}`)
  expect(table.getByRole('cell', { name: reports[0].category })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Reports table' })).toHaveAttribute('tabindex', '0')
})

it('shows an empty message without a table', () => {
  render(<ReportTable reports={[]} />)
  expect(screen.getByText('No reports available.')).toBeInTheDocument()
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
})

const searchableReports: Report[] = [
  ...reports,
  { ...reports[0], id: 'report-2', title: 'Support overview' },
  { ...reports[0], id: 'report-3', title: 'Annual sales' },
]

it('filters report names only after Search is clicked, ignoring case and surrounding whitespace', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <ReportTable reports={searchableReports} />
    </MemoryRouter>,
  )

  await user.type(screen.getByRole('textbox', { name: 'Report name' }), '  SALES  ')
  expect(screen.getAllByRole('rowheader')).toHaveLength(3)

  await user.click(screen.getByRole('button', { name: 'Search' }))
  expect(screen.getAllByRole('rowheader').map((cell) => cell.textContent))
    .toEqual(['Quarterly sales', 'Annual sales'])
})

it('shows no matches and restores all reports when an empty search is submitted with Enter', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <ReportTable reports={searchableReports} />
    </MemoryRouter>,
  )
  const input = screen.getByRole('textbox', { name: 'Report name' })

  await user.type(input, 'no such report{Enter}')
  expect(screen.getByRole('status')).toHaveTextContent('No reports match your search.')
  expect(screen.queryByRole('table')).not.toBeInTheDocument()

  await user.clear(input)
  await user.type(input, '   {Enter}')
  expect(screen.getAllByRole('rowheader')).toHaveLength(3)
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

it('searches names rather than other report fields and filters updated reports', async () => {
  const user = userEvent.setup()
  const { rerender } = render(
    <MemoryRouter>
      <ReportTable reports={searchableReports} />
    </MemoryRouter>,
  )

  await user.type(screen.getByRole('textbox', { name: 'Report name' }), 'quarter{Enter}')
  expect(screen.getAllByRole('rowheader')).toHaveLength(1)

  rerender(
    <MemoryRouter>
      <ReportTable
        reports={[
          ...searchableReports,
          { ...reports[0], id: 'report-4', title: 'Quarterly support' },
        ]}
      />
    </MemoryRouter>,
  )
  expect(screen.getAllByRole('rowheader').map((cell) => cell.textContent))
    .toEqual(['Quarterly sales', 'Quarterly support'])
})
