import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CustomComponent from "./CustomComponent";

it("renders the label and the input drawn by renderInput, linked by id", () => {
  render(
    <CustomComponent
      id="age"
      label="Age"
      value={42}
      onChange={() => {}}
      renderInput={({ id, value }) => <input id={id} type="number" defaultValue={value} />}
    />,
  );

  expect(screen.getByRole("spinbutton", { name: "Age" })).toHaveValue(42);
});

it("passes id, label, value and onChange through to renderInput", () => {
  const onChange = vi.fn();
  const renderInput = vi.fn(() => <span>input</span>);

  render(
    <CustomComponent
      id="ready"
      label="Ready"
      value={true}
      onChange={onChange}
      renderInput={renderInput}
    />,
  );

  expect(renderInput).toHaveBeenCalledWith({
    id: "ready",
    label: "Ready",
    value: true,
    onChange,
  });
  expect(screen.getByText("Ready")).toBeInTheDocument();
});
