import "./CustomComponent.scss";
import type { ReactNode } from "react";

// The props every custom component shares. T is the type of value it edits,
// for example string for a text box.
export interface CustomComponentProps<T> {
  id: string;
  label: string;
  value: T;
  onChange: (value: T) => void;
}

interface CustomComponentWrapperProps<T> extends CustomComponentProps<T> {
  // Draws the actual input (text box, dropdown, ...) for the child component.
  renderInput: (props: CustomComponentProps<T>) => ReactNode;
}

// The parent of all custom components. It draws the parts they have in common
// (the wrapper and label) and asks the child to draw its own input.
export default function CustomComponent<T>({
  renderInput,
  ...inputProps
}: CustomComponentWrapperProps<T>) {
  return (
    <div className="custom-component">
      <label htmlFor={inputProps.id}>{inputProps.label}</label>
      {renderInput(inputProps)}
    </div>
  );
}
