"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole, BlogPost } from "@/types/models";
import TiptapEditor from "@/components/TiptapEditor";

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const blogId = params.id as string;

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    tags: "",
    coverImage: "",
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blog, setBlog] = useState<BlogPost | null>(null);

  useEffect(() => {
    fetchBlog();
  }, [blogId]);

  const fetchBlog = async () => {
    try {
      const response = await fetch(`/api/blogs/${blogId}`);
      const result = await response.json();

      if (result.success && result.data) {
        const blogData = result.data;
        setBlog(blogData);
        setFormData({
          title: blogData.title,
          content: blogData.content,
          excerpt: blogData.excerpt || "",
          tags: blogData.tags?.join(", ") || "",
          coverImage: blogData.coverImage || "",
        });
      } else {
        setError("Blog bulunamadı");
      }
    } catch (err) {
      console.error("Failed to fetch blog:", err);
      setError("Blog yüklenirken hata oluştu");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: FormEvent, publish = false) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt || formData.content.substring(0, 200),
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        status: publish ? "published" : blog?.status || "draft",
      };

      if (formData.coverImage) {
        payload.coverImage = formData.coverImage;
      }

      const response = await fetch(`/api/blogs/${blogId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        router.push("/admin");
      } else {
        setError(result.error || "Blog güncellenemedi");
      }
    } catch (err) {
      setError("Bir hata oluştu");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bu blog yazısını silmek istediğinizden emin misiniz?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/blogs/${blogId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        router.push("/admin");
      } else {
        setError(result.error || "Blog silinemedi");
      }
    } catch (err) {
      setError("Bir hata oluştu");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <ProtectedRoute requiredRole={UserRole.WRITER}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center py-12">
              <p className="text-gray-600">Yükleniyor...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error && !blog) {
    return (
      <ProtectedRoute requiredRole={UserRole.WRITER}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => router.push("/admin")}
                className="text-indigo-600 hover:text-indigo-800"
              >
                ← Geri Dön
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole={UserRole.WRITER}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Blog Yazısını Düzenle
              </h1>
              <p className="text-gray-600">
                {blog?.authorName} tarafından oluşturuldu
              </p>
            </div>
            <button
              onClick={() => router.push("/admin")}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Geri
            </button>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <form onSubmit={(e) => handleSubmit(e, false)}>
              {/* Title */}
              <div className="p-6 border-b border-gray-100">
                <input
                  type="text"
                  placeholder="Başlık yazın..."
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full text-3xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none border-none"
                  required
                />
              </div>

              {/* Excerpt */}
              <div className="p-6 border-b border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Özet (İsteğe bağlı)
                </label>
                <textarea
                  placeholder="Kısa bir özet yazın..."
                  value={formData.excerpt}
                  onChange={(e) =>
                    setFormData({ ...formData, excerpt: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Cover Image */}
              <div className="p-6 border-b border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kapak Görseli URL (İsteğe bağlı)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.coverImage}
                  onChange={(e) =>
                    setFormData({ ...formData, coverImage: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {formData.coverImage && (
                  <div className="mt-3 rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.coverImage}
                      alt="Kapak önizleme"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Content Editor */}
              <div className="p-6 border-b border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İçerik
                </label>
                <TiptapEditor
                  content={formData.content}
                  onChange={(content) =>
                    setFormData({ ...formData, content })
                  }
                  placeholder="Blog içeriğinizi buraya yazın..."
                />
              </div>

              {/* Tags */}
              <div className="p-6 border-b border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Etiketler (virgülle ayırın)
                </label>
                <input
                  type="text"
                  placeholder="moda, trend, stil, ..."
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-6 border-b border-gray-100">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="p-6 bg-gray-50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-6 py-2.5 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  Sil
                </button>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    className="px-6 py-2.5 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Yayınlanıyor..." : blog?.status === "published" ? "Güncelle" : "Yayınla"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
