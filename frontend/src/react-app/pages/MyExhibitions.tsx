import { useState, useEffect } from "react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import ExhibitionCard from "@/react-app/components/ExhibitionCard";
import ExhibitionCommentModal from "@/react-app/components/ExhibitionCommentModal";
import EditExhibitionModal from "@/react-app/components/EditExhibitionModal";
import { Calendar, Check } from "lucide-react";
import { useAuth } from "@getmocha/users-service/react";
import type { ExhibitionWithCounts } from "@/shared/exhibition-types";

export default function MyExhibitions() {
  const { user } = useAuth();
  const [exhibitions, setExhibitions] = useState<ExhibitionWithCounts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExhibitionId, setSelectedExhibitionId] = useState<number | null>(null);
  const [selectedExhibitionTitle, setSelectedExhibitionTitle] = useState("");
  const [editingExhibition, setEditingExhibition] = useState<ExhibitionWithCounts | null>(null);
  const [showActionToast, setShowActionToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (user) {
      fetchMyExhibitions();
    }
  }, [user]);

  const fetchMyExhibitions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/exhibitions/my-exhibitions");
      const data = await response.json();
      setExhibitions(data);
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

  const handleDelete = async (exhibitionId: number) => {
    try {
      const response = await fetch(`/api/exhibitions/${exhibitionId}`, {
        method: "DELETE",
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

  const handleEdit = (exhibition: ExhibitionWithCounts) => {
    setEditingExhibition(exhibition);
  };

  const handleEditSuccess = () => {
    fetchMyExhibitions();
    showToast("Exhibition updated successfully");
  };

  const handleComment = (exhibitionId: number) => {
    const exhibition = exhibitions.find(e => e.id === exhibitionId);
    if (exhibition) {
      setSelectedExhibitionId(exhibitionId);
      setSelectedExhibitionTitle(exhibition.title);
    }
  };

  const handleCloseComments = () => {
    setSelectedExhibitionId(null);
    setSelectedExhibitionTitle("");
    fetchMyExhibitions();
  };

  const handleLike = async (exhibitionId: number) => {
    try {
      await fetch(`/api/exhibitions/${exhibitionId}/like`, {
        method: "POST",
      });
      fetchMyExhibitions();
    } catch (error) {
      console.error("Error liking exhibition:", error);
    }
  };

  const handleSave = async (exhibitionId: number) => {
    try {
      const response = await fetch(`/api/exhibitions/${exhibitionId}/save`, {
        method: "POST",
      });
      const data = await response.json();
      showToast(data.saved ? "Exhibition saved!" : "Exhibition unsaved");
      fetchMyExhibitions();
    } catch (error) {
      console.error("Error saving exhibition:", error);
    }
  };

  const handleReport = () => {
    showToast("Report submitted successfully!");
  };

  const handleNotInterested = async (exhibitionId: number) => {
    setExhibitions(exhibitions.filter(item => item.id !== exhibitionId));
    showToast("We'll show you less exhibitions like this");
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto mb-20 lg:mb-0">
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view your exhibitions</h3>
            <p className="text-gray-600">You need to be signed in to see your exhibitions</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto mb-20 lg:mb-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Exhibitions</h1>
          <p className="text-gray-600">Manage your posted medical exhibitions</p>
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No exhibitions yet</h3>
            <p className="text-gray-600">Create your first exhibition to see it here</p>
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
                onResponseChange={fetchMyExhibitions}
                showEditDelete={true}
              />
            ))}
          </div>
        )}

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
