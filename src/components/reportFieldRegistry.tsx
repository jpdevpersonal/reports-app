import type { ComponentType, ReactNode } from 'react'
import CustomText from './customText'
import CustomArray from './customArray'
import type { CustomComponentProps } from './customComponent'
import type { FieldDataType, FieldTypeMap, ReportField } from '../types/reportDefinition'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasBaseFields(value: unknown): value is Record<string, unknown> {
  return isRecord(value)
    && typeof value.id === 'string' && value.id.trim() !== ''
    && typeof value.label === 'string' && value.label.trim() !== ''
}

function registerField<TField extends ReportField>(
  isField: (value: unknown) => value is TField,
  Control: ComponentType<CustomComponentProps<TField>>,
) {
  return {
    isField,
    render(field: ReportField, onChange: (value: TField['value']) => void) {
      if (!isField(field)) {
        throw new Error(`Invalid field definition: ${field.id}`)
      }
      return <Control field={field} onChange={onChange} />
    },
  }
}

export const reportFieldRegistry = {
  string: registerField(
    (value): value is FieldTypeMap['string'] =>
      hasBaseFields(value) && value.dataType === 'string' && typeof value.value === 'string',
    CustomText,
  ),
  array: registerField(
    (value): value is FieldTypeMap['array'] =>
      hasBaseFields(value)
      && value.dataType === 'array'
      && typeof value.value === 'string'
      && Array.isArray(value.options)
      && value.options.every((option) => typeof option === 'string' && option !== '')
      && new Set(value.options).size === value.options.length
      && (value.value === '' || value.options.includes(value.value)),
    CustomArray,
  ),
} satisfies {
  [K in FieldDataType]: {
    isField: (value: unknown) => value is FieldTypeMap[K]
    render: (field: ReportField, onChange: (value: FieldTypeMap[K]['value']) => void) => ReactNode
  }
}

export function isReportField(value: unknown): value is ReportField {
  return Object.values(reportFieldRegistry).some((entry) => entry.isField(value))
}

export { isRecord }
