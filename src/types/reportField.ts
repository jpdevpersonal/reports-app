// Every field from the JSON has these properties. TDataType is the text used in
// the "dataType" property and TValue is the type of the "value" property.
interface BaseReportField<TDataType extends string, TValue> {
  id: string
  label: string
  dataType: TDataType
  value: TValue
}

// "string" fields are shown with CustomText. The value is the starting text.
export type TextReportField = BaseReportField<'string', string>

// "array" fields are shown with CustomArray. The value is the list of options.
export type ArrayReportField = BaseReportField<'array', string[]>

// To support a new data type, add its field type to this list.
export type ReportField = TextReportField | ArrayReportField
