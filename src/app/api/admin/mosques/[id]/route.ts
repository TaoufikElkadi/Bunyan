import { NextResponse } from "next/server";
import { getPlatformAdmin } from "@/lib/supabase/platform-admin";

const VALID_PLANS = ["free", "starter", "compleet"];
const VALID_STATUSES = ["pending", "active", "rejected"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getPlatformAdmin();
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { plan, status } = body;

    // Must provide at least one field to update
    if (!plan && !status) {
      return NextResponse.json(
        { error: "Provide plan or status" },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = {};

    if (plan) {
      if (!VALID_PLANS.includes(plan)) {
        return NextResponse.json(
          { error: `Invalid plan. Must be one of: ${VALID_PLANS.join(", ")}` },
          { status: 400 },
        );
      }
      updates.plan = plan;
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
          },
          { status: 400 },
        );
      }
      updates.status = status;
      if (status === "active") {
        updates.approved_at = new Date().toISOString();
        updates.approved_by = admin.user.id;
      }
    }

    const { data, error } = await admin.adminClient
      .from("mosques")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update mosque error:", error);
      return NextResponse.json(
        { error: "Failed to update mosque" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Update mosque error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getPlatformAdmin();
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { id } = await params;

    // Verify mosque exists
    const { data: mosque } = await admin.adminClient
      .from("mosques")
      .select("id, name")
      .eq("id", id)
      .single();

    if (!mosque) {
      return NextResponse.json({ error: "Mosque not found" }, { status: 404 });
    }

    // Delete in order (children first due to FK constraints)
    const tables = [
      "audit_log",
      "anbi_receipts",
      "qr_links",
      "donations",
      "recurrings",
      "campaigns",
      "donors",
      "funds",
      "users",
      "plan_usage",
    ];

    for (const table of tables) {
      await admin.adminClient.from(table).delete().eq("mosque_id", id);
    }

    const { error } = await admin.adminClient
      .from("mosques")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete mosque error:", error);
      return NextResponse.json(
        { error: "Failed to delete mosque" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete mosque error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
