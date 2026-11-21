import { expect, it } from 'vitest'
import definitions from './reportDefinitions.json'
import { parseReportDefinitions } from './parseReportDefinitions'

const text = { id: 'notes', label: 'Notes', dataType: 'string', value: '' }
const array = { id: 'region', label: 'Region', dataType: 'array', options: ['North'], value: '' }
const report = { id: '1', title: 'Test report', fields: [text, array] }

it('validates the actual mock JSON, including both field types', () => {
  expect(parseReportDefinitions(definitions)).toEqual(definitions)
})

it('allows empty reports, empty fields and empty dropdown options', () => {
  expect(parseReportDefinitions([])).toEqual([])
  expect(parseReportDefinitions([{ ...report, fields: [] }])[0].fields).toEqual([])
  expect(parseReportDefinitions([{ ...report, fields: [{ ...array, options: [] }] }])[0].fields)
    .toEqual([{ ...array, options: [] }])
})

it.each([
  null,
  {},
  [null],
  [{ ...report, id: '' }],
  [{ ...report, title: ' ' }],
  [{ ...report, fields: null }],
  [report, report],
])('rejects malformed or duplicate report definitions: %j', (value) => {
  expect(() => parseReportDefinitions(value)).toThrow()
})

it.each([
  null,
  { ...text, dataType: 'number' },
  { ...text, dataType: 'toString' },
  { ...text, id: '' },
  { ...text, label: '' },
  { ...text, value: 1 },
  { ...array, options: 'North' },
  { ...array, options: [1] },
  { ...array, options: [''] },
  { ...array, options: ['North', 'North'] },
  { ...array, value: 'Missing option' },
])('rejects invalid or unsupported fields: %j', (field) => {
  expect(() => parseReportDefinitions([{ ...report, fields: [field] }]))
    .toThrow('Invalid or unsupported field definition in report 1.')
})

it('rejects duplicate field IDs within a report but allows reuse across reports', () => {
  expect(() => parseReportDefinitions([{ ...report, fields: [text, text] }]))
    .toThrow('Duplicate field ID')
  expect(parseReportDefinitions([report, { ...report, id: '2' }])).toHaveLength(2)
})
