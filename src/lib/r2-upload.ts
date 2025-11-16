export async function uploadToR2(
  file: File,
  folder: string = "images"
): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Yükleme başarısız");
    }

    return result.url;
  } catch (error) {
    console.error("R2 upload error:", error);
    throw new Error("Görsel yüklenemedi");
  }
}
