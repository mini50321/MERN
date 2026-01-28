import { useState, useEffect } from "react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import NewsCard from "@/react-app/components/NewsCard";
import CommentModal from "@/react-app/components/CommentModal";
import EditNewsModal from "@/react-app/components/EditNewsModal";
import { FileText, Trash2, Edit2, Check } from "lucide-react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import type { NewsWithCounts } from "@/shared/types";

export default function MyPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<NewsWithCounts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNewsId, setSelectedNewsId] = useState<number | null>(null);
  const [selectedNewsTitle, setSelectedNewsTitle] = useState("");
  const [editingPost, setEditingPost] = useState<NewsWithCounts | null>(null);
  const [showActionToast, setShowActionToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (user) {
      fetchMyPosts();
    }
  }, [user]);

  const fetchMyPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/news/my-posts");
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setShowActionToast(true);
    setTimeout(() => setShowActionToast(false), 3000);
  };

  const handleDelete = async (newsId: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetch(`/api/news/${newsId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPosts(posts.filter(p => p.id !== newsId));
        showToast("Post deleted successfully");
      } else {
        showToast("Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      showToast("Failed to delete post");
    }
  };

  const handleEdit = (post: NewsWithCounts) => {
    setEditingPost(post);
  };

  const handleEditSuccess = () => {
    fetchMyPosts();
    showToast("Post updated successfully");
  };

  const handleComment = (newsId: number) => {
    const post = posts.find(p => p.id === newsId);
    if (post) {
      setSelectedNewsId(newsId);
      setSelectedNewsTitle(post.title);
    }
  };

  const handleCloseComments = () => {
    setSelectedNewsId(null);
    setSelectedNewsTitle("");
    fetchMyPosts();
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto mb-20 lg:mb-0">
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view your posts</h3>
            <p className="text-gray-600">You need to be signed in to see your posts</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto mb-20 lg:mb-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Posts</h1>
          <p className="text-gray-600">Manage your published posts</p>
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
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600">Create your first post to see it here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="relative">
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <button
                    onClick={() => handleEdit(post)}
                    className="p-2 bg-white rounded-lg shadow-md hover:bg-blue-50 text-blue-600 transition-all"
                    title="Edit post"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-2 bg-white rounded-lg shadow-md hover:bg-red-50 text-red-600 transition-all"
                    title="Delete post"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <NewsCard
                  news={post}
                  onLike={() => {}}
                  onComment={handleComment}
                  onSave={() => {}}
                  onFollow={() => {}}
                  onReport={() => {}}
                  onNotInterested={() => {}}
                />
              </div>
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

        {editingPost && (
          <EditNewsModal
            post={editingPost}
            isOpen={!!editingPost}
            onClose={() => setEditingPost(null)}
            onSuccess={handleEditSuccess}
          />
        )}

        {showActionToast && (
          <div className="fixed bottom-24 lg:bottom-8 right-8 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up z-50">
            <Check className="w-5 h-5" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
