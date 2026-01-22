import { useState, useEffect } from "react";
import { X, Send, Heart, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@getmocha/users-service/react";
import type { CommentWithCounts, ReplyWithUser } from "@/shared/types";

interface CommentModalProps {
  newsId: number;
  newsTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CommentModal({ newsId, newsTitle, isOpen, onClose }: CommentModalProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithCounts[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [replies, setReplies] = useState<Record<number, ReplyWithUser[]>>({});
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
  const [submittingReply, setSubmittingReply] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, newsId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/news/${newsId}/comments`);
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReplies = async (commentId: number) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/replies`);
      const data = await response.json();
      setReplies(prev => ({ ...prev, [commentId]: data }));
    } catch (error) {
      console.error("Error fetching replies:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/news/${newsId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: newComment }),
      });

      if (response.ok) {
        setNewComment("");
        await fetchComments();
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    if (!user) return;

    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const newLikedState = !comment.user_liked;
    
    setComments(prev =>
      prev.map(c =>
        c.id === commentId
          ? {
              ...c,
              user_liked: newLikedState,
              likes_count: newLikedState ? c.likes_count + 1 : c.likes_count - 1,
            }
          : c
      )
    );

    try {
      await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error liking comment:", error);
      setComments(prev =>
        prev.map(c =>
          c.id === commentId
            ? {
                ...c,
                user_liked: !newLikedState,
                likes_count: !newLikedState ? c.likes_count + 1 : c.likes_count - 1,
              }
            : c
        )
      );
    }
  };

  const toggleReplies = async (commentId: number) => {
    const isExpanded = expandedComments.has(commentId);
    
    if (isExpanded) {
      const newExpanded = new Set(expandedComments);
      newExpanded.delete(commentId);
      setExpandedComments(newExpanded);
    } else {
      const newExpanded = new Set(expandedComments);
      newExpanded.add(commentId);
      setExpandedComments(newExpanded);
      
      if (!replies[commentId]) {
        await fetchReplies(commentId);
      }
    }
  };

  const handleReplySubmit = async (commentId: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replyTexts[commentId]?.trim()) return;

    setSubmittingReply(commentId);
    try {
      const response = await fetch(`/api/comments/${commentId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: replyTexts[commentId] }),
      });

      if (response.ok) {
        setReplyTexts(prev => ({ ...prev, [commentId]: "" }));
        await fetchReplies(commentId);
        await fetchComments();
      }
    } catch (error) {
      console.error("Error posting reply:", error);
    } finally {
      setSubmittingReply(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Comments</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{newsTitle}</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {comment.full_name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {comment.full_name || "Anonymous"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{comment.comment}</p>
                      
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className={`flex items-center gap-1 text-sm transition-all ${
                            comment.user_liked
                              ? "text-red-500"
                              : "text-gray-500 hover:text-red-500"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${comment.user_liked ? "fill-current" : ""}`} />
                          <span>{comment.likes_count}</span>
                        </button>

                        <button
                          onClick={() => toggleReplies(comment.id)}
                          className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-all"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}</span>
                          {expandedComments.has(comment.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {expandedComments.has(comment.id) && (
                    <div className="ml-13 space-y-3 border-l-2 border-gray-200 pl-4">
                      {replies[comment.id]?.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                            {reply.full_name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm text-gray-900">
                                {reply.full_name || "Anonymous"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(reply.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{reply.reply}</p>
                          </div>
                        </div>
                      ))}

                      {user && (
                        <form onSubmit={(e) => handleReplySubmit(comment.id, e)} className="flex gap-2">
                          <input
                            type="text"
                            value={replyTexts[comment.id] || ""}
                            onChange={(e) => setReplyTexts(prev => ({ ...prev, [comment.id]: e.target.value }))}
                            placeholder="Write a reply..."
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={submittingReply === comment.id}
                          />
                          <button
                            type="submit"
                            disabled={!replyTexts[comment.id]?.trim() || submittingReply === comment.id}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {user && (
          <form onSubmit={handleSubmit} className="p-6 border-t border-gray-200">
            <div className="flex gap-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Post</span>
              </button>
            </div>
          </form>
        )}

        {!user && (
          <div className="p-6 border-t border-gray-200 text-center">
            <p className="text-gray-600">Please sign in to comment</p>
          </div>
        )}
      </div>
    </div>
  );
}
