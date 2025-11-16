"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole, BlogPost, Magazine } from "@/types/models";

export default function AdminHome() {
  const [activeTab, setActiveTab] = useState<"blogs" | "magazines">("blogs");

  return (
    <ProtectedRoute requiredRole={UserRole.WRITER}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <div className="mx-auto max-w-7xl px-4 py-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              İçerik Yönetimi
            </h1>
            <p className="text-gray-600">
              Blog yazılarınızı ve dergilerinizi buradan yönetin
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("blogs")}
              className={`px-6 py-3 text-sm font-medium transition-all ${
                activeTab === "blogs"
                  ? "border-b-2 border-purple-600 text-purple-700"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              📝 Blog Yazıları
            </button>
            <button
              onClick={() => setActiveTab("magazines")}
              className={`px-6 py-3 text-sm font-medium transition-all ${
                activeTab === "magazines"
                  ? "border-b-2 border-purple-600 text-purple-700"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              📚 Dergiler
            </button>
          </div>

          {/* Create Button */}
          <div className="mb-6">
            {activeTab === "blogs" ? (
              <Link
                href="/admin/blog/new"
                className="inline-flex items-center gap-2 px-6 py-3 text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
              >
                <span className="text-xl">+</span>
                Yeni Blog Yazısı
              </Link>
            ) : (
              <Link
                href="/admin/magazine/new"
                className="inline-flex items-center gap-2 px-6 py-3 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                <span className="text-xl">+</span>
                Yeni Dergi
              </Link>
            )}
          </div>

          {/* Content */}
          {activeTab === "blogs" ? <BlogsList /> : <MagazinesList />}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function BlogsList() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await fetch("/api/blogs?pageSize=50");
      const result = await response.json();
      if (result.success) {
        setBlogs(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="text-center py-12 text-gray-500">
          <p>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Blog Yazılarınız
        </h2>
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">Henüz blog yazısı yok</p>
          <p className="text-sm">İlk blog yazınızı oluşturmak için yukarıdaki butona tıklayın</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Blog Yazılarınız ({blogs.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.map((blog) => (
          <div
            key={blog.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            {blog.coverImage && (
              <Image
                src={blog.coverImage.url}
                alt={blog.title}
                width={400}
                height={160}
                className="w-full h-40 object-cover rounded-lg mb-3"
              />
            )}
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
              {blog.title}
            </h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {blog.excerpt}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className={`px-2 py-1 rounded ${
                blog.status === "published" 
                  ? "bg-green-100 text-green-700" 
                  : "bg-yellow-100 text-yellow-700"
              }`}>
                {blog.status === "published" ? "Yayında" : "Taslak"}
              </span>
              <Link
                href={`/admin/blog/edit/${blog.id}`}
                className="text-purple-600 hover:text-purple-800"
              >
                Düzenle →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MagazinesList() {
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMagazines();
  }, []);

  const fetchMagazines = async () => {
    try {
      const response = await fetch("/api/magazines");
      const result = await response.json();
      if (result.success) {
        setMagazines(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch magazines:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="text-center py-12 text-gray-500">
          <p>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (magazines.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Dergileriniz
        </h2>
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">Henüz dergi yok</p>
          <p className="text-sm">İlk derginizi oluşturmak için yukarıdaki butona tıklayın</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Dergileriniz ({magazines.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {magazines.map((magazine) => (
          <div
            key={magazine.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
              {magazine.title}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Yazar: {magazine.authorName}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">\n              <span className={`px-2 py-1 rounded ${
                magazine.status === "published" 
                  ? "bg-green-100 text-green-700" 
                  : "bg-yellow-100 text-yellow-700"
              }`}>
                {magazine.status === "published" ? "Yayında" : "Taslak"}
              </span>
              <span className="text-gray-500">
                {magazine.pages.length} sayfa
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

