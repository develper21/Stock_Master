import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  requireApiSession: vi.fn(),
  assertInventoryManager: vi.fn(),
}));

vi.mock("@/lib/supabase/server-client", () => ({
  getSupabaseServerClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({}));

import { GET, POST } from "@/app/api/adjustments/route";
import { requireApiSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";

const createQueryChain = (payload) => ({
  select: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  then(resolve) {
    return Promise.resolve(payload).then(resolve);
  },
});

const createInsertChain = (payload) => ({
  insert: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue(payload),
});

describe("/api/adjustments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns adjustments", async () => {
    const mockQuery = createQueryChain({ data: [{ id: "adj-1" }], error: null });
    const supabase = { from: vi.fn(() => mockQuery) };
    getSupabaseServerClient.mockReturnValue(supabase);
    requireApiSession.mockResolvedValue({});

    const res = await GET(new Request("https://example.com/api/adjustments"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([{ id: "adj-1" }]);
  });

  it("creates adjustment and calls RPC", async () => {
    const adjustmentPayload = { data: { id: "adj-1" }, error: null };
    const adjustmentChain = createInsertChain(adjustmentPayload);

    const supabase = {
      from: vi.fn((table) => {
        if (table === "adjustments") return adjustmentChain;
        throw new Error(`Unexpected table ${table}`);
      }),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    requireApiSession.mockResolvedValue({ supabase, profile: { id: "manager-1", role: "inventory_manager" } });

    const payload = {
      product_id: "p1",
      warehouse_id: "wh-1",
      location_id: null,
      counted_quantity: 15,
      system_quantity: 10,
      difference: 5,
      reason: "Cycle count",
    };

    const res = await POST(
      new Request("https://example.com/api/adjustments", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.id).toBe("adj-1");
    expect(supabase.rpc).toHaveBeenCalledWith("commit_adjustment", { adjustment_id: "adj-1" });
  });
});
