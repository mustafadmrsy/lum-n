import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  try {
    const p = await params;
    const parts = Array.isArray(p?.key) ? p.key : [];
    if (!parts.length) return NextResponse.json({ error: "key gerekli" }, { status: 400 });

    const key = parts.join("/");
    if (key.includes("..")) return NextResponse.json({ error: "geçersiz key" }, { status: 400 });

    const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
    const bucket = process.env.CLOUDFLARE_R2_BUCKET;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
      return NextResponse.json({ error: "R2 env eksik" }, { status: 500 });
    }

    const client = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });

    const obj = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    const body = obj.Body;
    if (!body) return NextResponse.json({ error: "dosya bulunamadı" }, { status: 404 });

    const headers = new Headers();
    if (obj.ContentType) headers.set("Content-Type", obj.ContentType);
    if (obj.ETag) headers.set("ETag", obj.ETag);
    headers.set("Cache-Control", "public, max-age=3600");

    return new NextResponse(body as any, { status: 200, headers });
  } catch (e: any) {
    const msg = e?.name === "NoSuchKey" ? "dosya bulunamadı" : e?.message;
    const status = e?.name === "NoSuchKey" ? 404 : 500;
    return NextResponse.json({ error: msg ?? "media hata" }, { status });
  }
}
