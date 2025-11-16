"use client";

import React from "react";
import { Editor } from "@tinymce/tinymce-react";
import { useBlogStore } from "@/stores/useBlogStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { api } from "@/services/api";
import { BlogStatus } from "@/types/models";
import { useRouter } from "next/navigation";

interface BlogEditorProps {
  blogId?: string;
  mode?: "create" | "edit";
}

export default function BlogEditor({ blogId, mode = "create" }: BlogEditorProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentBlog, fetchBlogById, createBlog, updateBlog } = useBlogStore();

  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (mode === "edit" && blogId) {
      fetchBlogById(blogId);
    }
  }, [mode, blogId, fetchBlogById]);

  React.useEffect(() => {
    if (currentBlog && mode === "edit") {
      setTitle(currentBlog.title);
      setContent(currentBlog.content);
      setExcerpt(currentBlog.excerpt);
      setTags(currentBlog.tags);
      setCategories(currentBlog.categories);
    }
  }, [currentBlog, mode]);

  const handleImageUpload = async (
    blobInfo: { blob: () => Blob; filename: () => string },
    progress: (percent: number) => void
  ): Promise<string> => {
    const file = new File([blobInfo.blob()], blobInfo.filename());

    progress(0);
    const result = await api.media.upload(file);
    progress(100);

    if (result.success && result.data) {
      return result.data.cdnUrl;
    }

    throw new Error("Upload failed");
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = async (status: BlogStatus) => {
    if (!user) {
      alert("Giriş yapmalısınız");
      return;
    }

    if (!title.trim() || !content.trim()) {
      alert("Başlık ve içerik gerekli");
      return;
    }

    setIsSaving(true);

    try {
      if (mode === "create") {
        const result = await createBlog({
          title,
          content,
          excerpt: excerpt || content.substring(0, 200),
          authorId: user.id,
          authorName: user.displayName,
          tags,
          categories,
        });

        if (result) {
          alert("Blog başarıyla oluşturuldu!");
          router.push(`/admin/blog/${result.id}`);
        }
      } else if (blogId) {
        await updateBlog(blogId, {
          title,
          content,
          excerpt: excerpt || content.substring(0, 200),
          tags,
          categories,
          status,
        });

        alert("Blog başarıyla güncellendi!");
      }
    } catch (error) {
      alert("Bir hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForReview = () => {
    handleSave(BlogStatus.PENDING_REVIEW);
  };

  const handleSaveDraft = () => {
    handleSave(BlogStatus.DRAFT);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">
          {mode === "create" ? "Yeni Blog Yazısı" : "Blog Düzenle"}
        </h1>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Başlık
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              placeholder="Blog başlığını yazın..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Özet (Opsiyonel)
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Blog özeti..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İçerik
            </label>
            <Editor
              apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
              value={content}
              onEditorChange={(newContent) => setContent(newContent)}
              init={{
                height: 600,
                menubar: true,
                plugins: [
                  "advlist", "autolink", "lists", "link", "image", "charmap",
                  "preview", "anchor", "searchreplace", "visualblocks", "code",
                  "fullscreen", "insertdatetime", "media", "table", "code",
                  "help", "wordcount", "codesample",
                ],
                toolbar:
                  "undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | image media link | removeformat | code | help",
                content_style:
                  "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; font-size: 16px; line-height: 1.6; }",
                images_upload_handler: handleImageUpload,
                automatic_uploads: true,
                file_picker_types: "image",
                media_live_embeds: true,
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Etiketler
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Etiket ekle..."
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ekle
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 transition-colors"
            >
              Taslak Kaydet
            </button>
            <button
              onClick={handleSubmitForReview}
              disabled={isSaving}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Editöre Gönder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
