import { BlogPost } from "@/types/models";

// WordPress export format
export function exportToWordPress(blogs: BlogPost[]): string {
  const items = blogs.map((blog) => {
    const pubDate = blog.publishedAt?.toDate().toISOString() || new Date().toISOString();
    
    return `
    <item>
      <title><![CDATA[${blog.title}]]></title>
      <link>${process.env.NEXT_PUBLIC_SITE_URL}/magazine/${blog.slug}</link>
      <pubDate>${pubDate}</pubDate>
      <dc:creator><![CDATA[${blog.authorName}]]></dc:creator>
      <guid isPermaLink="false">${blog.id}</guid>
      <description><![CDATA[${blog.excerpt || ""}]]></description>
      <content:encoded><![CDATA[${blog.content}]]></content:encoded>
      <wp:post_type>post</wp:post_type>
      <wp:status>publish</wp:status>
      ${blog.tags.map((tag) => `<category domain="post_tag" nicename="${tag}"><![CDATA[${tag}]]></category>`).join("\n      ")}
    </item>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wfw="http://wellformedweb.org/CommentAPI/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:wp="http://wordpress.org/export/1.2/">
  <channel>
    <title>Lumin Fashion Blog</title>
    <link>${process.env.NEXT_PUBLIC_SITE_URL}</link>
    <description>Fashion Blog Export</description>
    <language>tr</language>
    ${items}
  </channel>
</rss>`;
}

// Medium export format (JSON)
export function exportToMedium(blogs: BlogPost[]): string {
  const posts = blogs.map((blog) => ({
    title: blog.title,
    content: blog.content,
    contentFormat: "html",
    tags: blog.tags,
    publishStatus: "public",
    canonicalUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/magazine/${blog.slug}`,
  }));

  return JSON.stringify(posts, null, 2);
}

// Ghost export format
export function exportToGhost(blogs: BlogPost[]): string {
  const posts = blogs.map((blog) => ({
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    html: blog.content,
    feature_image: blog.coverImage?.cdnUrl,
    featured: false,
    status: "published",
    published_at: blog.publishedAt?.toDate().toISOString(),
    updated_at: blog.updatedAt?.toDate().toISOString(),
    created_at: blog.createdAt?.toDate().toISOString(),
    author: {
      id: blog.authorId,
      name: blog.authorName,
      profile_image: blog.authorPhoto,
    },
    tags: blog.tags.map((tag) => ({ name: tag })),
  }));

  return JSON.stringify(
    {
      db: [
        {
          meta: {
            exported_on: Date.now(),
            version: "5.0.0",
          },
          data: {
            posts,
            tags: [],
            users: [],
          },
        },
      ],
    },
    null,
    2
  );
}

// RSS feed format
export function exportToRSS(blogs: BlogPost[]): string {
  const items = blogs.map((blog) => {
    const pubDate = blog.publishedAt?.toDate().toUTCString() || new Date().toUTCString();
    
    return `
    <item>
      <title><![CDATA[${blog.title}]]></title>
      <link>${process.env.NEXT_PUBLIC_SITE_URL}/magazine/${blog.slug}</link>
      <guid isPermaLink="true">${process.env.NEXT_PUBLIC_SITE_URL}/magazine/${blog.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${blog.excerpt || ""}]]></description>
      <content:encoded><![CDATA[${blog.content}]]></content:encoded>
      <author>${blog.authorName}</author>
      ${blog.tags.map((tag) => `<category>${tag}</category>`).join("\n      ")}
      ${blog.coverImage ? `<enclosure url="${blog.coverImage.cdnUrl}" type="image/jpeg" />` : ""}
    </item>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Lumin Fashion Blog</title>
    <link>${process.env.NEXT_PUBLIC_SITE_URL}</link>
    <description>Latest fashion trends and insights</description>
    <language>tr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;
}

// JSON export
export function exportToJSON(blogs: BlogPost[]): string {
  return JSON.stringify(blogs, null, 2);
}
