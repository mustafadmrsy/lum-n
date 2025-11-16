import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";

export class MediaManager {
  private s3Client: S3Client;
  private bucketName: string;
  private cdnUrl: string;

  constructor() {
    this.bucketName = process.env.NEXT_PUBLIC_R2_BUCKET_NAME || "";
    this.cdnUrl = process.env.NEXT_PUBLIC_R2_CDN_URL || "";

    this.s3Client = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
      },
    });
  }

  // Generate unique filename
  private generateFilename(originalName: string): string {
    const ext = originalName.split(".").pop();
    const timestamp = Date.now();
    const random = nanoid(8);
    return `${timestamp}-${random}.${ext}`;
  }

  // Upload file to R2
  async uploadFile(
    file: Buffer | Uint8Array,
    originalName: string,
    contentType: string,
    folder = "uploads"
  ): Promise<{ url: string; cdnUrl: string; key: string }> {
    const filename = this.generateFilename(originalName);
    const key = `${folder}/${filename}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    });

    await this.s3Client.send(command);

    const url = `${this.cdnUrl}/${key}`;
    const cdnUrl = `${this.cdnUrl}/${key}`;

    return { url, cdnUrl, key };
  }

  // Upload image
  async uploadImage(
    file: Buffer | Uint8Array,
    originalName: string
  ): Promise<{ url: string; cdnUrl: string; key: string }> {
    const contentType = this.getImageContentType(originalName);
    return this.uploadFile(file, originalName, contentType, "images");
  }

  // Get image content type
  private getImageContentType(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
    };
    return contentTypes[ext || ""] || "image/jpeg";
  }

  // Delete file from R2
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  // Get presigned URL for direct upload
  async getPresignedUploadUrl(
    filename: string,
    contentType: string,
    folder = "uploads"
  ): Promise<{ uploadUrl: string; key: string; cdnUrl: string }> {
    const generatedFilename = this.generateFilename(filename);
    const key = `${folder}/${generatedFilename}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
    });

    const cdnUrl = `${this.cdnUrl}/${key}`;

    return { uploadUrl, key, cdnUrl };
  }

  // Generate optimized image URL with transformations
  generateOptimizedUrl(
    cdnUrl: string,
    options?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: "webp" | "avif" | "jpeg";
    }
  ): string {
    // If using Cloudflare Images or similar CDN with transformation support
    if (!options) return cdnUrl;

    const params = new URLSearchParams();
    if (options.width) params.set("w", options.width.toString());
    if (options.height) params.set("h", options.height.toString());
    if (options.quality) params.set("q", options.quality.toString());
    if (options.format) params.set("f", options.format);

    return `${cdnUrl}?${params.toString()}`;
  }
}

export const mediaManager = new MediaManager();
