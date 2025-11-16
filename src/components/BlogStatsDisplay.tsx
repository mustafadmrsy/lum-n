"use client";

import React from "react";
import { useStatsStore } from "@/stores/useStatsStore";
import { Heart, Eye, MessageCircle } from "lucide-react";

interface BlogStatsDisplayProps {
  blogId: string;
  userId?: string;
  userLikeId?: string;
}

export default function BlogStatsDisplay({ blogId, userId, userLikeId }: BlogStatsDisplayProps) {
  const { stats, fetchStats, toggleLike } = useStatsStore();
  const [isLiked, setIsLiked] = React.useState(!!userLikeId);
  const [likeId, setLikeId] = React.useState(userLikeId);

  const blogStats = stats[blogId];

  React.useEffect(() => {
    fetchStats(blogId);
  }, [blogId, fetchStats]);

  const handleLike = async () => {
    if (!userId) {
      alert("Beğenmek için giriş yapmalısınız");
      return;
    }

    await toggleLike(blogId, userId, isLiked, likeId);
    setIsLiked(!isLiked);
  };

  if (!blogStats) {
    return null;
  }

  return (
    <div className="flex items-center gap-6 text-sm text-gray-600">
      <button
        onClick={handleLike}
        className={`flex items-center gap-1.5 transition-colors ${
          isLiked ? "text-red-500" : "hover:text-red-500"
        }`}
        aria-label={isLiked ? "Beğeniyi kaldır" : "Beğen"}
      >
        <Heart
          size={18}
          fill={isLiked ? "currentColor" : "none"}
          className="transition-all"
        />
        <span className="font-medium">{blogStats.likes}</span>
      </button>

      <div className="flex items-center gap-1.5">
        <Eye size={18} />
        <span className="font-medium">{blogStats.views}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <MessageCircle size={18} />
        <span className="font-medium">{blogStats.comments}</span>
      </div>
    </div>
  );
}
