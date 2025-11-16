import { NextRequest, NextResponse } from "next/server";
import { statsManager } from "@/lib/managers/StatsManager";

// POST /api/stats/[blogId]/share
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ blogId: string }> }
) {
  try {
    const { blogId } = await params;
    const body = await request.json();
    const { platform, userId, referrer } = body;

    await statsManager.recordShare(blogId, platform, userId, referrer);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording share:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record share" },
      { status: 500 }
    );
  }
}
