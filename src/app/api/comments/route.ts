import { NextRequest, NextResponse } from "next/server";
import { commentManager } from "@/lib/managers/CommentManager";
import { statsManager } from "@/lib/managers/StatsManager";

// GET /api/comments
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const blogId = searchParams.get("blogId");
    const pending = searchParams.get("pending") === "true";

    if (pending) {
      const comments = await commentManager.getPendingComments();
      return NextResponse.json({ success: true, data: comments });
    }

    if (blogId) {
      const comments = await commentManager.getCommentsByBlog(blogId);
      return NextResponse.json({ success: true, data: comments });
    }

    return NextResponse.json(
      { success: false, error: "Missing parameters" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/comments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { blogId, userId, userName, userPhoto, content, parentId } = body;

    const commentId = await commentManager.createComment({
      blogId,
      userId,
      userName,
      userPhoto,
      content,
      parentId,
      isApproved: false,
    });

    return NextResponse.json({ success: true, data: { id: commentId } });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
