import { NextRequest, NextResponse } from "next/server";
import { mediaManager } from "@/lib/managers/MediaManager";

// POST /api/media/upload
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await mediaManager.uploadImage(buffer, file.name);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error uploading media:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload media" },
      { status: 500 }
    );
  }
}

// POST /api/media/presigned-url
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, contentType, folder } = body;

    const result = await mediaManager.getPresignedUploadUrl(
      filename,
      contentType,
      folder
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
