import CustomComponent from './customComponent'
import type { FieldTypeMap } from '../types/reportDefinition'

export default class CustomArray extends CustomComponent<string, FieldTypeMap['array']> {
  renderControl() {
    const { field, onChange } = this.props
    return (
      <select
        id={field.id}
        name={field.id}
        value={field.value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select an option</option>
        {field.options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    )
  }
}
