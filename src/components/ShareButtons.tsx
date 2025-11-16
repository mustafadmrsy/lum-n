"use client";

import React from "react";
import { useStatsStore } from "@/stores/useStatsStore";
import { Share2, Twitter, Facebook, Linkedin, MessageCircle, Code } from "lucide-react";

interface ShareButtonsProps {
  blogId: string;
  title: string;
  slug: string;
  userId?: string;
}

export default function ShareButtons({ blogId, title, slug, userId }: ShareButtonsProps) {
  const { recordShare } = useStatsStore();
  const [showEmbed, setShowEmbed] = React.useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const blogUrl = `${baseUrl}/magazine/${slug}`;

  const handleShare = async (platform: "twitter" | "facebook" | "linkedin" | "whatsapp" | "embed") => {
    await recordShare(blogId, platform, userId);

    const encodedUrl = encodeURIComponent(blogUrl);
    const encodedTitle = encodeURIComponent(title);

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      embed: "",
    };

    if (platform === "embed") {
      setShowEmbed(true);
    } else {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
    }
  };

  const embedCode = `<iframe src="${blogUrl}/embed" width="100%" height="600" frameborder="0" scrolling="yes"></iframe>`;

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    alert("Embed kodu kopyalandı!");
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-700">Paylaş:</span>

        <button
          onClick={() => handleShare("twitter")}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-400 hover:bg-blue-500 text-white transition-colors text-sm"
          aria-label="Twitter'da paylaş"
        >
          <Twitter size={16} />
          <span className="hidden sm:inline">Twitter</span>
        </button>

        <button
          onClick={() => handleShare("facebook")}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm"
          aria-label="Facebook'ta paylaş"
        >
          <Facebook size={16} />
          <span className="hidden sm:inline">Facebook</span>
        </button>

        <button
          onClick={() => handleShare("linkedin")}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-700 hover:bg-blue-800 text-white transition-colors text-sm"
          aria-label="LinkedIn'de paylaş"
        >
          <Linkedin size={16} />
          <span className="hidden sm:inline">LinkedIn</span>
        </button>

        <button
          onClick={() => handleShare("whatsapp")}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors text-sm"
          aria-label="WhatsApp'ta paylaş"
        >
          <MessageCircle size={16} />
          <span className="hidden sm:inline">WhatsApp</span>
        </button>

        <button
          onClick={() => handleShare("embed")}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-700 hover:bg-gray-800 text-white transition-colors text-sm"
          aria-label="Embed kodu al"
        >
          <Code size={16} />
          <span className="hidden sm:inline">Embed</span>
        </button>
      </div>

      {showEmbed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Embed Kodu</h3>
              <button
                onClick={() => setShowEmbed(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              Bu kodu kopyalayarak blogu kendi sitenize ekleyebilirsiniz:
            </p>

            <div className="bg-gray-100 rounded p-4 mb-4 font-mono text-sm overflow-x-auto">
              <code>{embedCode}</code>
            </div>

            <button
              onClick={copyEmbedCode}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Kopyala
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
