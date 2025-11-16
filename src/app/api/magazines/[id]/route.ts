import { NextRequest, NextResponse } from "next/server";
import { MagazineManager } from "@/lib/managers/MagazineManager";
import { getUserFromRequest } from "@/lib/auth";
import { UserRole } from "@/types/models";

// GET /api/magazines/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const magazine = await MagazineManager.getMagazineById(params.id);

    if (!magazine) {
      return NextResponse.json(
        { success: false, error: "Dergi bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: magazine });
  } catch (error) {
    console.error("Get magazine error:", error);
    return NextResponse.json(
      { success: false, error: "Dergi alınamadı" },
      { status: 500 }
    );
  }
}

// PATCH /api/magazines/[id]
export async function PATCH(
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

    const magazine = await MagazineManager.getMagazineById(params.id);

    if (!magazine) {
      return NextResponse.json(
        { success: false, error: "Dergi bulunamadı" },
        { status: 404 }
      );
    }

    // Check permissions
    const isAuthor = magazine.authorId === user.id;
    const isEditor = user.role === UserRole.EDITOR || user.role === UserRole.ADMIN;

    if (!isAuthor && !isEditor) {
      return NextResponse.json(
        { success: false, error: "Bu dergiyi düzenleme yetkiniz yok" },
        { status: 403 }
      );
    }

    const body = await request.json();
    await MagazineManager.updateMagazine(params.id, body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update magazine error:", error);
    return NextResponse.json(
      { success: false, error: "Dergi güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE /api/magazines/[id]
export async function DELETE(
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

    const magazine = await MagazineManager.getMagazineById(params.id);

    if (!magazine) {
      return NextResponse.json(
        { success: false, error: "Dergi bulunamadı" },
        { status: 404 }
      );
    }

    // Only author or admin can delete
    const isAuthor = magazine.authorId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Bu dergiyi silme yetkiniz yok" },
        { status: 403 }
      );
    }

    await MagazineManager.deleteMagazine(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete magazine error:", error);
    return NextResponse.json(
      { success: false, error: "Dergi silinemedi" },
      { status: 500 }
    );
  }
}
