import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  requireApiSession: vi.fn(),
  assertInventoryManager: vi.fn(),
}));

vi.mock("@/lib/supabase/server-client", () => ({
  getSupabaseServerClient: vi.fn(),
}));

import { GET, POST } from "@/app/api/transfers/route";
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

describe("/api/transfers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns transfers", async () => {
    const mockQuery = createQueryChain({ data: [{ id: "trf-1" }], error: null });
    const supabase = { from: vi.fn(() => mockQuery) };
    getSupabaseServerClient.mockReturnValue(supabase);
    requireApiSession.mockResolvedValue({});

    const res = await GET(new Request("https://example.com/api/transfers"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([{ id: "trf-1" }]);
  });

  it("creates transfer with items", async () => {
    const transferPayload = { data: { id: "trf-1" }, error: null };
    const transferChain = createInsertChain(transferPayload);
    const itemsChain = { insert: vi.fn().mockResolvedValue({ error: null }) };

    const supabase = {
      from: vi.fn((table) => {
        if (table === "internal_transfers") return transferChain;
        if (table === "transfer_items") return itemsChain;
        throw new Error(`Unexpected table ${table}`);
      }),
    };

    requireApiSession.mockResolvedValue({ supabase, profile: { id: "user-1", role: "inventory_manager" } });

    const requestBody = {
      reference_no: "TRF-001",
      from_warehouse_id: "wh-1",
      to_warehouse_id: "wh-2",
      status: "draft",
      items: [{ product_id: "p1", quantity: 2 }],
    };

    const res = await POST(
      new Request("https://example.com/api/transfers", {
        method: "POST",
        body: JSON.stringify(requestBody),
      })
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.id).toBe("trf-1");
    expect(itemsChain.insert).toHaveBeenCalledWith([
      { product_id: "p1", quantity: 2, transfer_id: "trf-1" },
    ]);
  });
});
