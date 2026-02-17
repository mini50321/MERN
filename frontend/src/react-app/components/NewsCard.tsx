import { useState, useRef, useEffect } from "react";
import { 
  Heart, 
  MessageCircle, 
  Send,
  MoreHorizontal,
  Bookmark,
  Link2,
  UserMinus,
  EyeOff,
  Flag,
  CheckCircle,
  Hash,
  Code
} from "lucide-react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import ShareModal from "@/react-app/components/ShareModal";
import type { NewsWithCounts } from "@/shared/types";

interface NewsCardProps {
  news: NewsWithCounts;
  onLike: (newsId: number) => void;
  onComment: (newsId: number) => void;
  onSave: (newsId: number) => void;
  onFollow: (userId: string) => void;
  onReport: (newsId: number) => void;
  onNotInterested: (newsId: number) => void;
  onEdit?: (news: NewsWithCounts) => void;
  onDelete?: (newsId: number | string) => void;
  showEditDelete?: boolean;
}

export default function NewsCard({ 
  news, 
  onLike, 
  onComment, 
  onSave,
  onFollow,
  onReport,
  onNotInterested,
  onEdit,
  onDelete,
  showEditDelete = false
}: NewsCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(news.user_liked);
  const [likesCount, setLikesCount] = useState(news.likes_count || 0);
  const [isSaved, setIsSaved] = useState(news.user_saved);
  const [isFollowing, setIsFollowing] = useState(news.user_following_author);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsLiked(news.user_liked);
    setLikesCount(news.likes_count || 0);
    setIsSaved(news.user_saved);
    setIsFollowing(news.user_following_author);
  }, [news.user_liked, news.likes_count, news.user_saved, news.user_following_author]);

  const handleLike = async () => {
    if (!news.id) {
      console.error('News item missing ID:', news);
      return;
    }
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);
    onLike(news.id);
  };

  const handleSave = async () => {
    setIsSaved(!isSaved);
    onSave(news.id);
  };

  const handleFollow = () => {
    if (news.posted_by_user_id) {
      setIsFollowing(!isFollowing);
      onFollow(news.posted_by_user_id);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/news/${news.id}`;
    navigator.clipboard.writeText(link);
    setShowMenu(false);
  };

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo`;
    return `${Math.floor(diffInSeconds / 31536000)}y`;
  };

  const parseHashtags = (text: string | null) => {
    if (!text) return [];
    return text.split(',').map(tag => tag.trim()).filter(tag => tag);
  };

  const hashtags = parseHashtags(news.hashtags);

  return (
    <div className="bg-white rounded-xl shadow hover:shadow-md transition-all duration-300 overflow-hidden">
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          {news.is_user_post === 1 && news.author_name ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {news.author_profile_picture_url ? (
                <img
                  src={news.author_profile_picture_url}
                  alt={news.author_name}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {news.author_name[0]?.toUpperCase() || "U"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-semibold text-sm text-gray-900 truncate">{news.author_name}</p>
                  {news.posted_by_user_id && (
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  )}
                  {user && news.posted_by_user_id && String(news.posted_by_user_id) !== String((user as any)?.user_id || (user as any)?.id) && (
                    <>
                      <span className="text-gray-400 text-xs">•</span>
                      <button
                        onClick={handleFollow}
                        className={`text-xs font-semibold transition-colors ${
                          isFollowing 
                            ? "text-gray-600 hover:text-gray-800" 
                            : "text-blue-600 hover:text-blue-700"
                        }`}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span>{news.category || "Community Member"}</span>
                  <span>•</span>
                  <span>{getRelativeTime(news.created_at)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-1">
              <span>{news.category || "News"}</span>
              <span>•</span>
              <span>{getRelativeTime(news.created_at)}</span>
            </div>
          )}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-600" />
            </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-56 z-50">
                  {showEditDelete && onEdit && (
                    <button
                      onClick={() => {
                        onEdit(news);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                    >
                      <Code className="w-4 h-4" />
                      <span className="text-xs font-medium">Edit Post</span>
                    </button>
                  )}
                  
                  {showEditDelete && onDelete && (
                    <button
                      onClick={() => {
                        onDelete(news.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
                    >
                      <Flag className="w-4 h-4" />
                      <span className="text-xs font-medium">Delete Post</span>
                    </button>
                  )}
                  
                  {showEditDelete && (onEdit || onDelete) && (
                    <div className="border-t border-gray-200 my-1"></div>
                  )}
                  
                  <button
                    onClick={handleSave}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                    <span className="text-xs font-medium">{isSaved ? "Unsave" : "Save"}</span>
                  </button>
                  
                  <button
                    onClick={handleCopyLink}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                  >
                    <Link2 className="w-4 h-4" />
                    <span className="text-xs font-medium">Copy link to post</span>
                  </button>
                  
                  {!showEditDelete && (
                    <button
                      onClick={() => {
                        onReport(news.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                    >
                      <Flag className="w-4 h-4" />
                      <span className="text-xs font-medium">Report post</span>
                    </button>
                  )}
                  
                  {user && news.posted_by_user_id !== user.id && !showEditDelete && (
                    <>
                      <div className="border-t border-gray-200 my-1"></div>
                      
                      {isFollowing && (
                        <button
                          onClick={() => {
                            handleFollow();
                            setShowMenu(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                        >
                          <UserMinus className="w-4 h-4" />
                          <span className="text-xs font-medium">Unfollow {news.author_name?.split(' ')[0]}</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          onNotInterested(news.id);
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                      >
                        <EyeOff className="w-4 h-4" />
                        <span className="text-xs font-medium">Not interested</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
        </div>

        <h3 className="text-base font-bold text-gray-900 mb-1.5 leading-snug">{news.title}</h3>
        <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap leading-relaxed">{news.content}</p>

        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {hashtags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-700 text-xs font-medium cursor-pointer"
              >
                <Hash className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {news.image_url && (
          <img
            src={news.image_url}
            alt={news.title}
            className="w-full rounded-lg mb-2 object-cover max-h-80"
          />
        )}

        <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
          {likesCount > 0 && (
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
              {likesCount}
            </span>
          )}
          {news.comments_count > 0 && (
            <span>{news.comments_count} {news.comments_count === 1 ? 'comment' : 'comments'}</span>
          )}
        </div>

        <div className="flex items-center justify-around pt-2 border-t border-gray-200">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-all text-xs font-medium ${
              isLiked
                ? "text-red-500 bg-red-50"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            <span>Like</span>
            <span>{likesCount}</span>
          </button>

          <button
            onClick={() => onComment(news.id)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-all text-xs font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Comment</span>
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-all text-xs font-medium"
          >
            <Send className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      <ShareModal
        newsId={news.id}
        newsTitle={news.title}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}
