import { NextRequest, NextResponse } from "next/server";
import { statsManager } from "@/lib/managers/StatsManager";

// POST /api/stats/[blogId]/like
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ blogId: string }> }
) {
  try {
    const { blogId } = await params;
    const body = await request.json();
    const { userId } = body;

    const likeId = await statsManager.recordLike(blogId, userId);

    return NextResponse.json({ success: true, data: { id: likeId } });
  } catch (error) {
    console.error("Error recording like:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record like" },
      { status: 500 }
    );
  }
}

// DELETE /api/stats/[blogId]/like
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ blogId: string }> }
) {
  try {
    const { blogId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const likeId = searchParams.get("likeId");

    if (!likeId) {
      return NextResponse.json(
        { success: false, error: "Missing likeId" },
        { status: 400 }
      );
    }

    await statsManager.removeLike(likeId, blogId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing like:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove like" },
      { status: 500 }
    );
  }
}
