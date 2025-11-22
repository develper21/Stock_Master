import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  requireApiSession: vi.fn(),
  assertInventoryManager: vi.fn(),
}));

vi.mock("@/lib/supabase/server-client", () => ({
  getSupabaseServerClient: vi.fn(),
}));

import { GET, POST } from "@/app/api/deliveries/route";
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

describe("/api/deliveries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns deliveries list", async () => {
    const mockQuery = createQueryChain({ data: [{ id: "del-1" }], error: null });
    const supabase = { from: vi.fn(() => mockQuery) };
    getSupabaseServerClient.mockReturnValue(supabase);
    requireApiSession.mockResolvedValue({});

    const res = await GET(new Request("https://example.com/api/deliveries"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([{ id: "del-1" }]);
    expect(supabase.from).toHaveBeenCalledWith("deliveries");
  });

  it("creates delivery with items", async () => {
    const deliveryResult = { data: { id: "del-1" }, error: null };
    const deliveryChain = createInsertChain(deliveryResult);
    const itemsChain = { insert: vi.fn().mockResolvedValue({ error: null }) };

    const supabase = {
      from: vi.fn((table) => {
        if (table === "deliveries") return deliveryChain;
        if (table === "delivery_items") return itemsChain;
        throw new Error(`Unexpected table ${table}`);
      }),
    };

    requireApiSession.mockResolvedValue({ supabase, profile: { id: "user-1", role: "inventory_manager" } });

    const payload = {
      reference_no: "DEL-001",
      customer: "Client A",
      warehouse_id: "wh-1",
      status: "draft",
      items: [{ product_id: "p1", quantity: 3, location_id: null }],
    };

    const res = await POST(
      new Request("https://example.com/api/deliveries", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.id).toBe("del-1");
    expect(itemsChain.insert).toHaveBeenCalledWith([
      { product_id: "p1", quantity: 3, location_id: null, delivery_id: "del-1" },
    ]);
  });
});
