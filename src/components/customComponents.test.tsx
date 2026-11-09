import { useState } from 'react'
import { expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CustomComponent from './customComponent'
import CustomText from './customText'
import CustomArray from './customArray'
import type { FieldTypeMap } from '../types/reportDefinition'

const textField: FieldTypeMap['string'] = {
  id: 'notes', label: 'Notes', dataType: 'string', value: 'Initial notes',
}
const arrayField: FieldTypeMap['array'] = {
  id: 'region', label: 'Region', dataType: 'array', options: ['North', 'South'], value: 'North',
}

it('provides a generic parent that also supports non-string values', () => {
  class CustomNumber extends CustomComponent<number> {
    renderControl() {
      return <input id={this.props.field.id} type="number" value={this.props.field.value} readOnly />
    }
  }

  render(
    <CustomNumber
      field={{ id: 'count', label: 'Count', dataType: 'number', value: 42 }}
      onChange={vi.fn<(value: number) => void>()}
    />,
  )
  expect(screen.getByRole('spinbutton', { name: 'Count' })).toHaveValue(42)
})

it('makes both controls inherit from customComponent', () => {
  expect(CustomText.prototype).toBeInstanceOf(CustomComponent)
  expect(CustomArray.prototype).toBeInstanceOf(CustomComponent)
})

it('renders an accessible, controlled text input and emits edited and cleared values', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn<(value: string) => void>()
  function TextExample() {
    const [value, setValue] = useState(textField.value)
    return (
      <CustomText
        field={{ ...textField, value }}
        onChange={(next) => { setValue(next); onChange(next) }}
      />
    )
  }
  render(<TextExample />)
  const input = screen.getByRole('textbox', { name: 'Notes' })
  expect(input).toHaveValue('Initial notes')
  expect(input).toHaveAttribute('name', 'notes')
  await user.clear(input)
  expect(onChange).toHaveBeenLastCalledWith('')
  await user.type(input, 'Updated')
  expect(input).toHaveValue('Updated')
  expect(onChange).toHaveBeenLastCalledWith('Updated')
})

it('renders array options in a single-selection dropdown and emits selections', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn<(value: string) => void>()
  function ArrayExample() {
    const [value, setValue] = useState(arrayField.value)
    return (
      <CustomArray
        field={{ ...arrayField, value }}
        onChange={(next) => { setValue(next); onChange(next) }}
      />
    )
  }
  render(<ArrayExample />)
  const select = screen.getByRole('combobox', { name: 'Region' })
  expect(select).toHaveValue('North')
  expect(select).not.toHaveAttribute('multiple')
  expect(within(select).getAllByRole('option').map((option) => option.textContent))
    .toEqual(['Select an option', 'North', 'South'])
  await user.selectOptions(select, 'South')
  expect(select).toHaveValue('South')
  expect(onChange).toHaveBeenLastCalledWith('South')
  await user.selectOptions(select, '')
  expect(select).toHaveValue('')
  expect(onChange).toHaveBeenLastCalledWith('')
})

it('handles an empty options array and reflects updated props', () => {
  const onChange = vi.fn()
  const { rerender } = render(
    <CustomArray field={{ ...arrayField, options: [], value: '' }} onChange={onChange} />,
  )
  expect(screen.getAllByRole('option')).toHaveLength(1)
  expect(screen.getByRole('combobox')).toHaveValue('')
  rerender(<CustomArray field={arrayField} onChange={onChange} />)
  expect(screen.getAllByRole('option')).toHaveLength(3)
  expect(screen.getByRole('combobox')).toHaveValue('North')
  expect(onChange).not.toHaveBeenCalled()
})
