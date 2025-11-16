import { NextRequest, NextResponse } from "next/server";
import { MagazineManager } from "@/lib/managers/MagazineManager";
import { getUserFromRequest } from "@/lib/auth";
import { UserRole, MagazineStatus } from "@/types/models";

// GET /api/magazines - List magazines
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let magazines;
    if (status === "draft") {
      magazines = await MagazineManager.getDraftMagazines();
    } else if (status === "published") {
      magazines = await MagazineManager.getPublishedMagazines();
    } else {
      // Get both
      const [published, drafts] = await Promise.all([
        MagazineManager.getPublishedMagazines(),
        MagazineManager.getDraftMagazines(),
      ]);
      magazines = [...published, ...drafts];
    }

    return NextResponse.json({ success: true, data: magazines });
  } catch (error) {
    console.error("Get magazines error:", error);
    return NextResponse.json(
      { success: false, error: "Dergiler alınamadı" },
      { status: 500 }
    );
  }
}

// POST /api/magazines - Create new magazine
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Giriş gerekli" },
        { status: 401 }
      );
    }

    if (user.role !== UserRole.WRITER && user.role !== UserRole.EDITOR && user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Yetkiniz yok" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, pages, tags, slug: requestedSlug } = body;

    if (!title || !pages) {
      return NextResponse.json(
        { success: false, error: "Başlık ve sayfalar gereklidir" },
        { status: 400 }
      );
    }

    // Generate or validate slug
    const baseSlug = requestedSlug || title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    const slug = await MagazineManager.generateUniqueSlug(baseSlug);

    const magazineId = await MagazineManager.createMagazine({
      title,
      slug,
      pages,
      tags: tags || [],
      authorId: user.id,
      authorName: user.displayName,
      status: MagazineStatus.DRAFT,
    });

    return NextResponse.json({
      success: true,
      data: { id: magazineId, slug },
    });
  } catch (error) {
    console.error("Create magazine error:", error);
    return NextResponse.json(
      { success: false, error: "Dergi oluşturulamadı" },
      { status: 500 }
    );
  }
}
