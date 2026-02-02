import { useState, useEffect } from "react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { 
  Search, 
  UserPlus, 
  UserCheck,
  Users,
  Shield,
  Award,
  MapPin,
  X,
  MoreHorizontal,
  Ban,
  MessageCircle,
  Send
} from "lucide-react";
import { shuffleArray } from "@/shared/utils";
import { useNavigate } from "react-router";

interface UserProfile {
  user_id: string;
  full_name: string;
  last_name: string;
  specialisation: string;
  bio: string;
  location: string;
  profile_picture_url: string;
  is_verified: number;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  follows_me: boolean;
  request_sent?: boolean;
  request_received?: boolean;
  profession?: string;
  account_type?: string;
}

const PROFESSION_LABELS: Record<string, string> = {
  "Nursing Professional": "Nurse",
  "Physiotherapy Professional": "Physiotherapy",
  "Ambulance Provider": "Ambulance",
};

const PROFESSION_COLORS: Record<string, string> = {
  "biomedical_engineer": "bg-blue-100 text-blue-700",
  "Nursing Professional": "bg-pink-100 text-pink-700",
  "Physiotherapy Professional": "bg-green-100 text-green-700",
  "Ambulance Provider": "bg-red-100 text-red-700",
  "company": "bg-purple-100 text-purple-700",
};

const getBiomedicalLabel = (accountType?: string): string => {
  switch (accountType) {
    case "business":
      return "Company";
    case "freelancer":
      return "Biomedical Freelancer";
    case "individual":
    default:
      return "Biomedical Engineer";
  }
};

const getProfessionLabel = (profession?: string, accountType?: string): string => {
  if (profession === "biomedical_engineer") {
    return getBiomedicalLabel(accountType);
  }
  return PROFESSION_LABELS[profession || ""] || profession || "";
};

const getProfessionColor = (profession?: string, accountType?: string): string => {
  if (profession === "biomedical_engineer" && accountType === "business") {
    return PROFESSION_COLORS["company"];
  }
  return PROFESSION_COLORS[profession || ""] || "bg-gray-100 text-gray-700";
};

interface ConnectionRequest {
  id: number;
  sender_user_id: string;
  full_name: string;
  last_name: string;
  profile_picture_url: string;
  specialisation: string;
  location: string;
  followers_count: number;
  following_count: number;
  created_at: string;
}

export default function CConnect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"discover" | "followers" | "following" | "requests" | "blocked">("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [professionFilter, setProfessionFilter] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [blocked, setBlocked] = useState<any[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, pending_requests: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchData();
    }
  }, [user, activeTab, searchQuery, professionFilter]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/connect/stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "discover") {
        const response = await fetch(`/api/connect/users?search=${searchQuery}&profession=${professionFilter}`);
        const data = await response.json();
        setUsers(shuffleArray(data as UserProfile[]));
      } else if (activeTab === "followers") {
        const response = await fetch("/api/connect/followers");
        const data = await response.json();
        setFollowers(shuffleArray(data as UserProfile[]));
      } else if (activeTab === "following") {
        const response = await fetch("/api/connect/following");
        const data = await response.json();
        setFollowing(shuffleArray(data as UserProfile[]));
      } else if (activeTab === "requests") {
        const response = await fetch("/api/connect/requests");
        const data = await response.json();
        setRequests(data);
      } else if (activeTab === "blocked") {
        const response = await fetch("/api/connect/blocked");
        const data = await response.json();
        setBlocked(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      await fetch(`/api/connect/follow/${userId}`, {
        method: "POST",
      });
      await fetchData();
      await fetchStats();
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const handleBlock = async (userId: string) => {
    if (!confirm("Are you sure you want to block this user?")) return;
    
    try {
      await fetch(`/api/connect/block/${userId}`, {
        method: "POST",
      });
      setSelectedUser(null);
      await fetchData();
      await fetchStats();
    } catch (error) {
      console.error("Error blocking user:", error);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await fetch(`/api/connect/unblock/${userId}`, {
        method: "POST",
      });
      await fetchData();
    } catch (error) {
      console.error("Error unblocking user:", error);
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      const response = await fetch(`/api/connect/request/${requestId}/accept`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Failed to accept request");
        return;
      }
      await fetchData();
      await fetchStats();
    } catch (error) {
      console.error("Error accepting request:", error);
      alert("Failed to accept request");
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      const response = await fetch(`/api/connect/request/${requestId}/reject`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Failed to reject request");
        return;
      }
      setRequests(prev => prev.filter(r => r.id !== requestId));
      await fetchStats();
      await fetchData();
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request");
    }
  };

  const handleSendConnectionRequest = async (userId: string) => {
    try {
      const response = await fetch(`/api/connect/request/${userId}`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Failed to send connection request");
        return;
      }
      await fetchData();
      await fetchStats();
    } catch (error) {
      console.error("Error sending connection request:", error);
      alert("Failed to send connection request");
    }
  };

  const UserCard = ({ profile, showActions = true }: { profile: UserProfile; showActions?: boolean }) => (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 relative">
      <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className="relative flex-shrink-0">
          {profile.profile_picture_url ? (
            <img
              src={profile.profile_picture_url}
              alt={profile.full_name}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold">
              {profile.full_name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          {profile.is_verified === 1 && (
            <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1">
              <Award className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 break-words">
              {profile.full_name} {profile.last_name}
            </h3>
            {profile.profession && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${getProfessionColor(profile.profession, profile.account_type)}`}>
                {getProfessionLabel(profile.profession, profile.account_type)}
              </span>
            )}
            {profile.follows_me && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex-shrink-0">Follows you</span>
            )}
          </div>
          {profile.specialisation && (
            <p className="text-xs sm:text-sm text-gray-600 mb-2 break-words">{profile.specialisation}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
            {profile.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="break-words">{profile.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 sm:gap-3">
              <span><strong>{profile.followers_count}</strong> followers</span>
              <span><strong>{profile.following_count}</strong> following</span>
            </div>
          </div>
        </div>
        {showActions && (
          <button
            onClick={() => setSelectedUser(profile)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
        )}
      </div>

      {profile.bio && (
        <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4 line-clamp-2 break-words">{profile.bio}</p>
      )}

      {showActions && (
        <div className="flex gap-2">
          {profile.is_following && profile.follows_me ? (
            <>
              <button
                onClick={() => navigate(`/direct-message/${profile.user_id}`)}
                className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-md transition-all font-medium text-xs sm:text-sm"
              >
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Message</span>
              </button>
              <button
                onClick={() => handleFollow(profile.user_id)}
                className="px-3 sm:px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium"
              >
                <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </>
          ) : profile.is_following ? (
            <button
              onClick={() => handleFollow(profile.user_id)}
              className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium text-xs sm:text-sm"
            >
              <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>Following</span>
            </button>
          ) : profile.request_sent ? (
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 border-2 border-gray-300 text-gray-500 rounded-lg font-medium text-xs sm:text-sm cursor-not-allowed"
            >
              <Send className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>Request Sent</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => handleFollow(profile.user_id)}
                className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-md transition-all font-medium text-xs sm:text-sm"
              >
                <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Follow</span>
              </button>
              <button
                onClick={() => handleSendConnectionRequest(profile.user_id)}
                className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-md transition-all font-medium text-xs sm:text-sm"
              >
                <Send className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Connect</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto mb-20 lg:mb-0 p-3 sm:p-6">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">C-Connect</h1>
          <p className="text-gray-600 text-xs sm:text-base">Connect with healthcare professionals worldwide</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-6">
            <div className="text-center">
              <p className="text-xl sm:text-3xl font-bold text-blue-600">{stats.followers}</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-3xl font-bold text-indigo-600">{stats.following}</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Following</p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-3xl font-bold text-purple-600">{stats.pending_requests}</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Requests</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab("discover")}
            className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all whitespace-nowrap text-xs sm:text-base ${
              activeTab === "discover"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-50 shadow"
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => setActiveTab("followers")}
            className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all whitespace-nowrap text-xs sm:text-base ${
              activeTab === "followers"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-50 shadow"
            }`}
          >
            <span className="hidden sm:inline">Followers ({stats.followers})</span>
            <span className="sm:hidden">Followers</span>
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all whitespace-nowrap text-xs sm:text-base ${
              activeTab === "following"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-50 shadow"
            }`}
          >
            <span className="hidden sm:inline">Following ({stats.following})</span>
            <span className="sm:hidden">Following</span>
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`relative px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all whitespace-nowrap text-xs sm:text-base ${
              activeTab === "requests"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-50 shadow"
            }`}
          >
            Requests
            {stats.pending_requests > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {stats.pending_requests}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("blocked")}
            className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all whitespace-nowrap text-xs sm:text-base ${
              activeTab === "blocked"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-50 shadow"
            }`}
          >
            Blocked
          </button>
        </div>

        {activeTab === "discover" && (
          <>
            <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-6 mb-4 sm:mb-6">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    placeholder="Search professionals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
                <select
                  value={professionFilter}
                  onChange={(e) => setProfessionFilter(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm sm:text-base"
                >
                  <option value="">All Professions</option>
                  <option value="biomedical_engineer">Biomedical</option>
                  <option value="Nursing Professional">Nurse</option>
                  <option value="Physiotherapy Professional">Physiotherapy</option>
                  <option value="Ambulance Provider">Ambulance</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-600">Try adjusting your search</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {users.map((profile) => (
                  <UserCard key={profile.user_id} profile={profile} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "followers" && (
          <div>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : followers.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No followers yet</h3>
                <p className="text-gray-600">Share your profile to get followers</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {followers.map((profile) => (
                  <UserCard key={profile.user_id} profile={profile} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "following" && (
          <div>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : following.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Not following anyone yet</h3>
                <p className="text-gray-600">Discover engineers to follow</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {following.map((profile) => (
                  <UserCard key={profile.user_id} profile={profile} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "requests" && (
          <div>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
                <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending requests</h3>
                <p className="text-gray-600">You'll see connection requests here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="bg-white rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {request.profile_picture_url ? (
                          <img
                            src={request.profile_picture_url}
                            alt={request.full_name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                            {request.full_name?.[0]?.toUpperCase() || "U"}
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {request.full_name} {request.last_name}
                          </h3>
                          {request.specialisation && (
                            <p className="text-sm text-gray-600">{request.specialisation}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span><strong>{request.followers_count}</strong> followers</span>
                            <span><strong>{request.following_count}</strong> following</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-md transition-all font-medium"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "blocked" && (
          <div>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : blocked.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No blocked users</h3>
                <p className="text-gray-600">Users you block will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {blocked.map((user) => (
                  <div key={user.user_id || user.blocked_user_id} className="bg-white rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {user.profile_picture_url ? (
                          <img
                            src={user.profile_picture_url}
                            alt={user.full_name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                            {user.full_name?.[0]?.toUpperCase() || "U"}
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {user.full_name} {user.last_name}
                          </h3>
                          {user.specialisation && (
                            <p className="text-sm text-gray-600">{user.specialisation}</p>
                          )}
                          {user.location && (
                            <p className="text-xs text-gray-500 mt-1">{user.location}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnblock(user.user_id || user.blocked_user_id)}
                        className="px-6 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-all font-medium"
                      >
                        Unblock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Options</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => handleBlock(selectedUser.user_id)}
                  className="w-full px-4 py-3 text-left hover:bg-red-50 rounded-lg flex items-center gap-3 text-red-600 font-medium transition-colors"
                >
                  <Ban className="w-5 h-5" />
                  <span>Block User</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
