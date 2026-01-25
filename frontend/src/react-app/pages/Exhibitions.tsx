import { useState, useEffect } from "react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import ExhibitionCard from "@/react-app/components/ExhibitionCard";
import CreateExhibitionModal from "@/react-app/components/CreateExhibitionModal";
import ExhibitionCommentModal from "@/react-app/components/ExhibitionCommentModal";
import EditExhibitionModal from "@/react-app/components/EditExhibitionModal";
import { Calendar, Check, Plus, Sparkles } from "lucide-react";
import { useAuth } from "@getmocha/users-service/react";
import type { ExhibitionWithCounts } from "@/shared/exhibition-types";

export default function Exhibitions() {
  const { user } = useAuth();
  const [exhibitions, setExhibitions] = useState<ExhibitionWithCounts[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showActionToast, setShowActionToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExhibitionId, setSelectedExhibitionId] = useState<number | null>(null);
  const [selectedExhibitionTitle, setSelectedExhibitionTitle] = useState("");
  const [editingExhibition, setEditingExhibition] = useState<ExhibitionWithCounts | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const categories = ["All", "Conference", "Trade Show", "Symposium", "Workshop", "Seminar", "Exhibition", "Other"];

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      
      try {
        const res = await fetch("/api/check-admin", { credentials: "include" });
        const data = await res.json();
        setIsAdmin(data.is_admin);
      } catch (error) {
        console.error("Error checking admin:", error);
      }
    };

    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const res = await fetch("/api/users/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const userId = data.profile?.user_id || data.user_id || (user as any).user_id || (user as any).id;
          setCurrentUserId(userId);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    checkAdmin();
    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    fetchExhibitions();
  }, [selectedCategory]);

  const fetchExhibitions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "All") {
        params.append("category", selectedCategory);
      }
      
      const response = await fetch(`/api/exhibitions?${params}`, {
        credentials: "include"
      });
      const data = await response.json();
      setExhibitions(data);
      
      if (currentUserId && data.length > 0) {
        console.log("Current user ID:", currentUserId);
        console.log("First exhibition posted_by_user_id:", data[0]?.posted_by_user_id);
        console.log("Match:", data[0]?.posted_by_user_id === currentUserId);
      }
    } catch (error) {
      console.error("Error fetching exhibitions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setShowActionToast(true);
    setTimeout(() => setShowActionToast(false), 3000);
  };

  const handleLike = async (exhibitionId: number) => {
    if (!user) {
      alert("Please sign in to like exhibitions");
      return;
    }

    try {
      const response = await fetch(`/api/exhibitions/${exhibitionId}/like`, {
        method: "POST",
        credentials: "include",
      });
      
      if (response.ok) {
        fetchExhibitions();
      } else {
        alert("Failed to like exhibition. Please try again.");
      }
    } catch (error) {
      console.error("Error liking exhibition:", error);
    }
  };

  const handleComment = (exhibitionId: number) => {
    if (!user) {
      alert("Please sign in to comment");
      return;
    }
    const exhibition = exhibitions.find(e => e.id === exhibitionId);
    if (exhibition) {
      setSelectedExhibitionId(exhibitionId);
      setSelectedExhibitionTitle(exhibition.title);
    }
  };

  const handleCloseComments = () => {
    setSelectedExhibitionId(null);
    setSelectedExhibitionTitle("");
    fetchExhibitions();
  };

  const handleSave = async (exhibitionId: number) => {
    if (!user) {
      alert("Please sign in to save exhibitions");
      return;
    }

    try {
      const response = await fetch(`/api/exhibitions/${exhibitionId}/save`, {
        method: "POST",
      });
      const data = await response.json();
      showToast(data.saved ? "Exhibition saved!" : "Exhibition unsaved");
      fetchExhibitions();
    } catch (error) {
      console.error("Error saving exhibition:", error);
    }
  };

  const handleReport = () => {
    if (!user) {
      alert("Please sign in to report exhibitions");
      return;
    }
    showToast("Report submitted successfully!");
  };

  const handleNotInterested = async (exhibitionId: number) => {
    if (!user) {
      alert("Please sign in");
      return;
    }

    setExhibitions(prevExhibitions => prevExhibitions.filter(item => item.id !== exhibitionId));
    showToast("We'll show you less exhibitions like this");
  };

  const handleEdit = (exhibition: ExhibitionWithCounts) => {
    setEditingExhibition(exhibition);
  };

  const handleDelete = async (exhibitionId: number) => {
    if (!window.confirm('Are you sure you want to delete this exhibition?')) {
      return;
    }

    try {
      const response = await fetch(`/api/exhibitions/${exhibitionId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setExhibitions(exhibitions.filter(e => e.id !== exhibitionId));
        showToast("Exhibition deleted successfully");
      } else {
        showToast("Failed to delete exhibition");
      }
    } catch (error) {
      console.error("Error deleting exhibition:", error);
      showToast("Failed to delete exhibition");
    }
  };

  const handleEditSuccess = () => {
    fetchExhibitions();
    setEditingExhibition(null);
    showToast("Exhibition updated successfully");
  };

  const handleCreateSuccess = () => {
    fetchExhibitions();
  };

  const handleFetchExhibitions = async () => {
    if (!isAdmin) return;
    
    setIsFetching(true);
    try {
      const res = await fetch("/api/admin/content/fetch-exhibitions", {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Successfully fetched ${data.items_fetched} exhibitions for review`);
        fetchExhibitions();
      } else {
        const errorData = await res.json();
        showToast(errorData.error || "Failed to fetch exhibitions");
      }
    } catch (error) {
      console.error("Error fetching exhibitions:", error);
      showToast("An error occurred while fetching exhibitions");
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto mb-20 lg:mb-0">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical Exhibitions</h1>
            <p className="text-gray-600">Discover upcoming medical technology events worldwide</p>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <button
                onClick={handleFetchExhibitions}
                disabled={isFetching}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetching ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Fetching...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Fetch Exhibitions</span>
                  </>
                )}
              </button>
            )}
            {user && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Exhibition</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === category || (category === "All" && !selectedCategory)
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
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
        ) : exhibitions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No exhibitions found</h3>
            <p className="text-gray-600">Check back later for upcoming events</p>
          </div>
        ) : (
          <div className="space-y-6">
            {exhibitions.map((exhibition) => (
              <ExhibitionCard
                key={exhibition.id}
                exhibition={exhibition}
                onLike={handleLike}
                onComment={handleComment}
                onSave={handleSave}
                onReport={handleReport}
                onNotInterested={handleNotInterested}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onResponseChange={fetchExhibitions}
                showEditDelete={(() => {
                  if (!currentUserId || !exhibition.posted_by_user_id) return false;
                  const userId = String(currentUserId);
                  const postedById = String(exhibition.posted_by_user_id);
                  return userId === postedById;
                })()}
              />
            ))}
          </div>
        )}

        {showActionToast && (
          <div className="fixed bottom-24 lg:bottom-8 right-8 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up z-50">
            <Check className="w-5 h-5" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        <CreateExhibitionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />

        {selectedExhibitionId && (
          <ExhibitionCommentModal
            exhibitionId={selectedExhibitionId}
            exhibitionTitle={selectedExhibitionTitle}
            isOpen={!!selectedExhibitionId}
            onClose={handleCloseComments}
          />
        )}

        {editingExhibition && (
          <EditExhibitionModal
            exhibition={editingExhibition}
            isOpen={!!editingExhibition}
            onClose={() => setEditingExhibition(null)}
            onSuccess={handleEditSuccess}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
