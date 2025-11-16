import { NextRequest, NextResponse } from "next/server";
import { blogManager } from "@/lib/managers/BlogManager";
import { BlogStatus } from "@/types/models";

// GET /api/blogs - Get all blogs (published and drafts for admin)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const all = searchParams.get("all"); // Get all blogs including drafts

    let blogs;

    if (category) {
      blogs = await blogManager.getBlogsByCategory(category);
    } else if (tag) {
      blogs = await blogManager.getBlogsByTag(tag);
    } else if (search) {
      blogs = await blogManager.searchBlogs(search);
    } else if (all === "true") {
      // Get all blogs for admin panel
      blogs = await blogManager.getAllBlogs(pageSize);
    } else {
      const result = await blogManager.getPublishedBlogs(pageSize);
      blogs = result.blogs;
    }

    return NextResponse.json({ success: true, data: blogs });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}

// POST /api/blogs - Create new blog
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, excerpt, authorId, authorName, tags, categories, coverImage, media } = body;

    // Generate unique slug
    const slug = await blogManager.generateUniqueSlug(title);

    const blogId = await blogManager.createBlog({
      title,
      slug,
      content,
      excerpt,
      authorId,
      authorName,
      status: BlogStatus.DRAFT,
      tags: tags || [],
      categories: categories || [],
      coverImage,
      media: media || [],
      editorNotes: [],
    });

    return NextResponse.json({ success: true, data: { id: blogId, slug } });
  } catch (error) {
    console.error("Error creating blog:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create blog" },
      { status: 500 }
    );
  }
}
