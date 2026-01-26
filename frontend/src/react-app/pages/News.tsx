import { useEffect, useState } from "react";
import { useAuth } from "@getmocha/users-service/react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import NewsCard from "@/react-app/components/NewsCard";
import CommentModal from "@/react-app/components/CommentModal";
import CreateNewsModal from "@/react-app/components/CreateNewsModal";
import ReportModal from "@/react-app/components/ReportModal";
import { Newspaper, Check, Plus, Sparkles } from "lucide-react";
import EditNewsModal from "@/react-app/components/EditNewsModal";
import DeleteConfirmModal from "@/react-app/components/DeleteConfirmModal";
import type { NewsWithCounts } from "@/shared/types";
import { shuffleArray } from "@/shared/utils";

/* =========================
   Constants
========================= */
const CATEGORIES = [
  "All",
  "Technology",
  "Healthcare",
  "Industry",
  "Events",
  "Research",
];

/* =========================
   Component
========================= */
export default function News() {
  const { user } = useAuth();

  const [news, setNews] = useState<NewsWithCounts[]>([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedTitle, setSelectedTitle] = useState("");

  const [toast, setToast] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportId, setReportId] = useState<number | null>(null);
  const [reportTitle, setReportTitle] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);
  const [fetchingAdmin, setFetchingAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingNews, setEditingNews] = useState<NewsWithCounts | null>(null);
  const [deletingNewsId, setDeletingNewsId] = useState<number | string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* =========================
     Effects
  ========================= */
  useEffect(() => {
    if (user) {
      checkAdmin();
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const res = await fetch("/api/users/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const userId = data.profile?.user_id || data.user_id || (user as any)?.user_id || (user as any)?.id;
        setCurrentUserId(userId);
        console.log("Current user ID:", userId);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [category]);

  /* =========================
     Data
  ========================= */
  const fetchNews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category && category !== "All") params.append("category", category);

      const res = await fetch(`/api/news?${params.toString()}`);
      const data = await res.json();
      setNews(shuffleArray(Array.isArray(data) ? data : []));
    } catch {
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const checkAdmin = async () => {
    try {
      const res = await fetch("/api/check-admin");
      const data = await res.json();
      setIsAdmin(!!data.is_admin);
    } catch {
      setIsAdmin(false);
    }
  };

  /* =========================
     Helpers
  ========================= */
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  /* =========================
     Actions
  ========================= */
  const likeNews = async (id: number) => {
    if (!user) return alert("Please sign in to like posts");
    if (!id) {
      console.error('Cannot like: news ID is undefined');
      return;
    }
    try {
      await fetch(`/api/news/${id}/like`, { 
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
      console.error('Error liking news:', error);
    }
  };

  const commentNews = (id: number) => {
    if (!user) return alert("Please sign in to comment");
    const item = news.find((n) => n.id === id);
    if (!item) return;
    setSelectedId(id);
    setSelectedTitle(item.title);
  };

  const saveNews = async (id: number) => {
    if (!user) return alert("Please sign in to save posts");
    try {
      const res = await fetch(`/api/news/${id}/save`, { method: "POST" });
      const data = await res.json();
      showToast(data.saved ? "Post saved!" : "Post unsaved");
    } catch {}
  };

  const followUser = async (userId: string) => {
    if (!user) return alert("Please sign in to follow users");
    try {
      await fetch(`/api/users/${userId}/follow`, { method: "POST" });
      fetchNews();
    } catch {}
  };

  const reportNews = (id: number) => {
    if (!user) return alert("Please sign in to report posts");
    const item = news.find((n) => n.id === id);
    if (!item) return;
    setReportId(id);
    setReportTitle(item.title);
    setShowReport(true);
  };

  const notInterested = (id: number) => {
    setNews((prev) => prev.filter((n) => n.id !== id));
    showToast("We'll show you less posts like this");
  };

  const fetchAdminNews = async () => {
    if (!isAdmin) return;
    setFetchingAdmin(true);
    try {
      const res = await fetch("/api/admin/content/fetch", { method: "POST" });
      const data = await res.json();
      showToast(`Fetched ${data.items_fetched || 0} items`);
      fetchNews();
    } catch {
      showToast("Failed to fetch news");
    } finally {
      setFetchingAdmin(false);
    }
  };

  const handleEdit = (newsItem: NewsWithCounts) => {
    setEditingNews(newsItem);
  };

  const handleDelete = async (newsId: number | string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/news/${newsId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setNews(news.filter(n => n.id !== newsId));
        setDeletingNewsId(null);
        showToast("News post deleted successfully");
      } else {
        const data = await response.json();
        showToast(data.error || "Failed to delete news post");
      }
    } catch (error) {
      console.error("Error deleting news:", error);
      showToast("Failed to delete news post");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    fetchNews();
    setEditingNews(null);
    showToast("News post updated successfully");
  };

  /* =========================
     Render
  ========================= */
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto mb-20 lg:mb-0">
        {/* Header */}
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Industry News</h1>
            <p className="text-gray-600">
              Stay updated on medical technology trends
            </p>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <button
                onClick={fetchAdminNews}
                disabled={fetchingAdmin}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {fetchingAdmin ? "Fetching..." : "Fetch News"}
              </button>
            )}
            {user && (
              <button
                onClick={() => setShowCreate(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Post
              </button>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white p-6 rounded-2xl shadow mb-6 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-lg ${
                category === c || (!category && c === "All")
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div>Loading news...</div>
        ) : news.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow text-center">
            <Newspaper className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            No news available
          </div>
        ) : (
          <div className="space-y-6">
            {news.map((item) => {
              const isOwner = !!(currentUserId && item.posted_by_user_id && String(currentUserId) === String(item.posted_by_user_id));
              if (item.posted_by_user_id) {
                console.log("News item:", {
                  id: item.id,
                  posted_by_user_id: item.posted_by_user_id,
                  currentUserId,
                  isOwner
                });
              }
              return (
                <NewsCard
                  key={item.id}
                  news={item}
                  onLike={likeNews}
                  onComment={commentNews}
                  onSave={saveNews}
                  onFollow={followUser}
                  onReport={reportNews}
                  onNotInterested={notInterested}
                  onEdit={isOwner ? () => handleEdit(item) : undefined}
                  onDelete={isOwner ? () => setDeletingNewsId(item.id) : undefined}
                  showEditDelete={isOwner}
                />
              );
            })}
          </div>
        )}

        {/* Modals */}
        {selectedId && (
          <CommentModal
            newsId={selectedId}
            newsTitle={selectedTitle}
            isOpen={true}
            onClose={() => {
              setSelectedId(null);
              setSelectedTitle("");
              fetchNews();
            }}
          />
        )}

        <CreateNewsModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          onSuccess={fetchNews}
        />

        {reportId && (
          <ReportModal
            newsId={reportId}
            newsTitle={reportTitle}
            isOpen={showReport}
            onClose={() => {
              setShowReport(false);
              setReportId(null);
              setReportTitle("");
            }}
            onSuccess={() => showToast("Report submitted successfully")}
          />
        )}

        {toast && (
          <div className="fixed bottom-24 lg:bottom-8 right-8 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 z-50">
            <Check className="w-5 h-5" />
            {toast}
          </div>
        )}

        {editingNews && (
          <EditNewsModal
            post={editingNews}
            isOpen={!!editingNews}
            onClose={() => setEditingNews(null)}
            onSuccess={handleEditSuccess}
          />
        )}

        <DeleteConfirmModal
          isOpen={deletingNewsId !== null}
          onClose={() => {
            if (!isDeleting) {
              setDeletingNewsId(null);
            }
          }}
          onConfirm={async () => {
            if (deletingNewsId) {
              await handleDelete(deletingNewsId);
            }
          }}
          title="Delete News Post"
          message="Are you sure you want to delete this news post? This action cannot be undone."
          itemName={news.find(n => n.id === deletingNewsId)?.title}
          isDeleting={isDeleting}
        />
      </div>
    </DashboardLayout>
  );
}
