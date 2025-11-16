import { NextRequest, NextResponse } from "next/server";
import { blogManager } from "@/lib/managers/BlogManager";
import {
  exportToWordPress,
  exportToMedium,
  exportToGhost,
  exportToRSS,
  exportToJSON,
} from "@/lib/exporters";

// GET /api/export?format=wordpress&blogIds=id1,id2,id3
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") as "wordpress" | "medium" | "ghost" | "rss" | "json";
    const blogIdsParam = searchParams.get("blogIds");

    if (!format) {
      return NextResponse.json(
        { success: false, error: "Format is required" },
        { status: 400 }
      );
    }

    let blogs;

    if (blogIdsParam) {
      const blogIds = blogIdsParam.split(",");
      blogs = await Promise.all(blogIds.map((id) => blogManager.getBlogById(id)));
      blogs = blogs.filter((blog) => blog !== null);
    } else {
      // Export all published blogs
      const result = await blogManager.getPublishedBlogs(1000);
      blogs = result.blogs;
    }

    let exportData: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case "wordpress":
        exportData = exportToWordPress(blogs);
        contentType = "application/xml";
        filename = "wordpress-export.xml";
        break;

      case "medium":
        exportData = exportToMedium(blogs);
        contentType = "application/json";
        filename = "medium-export.json";
        break;

      case "ghost":
        exportData = exportToGhost(blogs);
        contentType = "application/json";
        filename = "ghost-export.json";
        break;

      case "rss":
        exportData = exportToRSS(blogs);
        contentType = "application/xml";
        filename = "rss-feed.xml";
        break;

      case "json":
        exportData = exportToJSON(blogs);
        contentType = "application/json";
        filename = "blogs-export.json";
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Invalid format" },
          { status: 400 }
        );
    }

    return new NextResponse(exportData, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting blogs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export blogs" },
      { status: 500 }
    );
  }
}
