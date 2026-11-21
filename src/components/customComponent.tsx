import { Component } from 'react'
import type { ReactNode } from 'react'
import type { CustomField } from '../types/reportDefinition'
import './customComponent.scss'

export interface CustomComponentProps<TField extends CustomField<unknown>> {
  field: TField
  onChange: (value: TField['value']) => void
}

export default abstract class CustomComponent<
  TValue,
  TField extends CustomField<TValue> = CustomField<TValue>,
> extends Component<CustomComponentProps<TField>> {
  abstract renderControl(): ReactNode

  render() {
    return (
      <div className="custom-component">
        <label htmlFor={this.props.field.id}>{this.props.field.label}</label>
        {this.renderControl()}
      </div>
    )
  }
}
