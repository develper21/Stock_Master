import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  requireApiSession: vi.fn(),
  assertInventoryManager: vi.fn(),
}));

vi.mock("@/lib/supabase/server-client", () => ({
  getSupabaseServerClient: vi.fn(),
}));

import { GET, POST } from "@/app/api/receipts/route";
import { requireApiSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";

const createAwaitable = (payload) => ({
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

describe("/api/receipts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns list of receipts", async () => {
    const mockQuery = createAwaitable({ data: [{ id: "r1" }], error: null });
    const supabase = { from: vi.fn(() => mockQuery) };
    requireApiSession.mockResolvedValue({});
    getSupabaseServerClient.mockReturnValue(supabase);

    const res = await GET(new Request("https://example.com/api/receipts"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(supabase.from).toHaveBeenCalledWith("receipts");
  });

  it("creates receipt with items", async () => {
    const receiptResult = { data: { id: "rec-1" }, error: null };
    const receiptQuery = createInsertChain(receiptResult);
    const itemsQuery = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };

    const supabase = {
      from: vi.fn((table) => {
        if (table === "receipts") return receiptQuery;
        if (table === "receipt_items") return itemsQuery;
        throw new Error(`Unexpected table ${table}`);
      }),
    };

    requireApiSession.mockResolvedValue({ supabase, profile: { id: "user-1", role: "inventory_manager" } });

    const payload = {
      reference_no: "REC-123",
      supplier_name: "Supplier",
      warehouse_id: "wh-1",
      status: "draft",
      items: [{ product_id: "p1", quantity: 5 }],
    };

    const res = await POST(
      new Request("https://example.com/api/receipts", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.id).toBe("rec-1");
    expect(itemsQuery.insert).toHaveBeenCalledWith([
      { product_id: "p1", quantity: 5, receipt_id: "rec-1" },
    ]);
  });
});
