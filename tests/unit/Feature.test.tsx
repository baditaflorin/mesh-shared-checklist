import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { createMockRoom } from "@baditaflorin/mesh-common/testing";
import { Feature } from "../../src/Feature";
import { config } from "../../src/config";

describe("Feature (component)", () => {
  it("adds a validated, assigned task", () => {
    const room = createMockRoom();
    render(<Feature room={room} config={config} />);
    fireEvent.change(screen.getByLabelText("What needs doing?"), {
      target: { value: "Bring snacks" },
    });
    fireEvent.change(screen.getByLabelText("Owner (optional)"), { target: { value: "Ari" } });
    fireEvent.click(screen.getByRole("button", { name: "Add to checklist" }));
    expect(screen.getByText("Bring snacks")).toBeInTheDocument();
    expect(screen.getByText("Owner · Ari")).toBeInTheDocument();
  });

  it("keeps the useful launch visible while the room connects", () => {
    render(<Feature room={null} config={config} />);
    expect(
      screen.getByRole("heading", { name: "A clear plan for the next thing." }),
    ).toBeInTheDocument();
    expect(screen.getByText("Preparing your shared space…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start with a baseline" })).toBeDisabled();
  });
});
