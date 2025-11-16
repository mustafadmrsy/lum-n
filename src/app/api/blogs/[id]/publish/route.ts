import { NextRequest, NextResponse } from "next/server";
import { blogManager } from "@/lib/managers/BlogManager";
import { BlogStatus } from "@/types/models";

// POST /api/blogs/[id]/publish
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { publishedBy } = await request.json();

    await blogManager.updateBlogStatus(id, BlogStatus.PUBLISHED, publishedBy);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error publishing blog:", error);
    return NextResponse.json(
      { success: false, error: "Failed to publish blog" },
      { status: 500 }
    );
  }
}
