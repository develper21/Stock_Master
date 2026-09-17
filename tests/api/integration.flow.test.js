import { describe, it, expect } from "vitest";
import { simulateInventoryFlow } from "@/tests/utils/ledger";

describe("End-to-end inventory flow", () => {
  it("handles receipt → transfer → delivery → adjustment", () => {
    const history = simulateInventoryFlow([
      { type: "receipt", quantity: 20 },
      { type: "transfer_out", quantity: 5 },
      { type: "transfer_in", quantity: 3 },
      { type: "delivery", quantity: 10 },
      { type: "adjustment", newQuantity: 8 },
    ]);

    expect(history).toEqual([20, 15, 18, 8, 8]);
  });
});
