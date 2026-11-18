import CustomComponent, { type CustomComponentProps } from "./CustomComponent";

// A text box. It edits a string, so it uses CustomComponentProps<string>.
export default function CustomText(props: CustomComponentProps<string>) {
  return (
    <CustomComponent
      {...props}
      renderInput={({ id, value, onChange }) => (
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    />
  );
}
