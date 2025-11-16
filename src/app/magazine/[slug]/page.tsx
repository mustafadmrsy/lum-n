import { notFound } from "next/navigation";
import { blogManager } from "@/lib/managers/BlogManager";
import { generateSEOMetadata, generateBlogStructuredData } from "@/lib/seo";
import ShareButtons from "@/components/ShareButtons";
import BlogStatsDisplay from "@/components/BlogStatsDisplay";
import CommentSection from "@/components/CommentSection";
import ViewTracker from "@/components/ViewTracker";
import Image from "next/image";
import { Metadata } from "next";

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await blogManager.getBlogBySlug(slug);

  if (!blog) {
    return {
      title: "Blog Not Found",
    };
  }

  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/magazine/${slug}`;
  return generateSEOMetadata({ blog, url });
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const blog = await blogManager.getBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  const structuredData = generateBlogStructuredData(
    blog,
    `${process.env.NEXT_PUBLIC_SITE_URL}/magazine/${slug}`
  );

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* View Tracker */}
      <ViewTracker blogId={blog.id} />

      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Cover Image */}
        {blog.coverImage && (
          <div className="relative w-full h-[500px] mb-8 rounded-2xl overflow-hidden">
            <Image
              src={blog.coverImage.cdnUrl}
              alt={blog.coverImage.altText || blog.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          </div>
        )}

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            {blog.title}
          </h1>

          {blog.excerpt && (
            <p className="text-xl text-gray-600 mb-6">{blog.excerpt}</p>
          )}

          <div className="flex items-center gap-4 pb-6 border-b">
            <div className="flex items-center gap-3">
              {blog.authorPhoto && (
                <Image
                  src={blog.authorPhoto}
                  alt={blog.authorName}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              )}
              <div>
                <p className="font-semibold">{blog.authorName}</p>
                {blog.publishedAt && (
                  <p className="text-sm text-gray-500">
                    {new Date(blog.publishedAt.toDate()).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Stats & Share */}
        <div className="flex items-center justify-between py-6 border-b mb-8">
          <BlogStatsDisplay blogId={blog.id} />
          <ShareButtons blogId={blog.id} title={blog.title} slug={blog.slug} />
        </div>

        {/* Content */}
        <div
          className="prose prose-lg max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Tags */}
        {blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {blog.tags.map((tag) => (
              <a
                key={tag}
                href={`/tags/${tag}`}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-colors"
              >
                #{tag}
              </a>
            ))}
          </div>
        )}

        {/* Share Again */}
        <div className="py-8 border-t border-b mb-12">
          <ShareButtons blogId={blog.id} title={blog.title} slug={blog.slug} />
        </div>

        {/* Comments */}
        <CommentSection blogId={blog.id} />
      </article>
    </>
  );
}

// Generate static params for SSG (optional - for popular blogs)
export async function generateStaticParams() {
  // You can implement this to pre-generate popular blog pages
  return [];
}
