import { NextRequest, NextResponse } from "next/server";
import { commentManager } from "@/lib/managers/CommentManager";
import { statsManager } from "@/lib/managers/StatsManager";

// PATCH /api/comments/[id]/approve
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { blogId } = body;

    await commentManager.approveComment(id);
    await statsManager.incrementComments(blogId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error approving comment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to approve comment" },
      { status: 500 }
    );
  }
}
