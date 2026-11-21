import { expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DynamicResultsTable from "./DynamicResultsTable";

const columns = [
  { description: "Title", type: "string" as const },
  { description: "Price", type: "number" as const },
  { description: "In Stock", type: "boolean" as const },
];

it("renders dynamic columns and formatted row values", () => {
  render(
    <DynamicResultsTable
      columns={columns}
      rows={[
        { Title: "Atomic Habits", Price: 16.99, "In Stock": true },
        { Title: "The Hobbit", Price: 11.25, "In Stock": false },
      ]}
      start={0}
      pageSize={20}
      total={12}
      onPageChange={vi.fn()}
    />,
  );

  const table = within(screen.getByRole("table", { name: "Execution results" }));
  expect(table.getAllByRole("columnheader").map((header) => header.textContent))
    .toEqual(["Title", "Price", "In Stock"]);
  expect(table.getByRole("cell", { name: "16.99" })).toBeInTheDocument();
  expect(table.getByRole("cell", { name: "Yes" })).toBeInTheDocument();
  expect(table.getByRole("cell", { name: "No" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
});

it("requests the next and previous start points", async () => {
  const user = userEvent.setup();
  const onPageChange = vi.fn();

  const { rerender } = render(
    <DynamicResultsTable
      columns={columns}
      rows={[{ Title: "Atomic Habits", Price: 16.99, "In Stock": true }]}
      start={0}
      pageSize={20}
      total={25}
      onPageChange={onPageChange}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(onPageChange).toHaveBeenCalledWith(20);

  rerender(
    <DynamicResultsTable
      columns={columns}
      rows={[{ Title: "The Hobbit", Price: 11.25, "In Stock": true }]}
      start={20}
      pageSize={20}
      total={25}
      onPageChange={onPageChange}
    />,
  );

  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Previous" }));
  expect(onPageChange).toHaveBeenCalledWith(0);
});
