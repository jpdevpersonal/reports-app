import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import ReportPage from './ReportPage'

const { source } = vi.hoisted(() => ({ source: { value: undefined as unknown } }))
vi.mock('../data/reportDefinitions.json', () => ({
  get default() { return source.value },
}))

beforeEach(async () => {
  const actual = await vi.importActual<{ default: unknown }>('../data/reportDefinitions.json')
  source.value = structuredClone(actual.default)
})

function renderPage(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/reports/${id}`]}>
      <Link to="/reports/1">Sales report</Link>
      <Link to="/reports/2">Feedback report</Link>
      <Routes>
        <Route path="/reports/:id" element={<ReportPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

it('reads the report JSON and renders both field types for the URL report ID', () => {
  renderPage()
  expect(screen.getByRole('heading', { name: 'Monthly sales' })).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Sales notes' })).toHaveValue('')
  expect(screen.getByRole('combobox', { name: 'Sales region' })).toHaveValue('All regions')
  expect(screen.getByRole('link', { name: 'Back to reports' })).toHaveAttribute('href', '/')
})

it('supports a string-only report', () => {
  renderPage('2')
  expect(screen.getByRole('heading', { name: 'Customer feedback' })).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Feedback notes' })).toHaveValue('Customer highlights')
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
})

it('supports an array-only report', () => {
  renderPage('3')
  expect(screen.getByRole('combobox', { name: 'Traffic source' })).toHaveValue('')
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
})

it('preserves independent edits and does not mutate the source JSON', async () => {
  const original = structuredClone(source.value)
  const user = userEvent.setup()
  renderPage()
  await user.type(screen.getByRole('textbox', { name: 'Sales notes' }), 'Updated notes')
  await user.selectOptions(screen.getByRole('combobox', { name: 'Sales region' }), 'South')
  expect(screen.getByRole('textbox')).toHaveValue('Updated notes')
  expect(screen.getByRole('combobox')).toHaveValue('South')
  await user.clear(screen.getByRole('textbox'))
  expect(screen.getByRole('textbox')).toHaveValue('')
  expect(screen.getByRole('combobox')).toHaveValue('South')
  expect(source.value).toEqual(original)
})

it('renders newly configured fields without page changes, including repeated types', async () => {
  source.value = [{
    id: '1',
    title: 'Dynamic report',
    fields: [
      { id: 'toString', label: 'First text', dataType: 'string', value: 'First' },
      { id: 'second', label: 'Second text', dataType: 'string', value: 'Second' },
      { id: 'third', label: 'First array', dataType: 'array', options: ['A', 'B'], value: 'A' },
      { id: 'fourth', label: 'Second array', dataType: 'array', options: ['C', 'D'], value: 'C' },
    ],
  }]
  const user = userEvent.setup()
  renderPage()
  expect(screen.getAllByRole('textbox')).toHaveLength(2)
  expect(screen.getAllByRole('combobox')).toHaveLength(2)
  expect(screen.getByRole('textbox', { name: 'First text' })).toHaveValue('First')
  await user.type(screen.getByRole('textbox', { name: 'First text' }), ' edited')
  await user.selectOptions(screen.getByRole('combobox', { name: 'First array' }), 'B')
  expect(screen.getByRole('textbox', { name: 'First text' })).toHaveValue('First edited')
  expect(screen.getByRole('textbox', { name: 'Second text' })).toHaveValue('Second')
  expect(screen.getByRole('combobox', { name: 'First array' })).toHaveValue('B')
  expect(screen.getByRole('combobox', { name: 'Second array' })).toHaveValue('C')
})

it('resets edits when navigating between report IDs', async () => {
  const user = userEvent.setup()
  renderPage()
  await user.type(screen.getByRole('textbox'), 'Draft')
  await user.click(screen.getByRole('link', { name: 'Feedback report' }))
  expect(screen.getByRole('textbox')).toHaveValue('Customer highlights')
  await user.click(screen.getByRole('link', { name: 'Sales report' }))
  expect(screen.getByRole('textbox')).toHaveValue('')
  expect(screen.getByRole('combobox')).toHaveValue('All regions')
})

it('shows a not-found state for an unknown report ID', () => {
  renderPage('missing')
  expect(screen.getByRole('heading', { name: 'Report not found' })).toBeInTheDocument()
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
})

it('shows an explicit empty-fields state', () => {
  source.value = [{ id: '1', title: 'Empty report', fields: [] }]
  renderPage()
  expect(screen.getByText('No fields configured for this report.')).toBeInTheDocument()
})

it.each([
  { fields: [{ id: 'unsupported', label: 'Unsupported', dataType: 'number', value: 1 }] },
  { fields: [{ id: 'invalid', label: 'Invalid', dataType: 'array', value: '', options: 'not an array' }] },
])('shows an error instead of silently omitting invalid fields: %j', ({ fields }) => {
  source.value = [{ id: '1', title: 'Invalid report', fields }]
  renderPage()
  expect(screen.getByRole('alert')).toHaveTextContent('Invalid or unsupported field definition')
  expect(screen.getByRole('heading', { name: 'Unable to load report' })).toBeInTheDocument()
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
})
