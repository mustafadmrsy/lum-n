import { NextRequest, NextResponse } from "next/server";
import { MagazineManager } from "@/lib/managers/MagazineManager";
import { getUserFromRequest } from "@/lib/auth";
import { UserRole } from "@/types/models";

// POST /api/magazines/[id]/publish
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Giriş gerekli" },
        { status: 401 }
      );
    }

    // Only editors and admins can publish
    if (user.role !== UserRole.EDITOR && user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Yayınlama yetkiniz yok" },
        { status: 403 }
      );
    }

    const magazine = await MagazineManager.getMagazineById(params.id);

    if (!magazine) {
      return NextResponse.json(
        { success: false, error: "Dergi bulunamadı" },
        { status: 404 }
      );
    }

    await MagazineManager.publishMagazine(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Publish magazine error:", error);
    return NextResponse.json(
      { success: false, error: "Dergi yayınlanamadı" },
      { status: 500 }
    );
  }
}
