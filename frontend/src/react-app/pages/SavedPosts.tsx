import { useState, useEffect } from "react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import NewsCard from "@/react-app/components/NewsCard";
import CommentModal from "@/react-app/components/CommentModal";
import ReportModal from "@/react-app/components/ReportModal";
import { Bookmark, Check } from "lucide-react";
import { useAuth } from "@getmocha/users-service/react";
import type { NewsWithCounts } from "@/shared/types";

export default function SavedPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<NewsWithCounts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNewsId, setSelectedNewsId] = useState<number | null>(null);
  const [selectedNewsTitle, setSelectedNewsTitle] = useState("");
  const [showActionToast, setShowActionToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportNewsId, setReportNewsId] = useState<number | null>(null);
  const [reportNewsTitle, setReportNewsTitle] = useState("");

  useEffect(() => {
    if (user) {
      fetchSavedPosts();
    }
  }, [user]);

  const fetchSavedPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/news/saved");
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("Error fetching saved posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setShowActionToast(true);
    setTimeout(() => setShowActionToast(false), 3000);
  };

  const handleLike = async (newsId: number) => {
    try {
      await fetch(`/api/news/${newsId}/like`, {
        method: "POST",
      });
      fetchSavedPosts();
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleComment = (newsId: number) => {
    const post = posts.find(p => p.id === newsId);
    if (post) {
      setSelectedNewsId(newsId);
      setSelectedNewsTitle(post.title);
    }
  };

  

  const handleSave = async (newsId: number) => {
    try {
      const response = await fetch(`/api/news/${newsId}/save`, {
        method: "POST",
      });
      const data = await response.json();
      if (!data.saved) {
        setPosts(posts.filter(p => p.id !== newsId));
        showToast("Post removed from saved");
      }
    } catch (error) {
      console.error("Error unsaving post:", error);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
      });
      fetchSavedPosts();
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const handleReport = (newsId: number) => {
    const newsItem = posts.find(n => n.id === newsId);
    if (newsItem) {
      setReportNewsId(newsId);
      setReportNewsTitle(newsItem.title);
      setShowReportModal(true);
    }
  };

  const handleNotInterested = async (newsId: number) => {
    setPosts(posts.filter(item => item.id !== newsId));
    showToast("We'll show you less posts like this");
  };

  const handleCloseComments = () => {
    setSelectedNewsId(null);
    setSelectedNewsTitle("");
    fetchSavedPosts();
  };

  const handleReportSuccess = () => {
    showToast("Report submitted successfully!");
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto mb-20 lg:mb-0">
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view saved posts</h3>
            <p className="text-gray-600">You need to be signed in to see your saved posts</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto mb-20 lg:mb-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Posts</h1>
          <p className="text-gray-600">Posts you've bookmarked for later</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
                <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved posts</h3>
            <p className="text-gray-600">Posts you save will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <NewsCard
                key={post.id}
                news={post}
                onLike={handleLike}
                onComment={handleComment}
                onSave={handleSave}
                onFollow={handleFollow}
                onReport={handleReport}
                onNotInterested={handleNotInterested}
              />
            ))}
          </div>
        )}

        {selectedNewsId && (
          <CommentModal
            newsId={selectedNewsId}
            newsTitle={selectedNewsTitle}
            isOpen={!!selectedNewsId}
            onClose={handleCloseComments}
          />
        )}

        {showActionToast && (
          <div className="fixed bottom-24 lg:bottom-8 right-8 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up z-50">
            <Check className="w-5 h-5" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        {reportNewsId && (
          <ReportModal
            newsId={reportNewsId}
            newsTitle={reportNewsTitle}
            isOpen={showReportModal}
            onClose={() => {
              setShowReportModal(false);
              setReportNewsId(null);
              setReportNewsTitle("");
            }}
            onSuccess={handleReportSuccess}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
