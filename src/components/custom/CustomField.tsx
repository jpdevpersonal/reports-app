import type { ReportField } from "../../types/reportField";
import CustomArray from "./CustomArray";
import CustomText from "./CustomText";

interface CustomFieldProps {
  field: ReportField;
  // The value the user has entered, or undefined if they have not changed it yet.
  value: string | undefined;
  onChange: (fieldId: string, value: string) => void;
}

// Chooses which custom component to show, based on the field's dataType.
// To support a new data type, add a new `case` here.
export default function CustomField({ field, value, onChange }: CustomFieldProps) {
  const id = `field-${field.id}`;
  const handleChange = (newValue: string) => onChange(field.id, newValue);

  switch (field.dataType) {
    case "string":
      return (
        <CustomText
          id={id}
          label={field.label}
          value={value ?? field.value}
          onChange={handleChange}
        />
      );
    case "array":
      return (
        <CustomArray
          id={id}
          label={field.label}
          options={field.value}
          value={value ?? ""}
          onChange={handleChange}
        />
      );
    default:
      // The JSON contained a dataType we do not have a component for yet.
      return null;
  }
}
