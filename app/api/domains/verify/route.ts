import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getIPFromRequest } from "@/lib/rateLimit";
import dns from "dns";
import { promisify } from "util";

const resolveTxt = promisify(dns.resolveTxt);

export async function POST(request: Request) {
  try {
    const ip = getIPFromRequest(request);
    const { success: allowed } = rateLimit(`domain-verify:${ip}`, {
      maxTokens: 5,
      interval: 60,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { domainId } = body;

    if (!domainId || typeof domainId !== "string") {
      return NextResponse.json(
        { error: "domainId is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Verify the user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the domain record (RLS ensures it belongs to the user)
    const { data: domain, error: domainError } = await supabase
      .from("custom_domains")
      .select("id, domain, verification_token, verified")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .single();

    if (domainError || !domain) {
      return NextResponse.json(
        { error: "Domain not found" },
        { status: 404 },
      );
    }

    if (domain.verified) {
      return NextResponse.json({
        verified: true,
        message: "Domain is already verified",
      });
    }

    // Check DNS TXT record
    const txtHost = `_thejury-verify.${domain.domain}`;

    try {
      const records = await resolveTxt(txtHost);
      // records is an array of arrays of strings — flatten
      const flatRecords = records.flat();

      const tokenFound = flatRecords.some(
        (record) => record.trim() === domain.verification_token,
      );

      if (!tokenFound) {
        return NextResponse.json(
          {
            verified: false,
            message: `TXT record not found. Add a TXT record for ${txtHost} with value: ${domain.verification_token}`,
          },
          { status: 200 },
        );
      }

      // Mark as verified
      const { error: updateError } = await supabase
        .from("custom_domains")
        .update({
          verified: true,
          verified_at: new Date().toISOString(),
        })
        .eq("id", domainId);

      if (updateError) {
        console.error("[domains/verify] Error updating domain:", updateError);
        return NextResponse.json(
          { error: "Failed to update domain status" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        verified: true,
        message: "Domain verified successfully",
      });
    } catch {
      // DNS resolution failed — record doesn't exist yet
      return NextResponse.json(
        {
          verified: false,
          message: `Could not resolve DNS for ${txtHost}. Please add the TXT record and try again.`,
        },
        { status: 200 },
      );
    }
  } catch (err) {
    console.error("[domains/verify] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
