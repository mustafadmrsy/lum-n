"use client";

import React from "react";
import { blogManager } from "@/lib/managers/BlogManager";
import { statsManager } from "@/lib/managers/StatsManager";
import { commentManager } from "@/lib/managers/CommentManager";
import { BlogPost, BlogStats, BlogStatus } from "@/types/models";
import { BarChart, TrendingUp, Eye, Heart, MessageCircle, Share2 } from "lucide-react";

export default function AnalyticsDashboard() {
  const [stats, setStats] = React.useState<{
    totalBlogs: number;
    publishedBlogs: number;
    draftBlogs: number;
    pendingBlogs: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    topBlogs: Array<{ blog: BlogPost; stats: BlogStats }>;
  } | null>(null);

  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);

    try {
      // Get all blogs by status
      const published = await blogManager.getBlogsByStatus(BlogStatus.PUBLISHED);
      const drafts = await blogManager.getBlogsByStatus(BlogStatus.DRAFT);
      const pending = await blogManager.getBlogsByStatus(BlogStatus.PENDING_REVIEW);

      // Get stats for all published blogs
      const blogStats = await Promise.all(
        published.map(async (blog) => {
          const stat = await statsManager.getStats(blog.id);
          return { blog, stats: stat };
        })
      );

      // Calculate totals
      const totalViews = blogStats.reduce((sum, item) => sum + item.stats.views, 0);
      const totalLikes = blogStats.reduce((sum, item) => sum + item.stats.likes, 0);
      const totalComments = blogStats.reduce((sum, item) => sum + item.stats.comments, 0);
      const totalShares = blogStats.reduce((sum, item) => sum + item.stats.shares.total, 0);

      // Get top 5 blogs by views
      const topBlogs = blogStats
        .sort((a, b) => b.stats.views - a.stats.views)
        .slice(0, 5);

      setStats({
        totalBlogs: published.length + drafts.length + pending.length,
        publishedBlogs: published.length,
        draftBlogs: drafts.length,
        pendingBlogs: pending.length,
        totalViews,
        totalLikes,
        totalComments,
        totalShares,
        topBlogs,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div className="p-8 text-center text-red-600">Veriler yüklenemedi</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart size={32} />
          Analytics Dashboard
        </h1>
        <p className="text-gray-600 mt-2">Blog performans metrikleri ve istatistikler</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">Toplam Blog</h3>
            <BarChart size={20} className="opacity-75" />
          </div>
          <p className="text-4xl font-bold">{stats.totalBlogs}</p>
          <div className="mt-4 flex gap-4 text-sm">
            <span className="opacity-90">✓ {stats.publishedBlogs} Yayında</span>
            <span className="opacity-90">⏳ {stats.pendingBlogs} Bekliyor</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">Toplam Görüntülenme</h3>
            <Eye size={20} className="opacity-75" />
          </div>
          <p className="text-4xl font-bold">{stats.totalViews.toLocaleString()}</p>
          <p className="mt-4 text-sm opacity-90">
            Ortalama: {Math.round(stats.totalViews / (stats.publishedBlogs || 1))} / blog
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">Toplam Beğeni</h3>
            <Heart size={20} className="opacity-75" />
          </div>
          <p className="text-4xl font-bold">{stats.totalLikes.toLocaleString()}</p>
          <p className="mt-4 text-sm opacity-90">
            Ortalama: {Math.round(stats.totalLikes / (stats.publishedBlogs || 1))} / blog
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">Toplam Yorum</h3>
            <MessageCircle size={20} className="opacity-75" />
          </div>
          <p className="text-4xl font-bold">{stats.totalComments.toLocaleString()}</p>
          <p className="mt-4 text-sm opacity-90">Engagement Rate: Yüksek</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Share2 size={20} />
            Paylaşım İstatistikleri
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Toplam Paylaşım</span>
              <span className="text-2xl font-bold">{stats.totalShares}</span>
            </div>
            <div className="h-px bg-gray-200"></div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Twitter</p>
                <p className="text-lg font-semibold">
                  {stats.topBlogs.reduce((sum, item) => sum + item.stats.shares.twitter, 0)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Facebook</p>
                <p className="text-lg font-semibold">
                  {stats.topBlogs.reduce((sum, item) => sum + item.stats.shares.facebook, 0)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">LinkedIn</p>
                <p className="text-lg font-semibold">
                  {stats.topBlogs.reduce((sum, item) => sum + item.stats.shares.linkedin, 0)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">WhatsApp</p>
                <p className="text-lg font-semibold">
                  {stats.topBlogs.reduce((sum, item) => sum + item.stats.shares.whatsapp, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={20} />
            Blog Durumu
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Yayınlanan</span>
                <span className="font-semibold">{stats.publishedBlogs}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${(stats.publishedBlogs / stats.totalBlogs) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Onay Bekleyen</span>
                <span className="font-semibold">{stats.pendingBlogs}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500"
                  style={{
                    width: `${(stats.pendingBlogs / stats.totalBlogs) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Taslak</span>
                <span className="font-semibold">{stats.draftBlogs}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-400"
                  style={{
                    width: `${(stats.draftBlogs / stats.totalBlogs) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Blogs */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6">En Çok Okunan Bloglar</h3>
        <div className="space-y-4">
          {stats.topBlogs.map((item, index) => (
            <div
              key={item.blog.id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                #{index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">{item.blog.title}</h4>
                <p className="text-sm text-gray-500">{item.blog.authorName}</p>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="font-bold text-lg">{item.stats.views}</p>
                  <p className="text-gray-500">Görüntülenme</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{item.stats.likes}</p>
                  <p className="text-gray-500">Beğeni</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{item.stats.comments}</p>
                  <p className="text-gray-500">Yorum</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
