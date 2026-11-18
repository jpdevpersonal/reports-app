import CustomComponent, { type CustomComponentProps } from "./CustomComponent";

// The selected option is a string, so it uses CustomComponentProps<string>
// and adds the list of options to choose from.
interface CustomArrayProps extends CustomComponentProps<string> {
  options: string[];
  placeholder?: string;
}

// A dropdown list box.
export default function CustomArray({
  options,
  placeholder = "Select an option",
  ...props
}: CustomArrayProps) {
  return (
    <CustomComponent
      {...props}
      renderInput={({ id, value, onChange }) => (
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
    />
  );
}
