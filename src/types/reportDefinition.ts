export interface CustomField<TValue, TDataType extends string = string> {
  id: string
  label: string
  dataType: TDataType
  value: TValue
}

export interface FieldTypeMap {
  string: CustomField<string, 'string'>
  array: CustomField<string, 'array'> & { options: string[] }
}

export type FieldDataType = keyof FieldTypeMap
export type ReportField = FieldTypeMap[FieldDataType]

export interface ReportDefinition {
  id: string
  title: string
  fields: ReportField[]
}
