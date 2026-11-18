import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CustomArray from "./CustomArray";

const options = ["North", "South", "East"];

it("renders a labelled dropdown with a placeholder and every option", () => {
  render(
    <CustomArray id="region" label="Region" options={options} value="" onChange={() => {}} />,
  );

  const select = screen.getByRole("combobox", { name: "Region" });
  expect(select).toHaveValue("");
  expect(screen.getAllByRole("option").map((option) => option.textContent))
    .toEqual(["Select an option", ...options]);
  expect(screen.getByRole("option", { name: "Select an option" })).toBeDisabled();
});

it("supports a custom placeholder", () => {
  render(
    <CustomArray
      id="region"
      label="Region"
      options={options}
      value=""
      placeholder="Pick a region"
      onChange={() => {}}
    />,
  );

  expect(screen.getByRole("option", { name: "Pick a region" })).toBeInTheDocument();
});

it("shows the selected value", () => {
  render(
    <CustomArray id="region" label="Region" options={options} value="South" onChange={() => {}} />,
  );

  expect(screen.getByRole("combobox", { name: "Region" })).toHaveValue("South");
});

it("calls onChange with the chosen option", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(
    <CustomArray id="region" label="Region" options={options} value="" onChange={onChange} />,
  );

  await user.selectOptions(screen.getByRole("combobox", { name: "Region" }), "East");

  expect(onChange).toHaveBeenCalledWith("East");
});
