import { Metadata } from "next";
import { BlogPost } from "@/types/models";

interface GenerateSEOMetadataProps {
  blog: BlogPost;
  url: string;
}

export function generateSEOMetadata({ blog, url }: GenerateSEOMetadataProps): Metadata {
  const title = blog.metaTitle || blog.title;
  const description = blog.metaDescription || blog.excerpt || blog.content.substring(0, 160);
  const imageUrl = blog.coverImage?.cdnUrl || "/default-og-image.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Lumin Fashion Blog",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: blog.coverImage?.altText || title,
        },
      ],
      locale: "tr_TR",
      type: "article",
      publishedTime: blog.publishedAt?.toDate().toISOString(),
      authors: [blog.authorName],
      tags: blog.tags,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      creator: `@${blog.authorName}`,
    },
    authors: [{ name: blog.authorName }],
    keywords: blog.tags.join(", "),
    alternates: {
      canonical: url,
    },
  };
}

// Generate alt text for images using AI (placeholder - integrate with OpenAI API)
export async function generateImageAltText(imageUrl: string, context?: string): Promise<string> {
  // TODO: Integrate with OpenAI Vision API or similar
  // For now, return a descriptive placeholder
  return `Fashion blog image${context ? ` - ${context}` : ""}`;
}

// Generate structured data for blog post
export function generateBlogStructuredData(blog: BlogPost, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.excerpt,
    image: blog.coverImage?.cdnUrl,
    datePublished: blog.publishedAt?.toDate().toISOString(),
    dateModified: blog.updatedAt?.toDate().toISOString(),
    author: {
      "@type": "Person",
      name: blog.authorName,
      image: blog.authorPhoto,
    },
    publisher: {
      "@type": "Organization",
      name: "Lumin Fashion Blog",
      logo: {
        "@type": "ImageObject",
        url: "/logos/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    keywords: blog.tags.join(", "),
  };
}
