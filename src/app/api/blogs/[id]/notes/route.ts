import { NextRequest, NextResponse } from "next/server";
import { blogManager } from "@/lib/managers/BlogManager";

// POST /api/blogs/[id]/notes
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { editorId, editorName, content, position } = body;

    await blogManager.addEditorNote(id, {
      editorId,
      editorName,
      content,
      position,
      resolved: false,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding editor note:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add note" },
      { status: 500 }
    );
  }
}

// PATCH /api/blogs/[id]/notes/[noteId]/resolve
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { noteId } = body;

    await blogManager.resolveEditorNote(id, noteId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resolving note:", error);
    return NextResponse.json(
      { success: false, error: "Failed to resolve note" },
      { status: 500 }
    );
  }
}
