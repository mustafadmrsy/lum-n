import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

export async function POST(req: Request) {
  try {
    const {
      fileName,
      contentType,
      size,
      userEmail,
    }: { fileName?: string; contentType?: string; size?: number; userEmail?: string } = await req.json();

    if (!contentType || typeof contentType !== "string") {
      return NextResponse.json({ error: "contentType gerekli" }, { status: 400 });
    }

    if (!contentType.toLowerCase().startsWith("image/")) {
      return NextResponse.json({ error: "Sadece image/* kabul" }, { status: 400 });
    }

    const maxMbRaw = process.env.CLOUDFLARE_R2_MAX_UPLOAD_MB;
    const maxMb = maxMbRaw ? Number(maxMbRaw) : 20;
    const maxBytes = (Number.isFinite(maxMb) && maxMb > 0 ? maxMb : 20) * 1024 * 1024;
    if (typeof size === "number" && size > maxBytes) {
      return NextResponse.json({ error: `Maksimum ${Math.round(maxBytes / 1024 / 1024)}MB` }, { status: 400 });
    }

    const allowRaw = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
    const allowList = allowRaw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (allowList.length) {
      const e = (userEmail || "").trim().toLowerCase();
      if (!e || !allowList.includes(e)) {
        return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
      }
    }

    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
    const bucket = process.env.CLOUDFLARE_R2_BUCKET;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL;

    if (!accountId || !endpoint || !bucket || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
      return NextResponse.json({ error: "R2 env eksik" }, { status: 500 });
    }

    const safeName = typeof fileName === "string" ? fileName.trim() : "";
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

    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(client, cmd, { expiresIn: 60 * 5 });
    const baseLower = publicBaseUrl.toLowerCase();
    const publicUrl = baseLower.includes(".r2.dev") ? joinPath("/api/media", key) : joinUrl(publicBaseUrl, key);

    return NextResponse.json({ uploadUrl, publicUrl, key });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "presign hata" }, { status: 500 });
  }
}
