import { NextRequest, NextResponse } from "next/server";
import { statsManager } from "@/lib/managers/StatsManager";

// GET /api/stats/[blogId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ blogId: string }> }
) {
  try {
    const { blogId } = await params;
    const stats = await statsManager.getStats(blogId);

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

// POST /api/stats/[blogId]/view
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ blogId: string }> }
) {
  try {
    const { blogId } = await params;
    const body = await request.json();
    const { sessionId, userId, userAgent, referrer } = body;

    await statsManager.recordView(blogId, sessionId, userId, userAgent, referrer);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording view:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record view" },
      { status: 500 }
    );
  }
}
