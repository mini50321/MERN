import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@getmocha/users-service/react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { Search, Plus, Heart, Calendar, User, MoreHorizontal, Code, Flag } from "lucide-react";
import CreateFundraiserModal from "@/react-app/components/CreateFundraiserModal";
import EditFundraiserModal from "@/react-app/components/EditFundraiserModal";
import DeleteConfirmModal from "@/react-app/components/DeleteConfirmModal";
import { useRef } from "react";


interface Fundraiser {
  id: number | string;
  title: string;
  description: string;
  category: string;
  case_type: string;
  goal_amount: number;
  current_amount: number;
  currency: string;
  beneficiary_name: string;
  image_url: string | null;
  end_date: string | null;
  donations_count: number;
  progress_percentage: number;
  created_by_user_id?: string;
  status?: string;
  beneficiary_contact?: string | null;
  documents?: Array<{
    document_type: string;
    file_url: string;
    file_name: string;
  }>;
}


const CATEGORIES = [
  "Medical Emergency",
  "Disability Support",
  "Innovation/Invention",
  "Community Support",
  "Other",
];

const CASE_TYPES = [
  "Death",
  "Permanent Disability",
  "Medical Treatment",
  "New Invention",
  "Equipment Purchase",
  "Other",
];


export default function Fundraising() {
  const { user } = useAuth();

  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [caseType, setCaseType] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingFundraiser, setEditingFundraiser] = useState<Fundraiser | null>(null);
  const [deletingFundraiserId, setDeletingFundraiserId] = useState<number | string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenuForFundraiser, setShowMenuForFundraiser] = useState<number | string | null>(null);
  const menuRefs = useRef<Record<number | string, HTMLDivElement | null>>({});

 
  const fetchFundraisers = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (caseType) params.append("case_type", caseType);

      const res = await fetch(`/api/fundraisers?${params.toString()}`);
      const data = await res.json();
      setFundraisers(Array.isArray(data) ? data : []);
    } catch {
      setFundraisers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFundraisers();
    if (user) {
      fetchUserProfile();
    }
  }, [category, caseType, user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const res = await fetch("/api/users/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const userId = data.profile?.user_id || data.user_id || (user as any)?.user_id || (user as any)?.id;
        setCurrentUserId(userId);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenuForFundraiser !== null) {
        const menuElement = menuRefs.current[showMenuForFundraiser];
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setShowMenuForFundraiser(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenuForFundraiser]);

 
  const filteredFundraisers = useMemo(() => {
    const q = search.toLowerCase();
    return fundraisers.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.beneficiary_name.toLowerCase().includes(q)
    );
  }, [fundraisers, search]);


  const handleDonate = async (id: number | string) => {
    if (!user) {
      alert("Please sign in to donate");
      return;
    }

    const amount = prompt("Enter donation amount:");
    const value = Number(amount);

    if (!value || value <= 0) return;

    try {
      const res = await fetch(`/api/fundraisers/${id}/donate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: value, currency: "USD" }),
      });

      if (!res.ok) throw new Error();
      alert("Thank you for your donation!");
      fetchFundraisers();
    } catch {
      alert("Donation failed. Please try again.");
    }
  };

  const handleEdit = (fundraiser: Fundraiser) => {
    setEditingFundraiser(fundraiser);
    setShowMenuForFundraiser(null);
  };

  const handleDelete = async (fundraiserId: number | string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/fundraisers/${fundraiserId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setFundraisers(fundraisers.filter(f => f.id !== fundraiserId));
        setDeletingFundraiserId(null);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete fundraiser");
      }
    } catch (error) {
      console.error("Error deleting fundraiser:", error);
      alert("Failed to delete fundraiser");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    fetchFundraisers();
    setEditingFundraiser(null);
  };

  /* =========================
     Render
  ========================= */
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto mb-20 lg:mb-0">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fundraising</h1>
            <p className="text-gray-600">
              Support community members in need
            </p>
          </div>

          {user && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Fundraiser
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fundraisers..."
              className="w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-3 border rounded-xl"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select
            value={caseType}
            onChange={(e) => setCaseType(e.target.value)}
            className="px-4 py-3 border rounded-xl"
          >
            <option value="">All Case Types</option>
            {CASE_TYPES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">Loading fundraisers...</div>
        ) : filteredFundraisers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow">
            No fundraisers found
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFundraisers.map((f) => {
              const isOwner = currentUserId && f.created_by_user_id && String(currentUserId) === String(f.created_by_user_id);
              return (
              <div
                key={f.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden relative"
              >
                {f.image_url && (
                  <div className="relative">
                    <img
                      src={f.image_url}
                      alt={f.title}
                      className="w-full h-48 object-cover"
                    />
                    {isOwner && (
                      <div className="absolute top-3 right-3 z-10" ref={(el) => { menuRefs.current[f.id] = el; }}>
                        <button
                          onClick={() => setShowMenuForFundraiser(showMenuForFundraiser === f.id ? null : f.id)}
                          className="p-2 bg-white hover:bg-gray-100 rounded-lg shadow-md transition-colors"
                          title="Options"
                        >
                          <MoreHorizontal className="w-5 h-5 text-gray-600" />
                        </button>
                        {showMenuForFundraiser === f.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-64 z-50">
                            <button
                              onClick={() => handleEdit(f)}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                            >
                              <Code className="w-5 h-5" />
                              <span className="text-sm font-medium">Edit Fundraiser</span>
                            </button>
                            <button
                              onClick={() => {
                                setDeletingFundraiserId(f.id);
                                setShowMenuForFundraiser(null);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-red-600"
                            >
                              <Flag className="w-5 h-5" />
                              <span className="text-sm font-medium">Delete Fundraiser</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {!f.image_url && isOwner && (
                  <div className="absolute top-3 right-3 z-10" ref={(el) => { menuRefs.current[f.id] = el; }}>
                    <button
                      onClick={() => setShowMenuForFundraiser(showMenuForFundraiser === f.id ? null : f.id)}
                      className="p-2 bg-white hover:bg-gray-100 rounded-lg shadow-md transition-colors"
                      title="Options"
                    >
                      <MoreHorizontal className="w-5 h-5 text-gray-600" />
                    </button>
                    {showMenuForFundraiser === f.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-64 z-50">
                        <button
                          onClick={() => handleEdit(f)}
                          className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                        >
                          <Code className="w-5 h-5" />
                          <span className="text-sm font-medium">Edit Fundraiser</span>
                        </button>
                        <button
                          onClick={() => {
                            setDeletingFundraiserId(f.id);
                            setShowMenuForFundraiser(null);
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-red-600"
                        >
                          <Flag className="w-5 h-5" />
                          <span className="text-sm font-medium">Delete Fundraiser</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {f.description}
                  </p>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold">
                        ${f.current_amount.toLocaleString()}
                      </span>
                      <span>
                        of ${f.goal_amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded">
                      <div
                        className="h-2 bg-pink-600 rounded"
                        style={{
                          width: `${Math.min(
                            100,
                            f.progress_percentage
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1 mb-4">
                    <div className="flex gap-2">
                      <User className="w-4 h-4" />
                      {f.beneficiary_name}
                    </div>
                    <div className="flex gap-2">
                      <Heart className="w-4 h-4" />
                      {f.donations_count} donations
                    </div>
                    {f.end_date && (
                      <div className="flex gap-2">
                        <Calendar className="w-4 h-4" />
                        Ends{" "}
                        {new Date(f.end_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDonate(f.id)}
                    className="w-full py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-medium"
                  >
                    Donate Now
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateFundraiserModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            fetchFundraisers();
          }}
        />
      )}

      {editingFundraiser && (
        <EditFundraiserModal
          fundraiser={editingFundraiser}
          isOpen={!!editingFundraiser}
          onClose={() => setEditingFundraiser(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      <DeleteConfirmModal
        isOpen={deletingFundraiserId !== null}
        onClose={() => {
          if (!isDeleting) {
            setDeletingFundraiserId(null);
          }
        }}
        onConfirm={async () => {
          if (deletingFundraiserId) {
            await handleDelete(deletingFundraiserId);
          }
        }}
        title="Delete Fundraiser"
        message="Are you sure you want to delete this fundraiser? This action cannot be undone."
        itemName={fundraisers.find(f => f.id === deletingFundraiserId)?.title}
        isDeleting={isDeleting}
      />
    </DashboardLayout>
  );
}
