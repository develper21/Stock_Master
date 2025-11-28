import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
export { dynamic } from "@/lib/api-runtime";

export async function GET(req) {
  try {
    await requireApiSession();
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const sku = searchParams.get("sku");

    let query = supabase.from("products").select("id, name, sku, unit, reorder_level, product_categories(name)").order("created_at", { ascending: false });

    if (category) {
      query = query.eq("category_id", category);
    }

    if (sku) {
      query = query.ilike("sku", `%${sku}%`);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    const status = error?.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(req) {
  try {
    await requireApiSession();
    const supabase = getSupabaseServerClient();
    const body = await req.json();
    const { name, sku, category_id, unit, reorder_level = 0 } = body;

    if (!name || !sku || !unit) {
      return NextResponse.json({ error: "Name, SKU, and unit are required." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("products")
      .insert({ name, sku, category_id, unit, reorder_level })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const status = error?.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
