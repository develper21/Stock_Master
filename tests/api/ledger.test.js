import { describe, it, expect } from "vitest";

import { validateLedgerAggregation } from "@/tests/utils/ledger";

describe("Ledger aggregation", () => {
  it("computes balance updates correctly", () => {
    const result = validateLedgerAggregation([
      { quantity_change: 10 },
      { quantity_change: -3 },
      { quantity_change: 5 },
    ]);

    expect(result).toEqual([10, 7, 12]);
  });
});
