import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReportField } from "../../types/reportField";
import CustomField from "./CustomField";

const textField: ReportField = {
  id: "author",
  label: "Author",
  dataType: "string",
  value: "Alex",
};

const arrayField: ReportField = {
  id: "region",
  label: "Region",
  dataType: "array",
  value: ["North", "South"],
};

it("renders a CustomText for a string field, starting with the JSON value", () => {
  render(<CustomField field={textField} value={undefined} onChange={() => {}} />);

  const input = screen.getByRole("textbox", { name: "Author" });
  expect(input).toHaveValue("Alex");
  expect(input).toHaveAttribute("id", "field-author");
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
});

it("renders a CustomArray for an array field, with nothing selected at first", () => {
  render(<CustomField field={arrayField} value={undefined} onChange={() => {}} />);

  expect(screen.getByRole("combobox", { name: "Region" })).toHaveValue("");
  expect(screen.getAllByRole("option").slice(1).map((option) => option.textContent))
    .toEqual(["North", "South"]);
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
});

it("shows the value entered by the user instead of the starting value", () => {
  render(<CustomField field={textField} value="Sam" onChange={() => {}} />);

  expect(screen.getByRole("textbox", { name: "Author" })).toHaveValue("Sam");
});

it("calls onChange with the field id and the new value", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<CustomField field={arrayField} value={undefined} onChange={onChange} />);

  await user.selectOptions(screen.getByRole("combobox", { name: "Region" }), "South");

  expect(onChange).toHaveBeenCalledWith("region", "South");
});

it("renders nothing for a data type it does not support", () => {
  const unknownField = {
    id: "count",
    label: "Count",
    dataType: "number",
    value: 3,
  } as unknown as ReportField;

  const { container } = render(
    <CustomField field={unknownField} value={undefined} onChange={() => {}} />,
  );

  expect(container).toBeEmptyDOMElement();
});
