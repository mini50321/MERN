import { useState, useEffect } from "react";
import { X, Send, MessageCircle, Heart, Reply, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@getmocha/users-service/react";
import type { ExhibitionCommentWithCounts, ExhibitionCommentReply } from "@/shared/exhibition-types";

interface ExhibitionCommentModalProps {
  exhibitionId: number;
  exhibitionTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExhibitionCommentModal({ exhibitionId, exhibitionTitle, isOpen, onClose }: ExhibitionCommentModalProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<ExhibitionCommentWithCounts[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const [replies, setReplies] = useState<Record<number, ExhibitionCommentReply[]>>({});

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, exhibitionId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/exhibitions/${exhibitionId}/comments`);
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
      const response = await fetch(`/api/exhibitions/comments/${commentId}/replies`);
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
      const response = await fetch(`/api/exhibitions/${exhibitionId}/comment`, {
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

  const handleLike = async (commentId: number) => {
    if (!user) {
      alert("Please sign in to like comments");
      return;
    }

    try {
      await fetch(`/api/exhibitions/comments/${commentId}/like`, {
        method: "POST",
      });
      await fetchComments();
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  const handleReply = async (commentId: number) => {
    if (!replyText.trim() || !user) return;

    try {
      const response = await fetch(`/api/exhibitions/comments/${commentId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: replyText }),
      });

      if (response.ok) {
        setReplyText("");
        setReplyingTo(null);
        await fetchComments();
        await fetchReplies(commentId);
        setExpandedReplies(prev => new Set(prev).add(commentId));
      }
    } catch (error) {
      console.error("Error posting reply:", error);
    }
  };

  const toggleReplies = async (commentId: number) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
      if (!replies[commentId]) {
        await fetchReplies(commentId);
      }
    }
    setExpandedReplies(newExpanded);
  };

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
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
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{exhibitionTitle}</h3>
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
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  <div className="flex items-start gap-3">
                    {comment.profile_picture_url ? (
                      <img
                        src={comment.profile_picture_url}
                        alt={comment.full_name || "User"}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {comment.full_name?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {comment.full_name || "Anonymous"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {getRelativeTime(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{comment.comment}</p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <button
                          onClick={() => handleLike(comment.id)}
                          className={`flex items-center gap-1 transition-colors ${
                            comment.user_liked ? "text-red-500" : "text-gray-600 hover:text-red-500"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${comment.user_liked ? "fill-current" : ""}`} />
                          {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
                        </button>
                        
                        {user && (
                          <button
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors"
                          >
                            <Reply className="w-4 h-4" />
                            <span>Reply</span>
                          </button>
                        )}
                        
                        {comment.replies_count > 0 && (
                          <button
                            onClick={() => toggleReplies(comment.id)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            {expandedReplies.has(comment.id) ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                <span>Hide {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                <span>View {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {replyingTo === comment.id && user && (
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleReply(comment.id)}
                            disabled={!replyText.trim()}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Send
                          </button>
                        </div>
                      )}

                      {expandedReplies.has(comment.id) && replies[comment.id] && (
                        <div className="mt-3 ml-6 space-y-3 border-l-2 border-gray-200 pl-4">
                          {replies[comment.id].map((reply) => (
                            <div key={reply.id} className="flex items-start gap-2">
                              {reply.profile_picture_url ? (
                                <img
                                  src={reply.profile_picture_url}
                                  alt={reply.full_name || "User"}
                                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                  {reply.full_name?.[0]?.toUpperCase() || "U"}
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-sm text-gray-900">
                                    {reply.full_name || "Anonymous"}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {getRelativeTime(reply.created_at)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{reply.reply}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
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
