import { useState } from "react";
import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CustomText from "./CustomText";

it("renders a labelled text box with the given value", () => {
  render(<CustomText id="author" label="Author" value="Alex" onChange={() => {}} />);

  const input = screen.getByRole("textbox", { name: "Author" });
  expect(input).toHaveAttribute("id", "author");
  expect(input).toHaveValue("Alex");
});

it("calls onChange with the new text", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<CustomText id="author" label="Author" value="" onChange={onChange} />);

  await user.type(screen.getByRole("textbox", { name: "Author" }), "A");

  expect(onChange).toHaveBeenCalledWith("A");
});

it("shows what the user types when the parent stores the value", async () => {
  function Parent() {
    const [value, setValue] = useState("");
    return <CustomText id="notes" label="Notes" value={value} onChange={setValue} />;
  }
  const user = userEvent.setup();
  render(<Parent />);

  await user.type(screen.getByRole("textbox", { name: "Notes" }), "Hello");

  expect(screen.getByRole("textbox", { name: "Notes" })).toHaveValue("Hello");
});
