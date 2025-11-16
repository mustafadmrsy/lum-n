import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getUserFromRequest } from "@/lib/auth";

// Debug R2 configuration
console.log("R2 Config:", {
  endpoint: process.env.R2_ENDPOINT,
  bucket: process.env.R2_BUCKET_NAME,
  hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
});

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Giriş gerekli" },
        { status: 401 }
      );
    }

    console.log("Upload attempt - User:", user.id, "Role:", user.role, "Type:", typeof user.role);

    // Check if user has permission to upload (WRITER or higher)
    const allowedRoles = ["writer", "editor", "admin"];
    if (!allowedRoles.includes(user.role)) {
      console.log("Upload permission denied. User role:", user.role, "Allowed roles:", allowedRoles);
      return NextResponse.json(
        { success: false, error: `Yetkiniz yok. Yazar yetkisi gerekli. Mevcut rol: ${user.role}` },
        { status: 403 }
      );
    }    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "images";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Dosya bulunamadı" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz dosya tipi. Sadece resim dosyaları yüklenebilir." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "Dosya boyutu çok büyük. Maksimum 5MB." },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileName = `${folder}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });

    await r2Client.send(command);

    // Return the R2 URL (private, will be served through our API)
    const url = `/api/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      url,
      fileName,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "Yükleme başarısız" },
      { status: 500 }
    );
  }
}
