import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/g, "");
  const p = path.replace(/^\/+/, "");
  return `${b}/${p}`;
}

function joinPath(base: string, path: string) {
  const b = base.replace(/\/+$/g, "");
  const p = path.replace(/^\/+/, "");
  return `${b}/${p}`;
}

function getExtFromContentType(contentType: string) {
  const ct = contentType.toLowerCase();
  if (ct === "image/jpeg") return "jpg";
  if (ct === "image/png") return "png";
  if (ct === "image/webp") return "webp";
  if (ct === "image/gif") return "gif";
  if (ct === "image/avif") return "avif";
  return "bin";
}

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const allowRaw = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
    const allowList = allowRaw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const form = await req.formData();
    const file = form.get("file");
    const userEmail = String(form.get("userEmail") || "");

    if (allowList.length) {
      const e = userEmail.trim().toLowerCase();
      if (!e || !allowList.includes(e)) {
        return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
      }
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file gerekli" }, { status: 400 });
    }

    const contentType = file.type || "application/octet-stream";
    if (!contentType.toLowerCase().startsWith("image/")) {
      return NextResponse.json({ error: "Sadece image/* kabul" }, { status: 400 });
    }

    const maxMbRaw = process.env.CLOUDFLARE_R2_MAX_UPLOAD_MB;
    const maxMbEnv = maxMbRaw ? Number(maxMbRaw) : 20;
    const maxMb = Number.isFinite(maxMbEnv) && maxMbEnv > 0 ? maxMbEnv : 20;
    const maxBytes = maxMb * 1024 * 1024;

    const size = file.size;
    if (typeof size === "number" && size > maxBytes) {
      return NextResponse.json({ error: `Maksimum ${Math.round(maxBytes / 1024 / 1024)}MB` }, { status: 400 });
    }

    const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
    const bucket = process.env.CLOUDFLARE_R2_BUCKET;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL;

    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
      return NextResponse.json({ error: "R2 env eksik" }, { status: 500 });
    }

    const safeName = file.name ? file.name.trim() : "";
    const ext = getExtFromContentType(contentType);
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    const key = `covers/${Date.now()}-${id}${safeName ? "-" + safeName.replace(/[^a-zA-Z0-9._-]/g, "") : ""}.${ext}`;

    const client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const body = new Uint8Array(await file.arrayBuffer());

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        Body: body,
      })
    );

    const baseLower = publicBaseUrl.toLowerCase();
    const publicUrl = baseLower.includes(".r2.dev") ? joinPath("/api/media", key) : joinUrl(publicBaseUrl, key);

    return NextResponse.json({ publicUrl, key });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "upload hata" }, { status: 500 });
  }
}
