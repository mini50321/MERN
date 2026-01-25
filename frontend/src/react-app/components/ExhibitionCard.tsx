import { useState, useRef, useEffect } from "react";
import { 
  Heart, 
  MessageCircle, 
  Send,
  MoreHorizontal,
  Bookmark,
  Link2,
  Code,
  EyeOff,
  Flag,
  CheckCircle,
  Hash,
  Calendar,
  MapPin,
  Phone,
  Eye,
  CheckCheck,
  X as XIcon,
  Users,
  UserCheck,
  Map
} from "lucide-react";
import { useAuth } from "@getmocha/users-service/react";
import type { ExhibitionWithCounts } from "@/shared/exhibition-types";
import ExhibitionShareModal from "./ExhibitionShareModal";
import DeleteConfirmModal from "./DeleteConfirmModal";

interface ExhibitionCardProps {
  exhibition: ExhibitionWithCounts;
  onLike: (exhibitionId: number) => void;
  onComment: (exhibitionId: number) => void;
  onSave: (exhibitionId: number) => void;
  onReport: (exhibitionId: number) => void;
  onNotInterested: (exhibitionId: number) => void;
  onEdit?: (exhibition: ExhibitionWithCounts) => void;
  onDelete?: (exhibitionId: number) => void;
  onResponseChange?: () => void;
  showEditDelete?: boolean;
}

export default function ExhibitionCard({ 
  exhibition, 
  onLike, 
  onComment, 
  onSave,
  onReport,
  onNotInterested,
  onEdit,
  onDelete,
  onResponseChange,
  showEditDelete = false
}: ExhibitionCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(exhibition.user_liked);
  const [likesCount, setLikesCount] = useState(exhibition.likes_count);
  const [isSaved, setIsSaved] = useState(exhibition.user_saved);
  const [userResponse, setUserResponse] = useState(exhibition.user_response);
  const [goingCount, setGoingCount] = useState(exhibition.going_count || 0);
  const [notGoingCount, setNotGoingCount] = useState(exhibition.not_going_count || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

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
    if (!viewTracked && cardRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !viewTracked) {
              trackView();
              setViewTracked(true);
            }
          });
        },
        { threshold: 0.5 }
      );

      observer.observe(cardRef.current);

      return () => observer.disconnect();
    }
  }, [viewTracked]);

  const trackView = async () => {
    try {
      await fetch(`/api/exhibitions/${exhibition.id}/view`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };

  const handleResponse = async (responseType: 'going' | 'not_going') => {
    if (!user) {
      alert("Please sign in to respond");
      return;
    }

    const previousResponse = userResponse;
    const previousGoingCount = goingCount;
    const previousNotGoingCount = notGoingCount;

    if (userResponse === responseType) {
      setUserResponse(null);
      if (responseType === 'going') {
        setGoingCount(prev => Math.max(0, prev - 1));
      } else {
        setNotGoingCount(prev => Math.max(0, prev - 1));
      }
    } else {
      if (previousResponse === 'going') {
        setGoingCount(prev => Math.max(0, prev - 1));
      } else if (previousResponse === 'not_going') {
        setNotGoingCount(prev => Math.max(0, prev - 1));
      }
      
      setUserResponse(responseType);
      if (responseType === 'going') {
        setGoingCount(prev => prev + 1);
      } else {
        setNotGoingCount(prev => prev + 1);
      }
    }

    try {
      const response = await fetch(`/api/exhibitions/${exhibition.id}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ response_type: responseType }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update response');
      }
      
      if (onResponseChange) {
        onResponseChange();
      }
    } catch (error) {
      console.error("Error updating response:", error);
      setUserResponse(previousResponse);
      setGoingCount(previousGoingCount);
      setNotGoingCount(previousNotGoingCount);
    }
  };

  const handleLike = async () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);
    onLike(exhibition.id);
  };

  const handleSave = async () => {
    setIsSaved(!isSaved);
    onSave(exhibition.id);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/exhibitions/${exhibition.id}`;
    navigator.clipboard.writeText(link);
    setShowMenu(false);
  };

  const handleEmbedPost = () => {
    const embedCode = `<iframe src="${window.location.origin}/embed/exhibitions/${exhibition.id}" width="100%" height="400" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    setShowMenu(false);
  };

  const handleShare = async () => {
    setShowShareModal(true);
    try {
      await fetch(`/api/exhibitions/${exhibition.id}/share`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error sharing exhibition:", error);
    }
  };

  const handleCall = () => {
    if (exhibition.contact_number) {
      window.location.href = `tel:${exhibition.contact_number}`;
    }
  };

  const handleRegister = () => {
    const registrationUrl = (exhibition as any).registration_url || exhibition.website_url;
    if (registrationUrl) {
      window.open(registrationUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenMap = () => {
    const googleMapsUrl = (exhibition as any).google_maps_url;
    if (googleMapsUrl) {
      window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
    }
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

  const formatDate = (date: string | null) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const parseHashtags = (text: string | null) => {
    if (!text) return [];
    return text.split(',').map(tag => tag.trim()).filter(tag => tag);
  };

  const hashtags = parseHashtags(exhibition.hashtags);
  
  const venueName = (exhibition as any).venue_name;
  const city = (exhibition as any).city;
  const state = (exhibition as any).state;
  const country = (exhibition as any).country;
  const googleMapsUrl = (exhibition as any).google_maps_url;
  const registrationUrl = (exhibition as any).registration_url || exhibition.website_url;

  const getLocationString = () => {
    const parts = [];
    if (venueName) parts.push(venueName);
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (country) parts.push(country);
    return parts.join(", ");
  };

  return (
    <div ref={cardRef} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          {exhibition.is_user_post === 1 && exhibition.author_name ? (
            <div className="flex items-center gap-3 flex-1">
              {exhibition.author_profile_picture_url ? (
                <img
                  src={exhibition.author_profile_picture_url}
                  alt={exhibition.author_name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {exhibition.author_name[0]?.toUpperCase() || "U"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 truncate">{exhibition.author_name}</p>
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{exhibition.category || "Event Organizer"}</span>
                  <span>•</span>
                  <span>{getRelativeTime(exhibition.created_at)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1"></div>
          )}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-600" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-64 z-50">
                {showEditDelete && onEdit && (
                  <button
                    onClick={() => {
                      onEdit(exhibition);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                  >
                    <Code className="w-5 h-5" />
                    <span className="text-sm font-medium">Edit Exhibition</span>
                  </button>
                )}
                
                {showEditDelete && onDelete && (
                  <button
                    onClick={() => {
                      setShowDeleteModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-red-600"
                  >
                    <Flag className="w-5 h-5" />
                    <span className="text-sm font-medium">Delete Exhibition</span>
                  </button>
                )}
                
                <button
                  onClick={handleSave}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                >
                  <Bookmark className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
                  <span className="text-sm font-medium">{isSaved ? "Unsave" : "Save"}</span>
                </button>
                
                <button
                  onClick={handleCopyLink}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                >
                  <Link2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Copy link</span>
                </button>
                
                <button
                  onClick={handleEmbedPost}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                >
                  <Code className="w-5 h-5" />
                  <span className="text-sm font-medium">Embed</span>
                </button>
                
                {user && !showEditDelete && (
                  <>
                    <div className="border-t border-gray-200 my-2"></div>
                    
                    <button
                      onClick={() => {
                        onNotInterested(exhibition.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                    >
                      <EyeOff className="w-5 h-5" />
                      <span className="text-sm font-medium">Not interested</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        onReport(exhibition.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-red-600"
                    >
                      <Flag className="w-5 h-5" />
                      <span className="text-sm font-medium">Report</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-3">{exhibition.title}</h3>
        
        <div className="space-y-2 mb-4">
          {exhibition.event_start_date && (
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span className="font-medium">
                {formatDate(exhibition.event_start_date)}
                {exhibition.event_end_date && ` - ${formatDate(exhibition.event_end_date)}`}
              </span>
            </div>
          )}
          
          {getLocationString() && (
            <div className="flex items-start gap-2 text-gray-700">
              <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{getLocationString()}</span>
                {googleMapsUrl && (
                  <button
                    onClick={handleOpenMap}
                    className="ml-2 text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-1"
                  >
                    <Map className="w-3.5 h-3.5" />
                    View Map
                  </button>
                )}
              </div>
            </div>
          )}
          
          {exhibition.organizer_name && (
            <p className="text-sm text-gray-600">
              Organized by <span className="font-semibold">{exhibition.organizer_name}</span>
            </p>
          )}
        </div>

        {exhibition.description && (
          <p className="text-gray-700 mb-4 whitespace-pre-wrap">{exhibition.description}</p>
        )}

        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {hashtags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
              >
                <Hash className="w-3.5 h-3.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {exhibition.image_url && (
          <img
            src={exhibition.image_url}
            alt={exhibition.title}
            className="w-full rounded-xl mb-4 object-cover max-h-96"
          />
        )}

        {exhibition.attending_friends && exhibition.attending_friends.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">
                {exhibition.attending_friends.length === 1 
                  ? `${exhibition.attending_friends[0].full_name} is going` 
                  : `${exhibition.attending_friends[0].full_name} and ${exhibition.attending_friends.length - 1} other${exhibition.attending_friends.length > 2 ? 's' : ''} you follow ${exhibition.attending_friends.length === 2 ? 'is' : 'are'} going`}
              </span>
            </div>
            <div className="flex -space-x-2">
              {exhibition.attending_friends.slice(0, 5).map((friend, index) => (
                <div key={index} className="relative">
                  {friend.profile_picture_url ? (
                    <img
                      src={friend.profile_picture_url}
                      alt={friend.full_name}
                      className="w-8 h-8 rounded-full border-2 border-white object-cover"
                      title={friend.full_name}
                    />
                  ) : (
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold"
                      title={friend.full_name}
                    >
                      {friend.full_name[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {user && (
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => handleResponse('going')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                userResponse === 'going'
                  ? "bg-green-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <UserCheck className="w-5 h-5" />
              <span>Going</span>
              {goingCount > 0 && (
                <span className={`ml-1 text-sm font-semibold ${userResponse === 'going' ? 'text-white' : 'text-gray-600'}`}>
                  {goingCount}
                </span>
              )}
            </button>
            
            <button
              onClick={() => handleResponse('not_going')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                userResponse === 'not_going'
                  ? "bg-red-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <XIcon className="w-5 h-5" />
              <span>Not Going</span>
              {notGoingCount > 0 && (
                <span className={`ml-1 text-sm font-semibold ${userResponse === 'not_going' ? 'text-white' : 'text-gray-600'}`}>
                  {notGoingCount}
                </span>
              )}
            </button>
          </div>
        )}

        <div className="flex gap-3 mb-4">
          {registrationUrl && (
            <button
              onClick={handleRegister}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <CheckCheck className="w-5 h-5" />
              <span>Register</span>
            </button>
          )}
          
          {exhibition.contact_number && (
            <button
              onClick={handleCall}
              className={`px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 ${
                registrationUrl ? 'flex-shrink-0' : 'flex-1'
              }`}
            >
              <Phone className="w-5 h-5" />
              {!registrationUrl && <span>Call Now</span>}
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          {exhibition.views_count > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {exhibition.views_count} {exhibition.views_count === 1 ? 'view' : 'views'}
            </span>
          )}
          {likesCount > 0 && (
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              {likesCount}
            </span>
          )}
          {exhibition.comments_count > 0 && (
            <span>{exhibition.comments_count} {exhibition.comments_count === 1 ? 'comment' : 'comments'}</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              isLiked
                ? "text-red-500 bg-red-50"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
            <span className="font-medium text-sm">Like</span>
          </button>

          <button
            onClick={() => onComment(exhibition.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium text-sm">Comment</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
          >
            <Send className="w-5 h-5" />
            <span className="font-medium text-sm">Share</span>
          </button>
        </div>
      </div>

      <ExhibitionShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        exhibition={{
          id: exhibition.id,
          title: exhibition.title,
          description: exhibition.description,
        }}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          if (!isDeleting) {
            setShowDeleteModal(false);
          }
        }}
        onConfirm={async () => {
          if (!onDelete) return;
          setIsDeleting(true);
          try {
            await onDelete(exhibition.id);
            setShowDeleteModal(false);
          } catch (error) {
            console.error("Error deleting exhibition:", error);
          } finally {
            setIsDeleting(false);
          }
        }}
        title="Delete Exhibition"
        message="Are you sure you want to delete this exhibition? This action cannot be undone."
        itemName={exhibition.title}
        isDeleting={isDeleting}
      />
    </div>
  );
}
