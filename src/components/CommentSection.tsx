"use client";

import React from "react";
import { useCommentStore } from "@/stores/useCommentStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface CommentSectionProps {
  blogId: string;
}

export default function CommentSection({ blogId }: CommentSectionProps) {
  const { comments, fetchComments, createComment } = useCommentStore();
  const { user } = useAuthStore();
  const [newComment, setNewComment] = React.useState("");
  const [replyTo, setReplyTo] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    fetchComments(blogId);
  }, [blogId, fetchComments]);

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();

    if (!user) {
      alert("Yorum yapmak için giriş yapmalısınız");
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);

    await createComment({
      blogId,
      userId: user.id,
      userName: user.displayName,
      userPhoto: user.photoURL,
      content: newComment.trim(),
      parentId,
    });

    setNewComment("");
    setReplyTo(null);
    setIsSubmitting(false);
  };

  const topLevelComments = comments.filter((c) => !c.parentId);

  const getReplies = (commentId: string) => {
    return comments.filter((c) => c.parentId === commentId);
  };

  const CommentItem = ({ comment, isReply = false }: { comment: typeof comments[0]; isReply?: boolean }) => {
    const replies = getReplies(comment.id);

    return (
      <div className={`${isReply ? "ml-8 md:ml-12" : ""} mb-4`}>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            {comment.userPhoto ? (
              <img
                src={comment.userPhoto}
                alt={comment.userName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                {comment.userName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900">{comment.userName}</span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(comment.createdAt.toDate(), {
                    addSuffix: true,
                    locale: tr,
                  })}
                </span>
              </div>

              <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>

              <button
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                className="text-xs text-blue-600 hover:text-blue-700 mt-2 font-medium"
              >
                Yanıtla
              </button>

              {replyTo === comment.id && (
                <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mt-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Yanıtınızı yazın..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      Gönder
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo(null);
                        setNewComment("");
                      }}
                      className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                    >
                      İptal
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {replies.length > 0 && (
          <div className="mt-2">
            {replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-12">
      <h3 className="text-2xl font-bold mb-6">Yorumlar ({comments.length})</h3>

      {user && !replyTo && (
        <form onSubmit={(e) => handleSubmit(e)} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Yorumunuzu yazın..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Yorum Yap
          </button>
        </form>
      )}

      {!user && (
        <div className="mb-8 p-4 bg-blue-50 rounded-lg text-blue-800">
          Yorum yapmak için <a href="/login" className="font-semibold underline">giriş yapın</a>
        </div>
      )}

      <div>
        {topLevelComments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}

        {comments.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Henüz yorum yapılmamış. İlk yorumu siz yapın!
          </p>
        )}
      </div>
    </div>
  );
}
