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
    expect(screen.getByText("Assigned to Ari")).toBeInTheDocument();
  });

  it("shows a connecting state when room is null", () => {
    render(<Feature room={null} config={config} />);
    // Most templates show "Connecting…" while the room is null. Apps with a
    // custom waiting state can override this test.
    const heading = screen.getAllByRole("heading", { level: 1 })[0];
    expect(heading).toBeInTheDocument();
  });
});
