import { expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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
