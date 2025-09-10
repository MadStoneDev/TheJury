// app/api/demo-polls/random/route.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get a random active demo poll
    const { data, error } = await supabase.rpc("get_random_demo_poll");

    if (error) {
      console.error("Error fetching random demo poll:", error);
      return NextResponse.json(
        { error: "Failed to fetch demo poll" },
        { status: 500 },
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "No demo polls available" },
        { status: 404 },
      );
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Error in demo poll random route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
