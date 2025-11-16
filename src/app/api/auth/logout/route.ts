import { NextResponse } from "next/server";
import { removeAuthCookie } from "@/lib/auth";

// POST /api/auth/logout
export async function POST() {
  try {
    await removeAuthCookie();

    return NextResponse.json({
      success: true,
      message: "Başarıyla çıkış yapıldı",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Çıkış sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}
