import CustomComponent from './customComponent'
import type { FieldTypeMap } from '../types/reportDefinition'

export default class CustomText extends CustomComponent<string, FieldTypeMap['string']> {
  renderControl() {
    const { field, onChange } = this.props
    return (
      <input
        id={field.id}
        name={field.id}
        type="text"
        value={field.value}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  }
}
