import { useState, useEffect, useRef } from "react";
import { Plus, Edit, Trash2, Eye, EyeOff, X, Image as ImageIcon, Link as LinkIcon, Upload, Monitor, Maximize } from "lucide-react";

interface BannerAd {
  id: number;
  title: string;
  image_url: string;
  target_url: string | null;
  ad_type: string;
  display_mode: string;
  is_active: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default function AdvertisingPanel({ canEdit = true }: { canEdit?: boolean }) {
  const [ads, setAds] = useState<BannerAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState<BannerAd | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    image_url: "",
    target_url: "",
    ad_type: "image",
    display_mode: "banner",
    is_active: true,
  });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/ads/banners");
      if (res.ok) {
        const data = await res.json();
        setAds(data);
      }
    } catch (error) {
      console.error("Error loading ads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (ad?: BannerAd) => {
    if (ad) {
      setEditingAd(ad);
      setFormData({
        title: ad.title,
        image_url: ad.image_url,
        target_url: ad.target_url || "",
        ad_type: ad.ad_type,
        display_mode: ad.display_mode || "banner",
        is_active: ad.is_active === 1,
      });
      setMediaPreview(ad.image_url);
    } else {
      setEditingAd(null);
      setFormData({
        title: "",
        image_url: "",
        target_url: "",
        ad_type: "image",
        display_mode: "banner",
        is_active: true,
      });
      setMediaPreview("");
    }
    setMediaFile(null);
    setShowModal(true);
    setError("");
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAd(null);
    setMediaFile(null);
    setMediaPreview("");
    setError("");
  };

  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isImage && !isVideo) {
      setError("Please select an image or video file");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("File size must be less than 50MB");
      return;
    }

    setMediaFile(file);
    setFormData({ ...formData, image_url: "", ad_type: isVideo ? "video" : "image" });
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setFormData({ ...formData, image_url: "" });
    setMediaPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (!mediaFile && !formData.image_url.trim()) {
      setError("Please upload a file or provide an image/video URL");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      let finalMediaUrl = formData.image_url.trim();

      if (mediaFile) {
        setIsUploadingMedia(true);
        const uploadFormData = new FormData();
        uploadFormData.append("media", mediaFile);

        const uploadResponse = await fetch("/api/admin/ads/upload-media", {
          method: "POST",
          body: uploadFormData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          finalMediaUrl = uploadData.media_url;
        } else {
          throw new Error("Failed to upload media");
        }
        setIsUploadingMedia(false);
      }

      const url = editingAd
        ? `/api/admin/ads/banners/${editingAd.id}`
        : "/api/admin/ads/banners";
      const method = editingAd ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          image_url: finalMediaUrl,
          is_active: formData.is_active ? 1 : 0,
        }),
      });

      if (res.ok) {
        await loadAds();
        handleCloseModal();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save banner ad");
      }
    } catch (error) {
      console.error("Error saving ad:", error);
      setError("An error occurred while saving the ad");
    } finally {
      setIsSubmitting(false);
      setIsUploadingMedia(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this banner ad?")) return;

    try {
      const res = await fetch(`/api/admin/ads/banners/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadAds();
      }
    } catch (error) {
      console.error("Error deleting ad:", error);
    }
  };

  const handleToggleActive = async (ad: BannerAd) => {
    try {
      const res = await fetch(`/api/admin/ads/banners/${ad.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ad,
          is_active: ad.is_active === 1 ? 0 : 1,
        }),
      });

      if (res.ok) {
        await loadAds();
      }
    } catch (error) {
      console.error("Error toggling ad status:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Banner Advertisements</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage banner ads and full-screen interstitials displayed in the app
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Ad
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ads.map((ad) => (
          <div
            key={ad.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="relative h-40 bg-gray-100">
              {ad.ad_type === "image" ? (
                <img
                  src={ad.image_url}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={ad.image_url}
                  className="w-full h-full object-cover"
                  muted
                />
              )}
              {ad.is_active === 0 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded">
                    Inactive
                  </span>
                </div>
              )}
              <div className="absolute top-2 right-2">
                {ad.display_mode === "fullscreen" ? (
                  <span className="px-2 py-1 bg-purple-500 text-white text-xs font-medium rounded flex items-center gap-1">
                    <Maximize className="w-3 h-3" />
                    Full Screen
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded flex items-center gap-1">
                    <Monitor className="w-3 h-3" />
                    Banner
                  </span>
                )}
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1 truncate">
                {ad.title}
              </h3>
              <p className="text-xs text-gray-500 mb-3 truncate">
                {ad.target_url || "No target URL"}
              </p>

              <div className="flex items-center justify-end">
                {canEdit ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(ad)}
                      className={`p-1.5 rounded transition-colors ${
                        ad.is_active === 1
                          ? "bg-green-100 text-green-600 hover:bg-green-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      title={ad.is_active === 1 ? "Active" : "Inactive"}
                    >
                      {ad.is_active === 1 ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleOpenModal(ad)}
                      className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ad.id)}
                      className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">View Only</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {ads.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No banner ads created yet</p>
            <p className="text-sm mt-1">Click "Create Ad" to get started</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingAd ? "Edit Banner Ad" : "Create Banner Ad"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ad Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Summer Sale Campaign"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Mode *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="display_mode"
                        value="banner"
                        checked={formData.display_mode === "banner"}
                        onChange={(e) =>
                          setFormData({ ...formData, display_mode: e.target.value })
                        }
                        className="w-4 h-4 text-blue-600"
                        disabled={isSubmitting}
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-gray-900">In-App Banner</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Shows in carousel on dashboard (recommended)
                        </p>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="display_mode"
                        value="fullscreen"
                        checked={formData.display_mode === "fullscreen"}
                        onChange={(e) =>
                          setFormData({ ...formData, display_mode: e.target.value })
                        }
                        className="w-4 h-4 text-blue-600"
                        disabled={isSubmitting}
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center gap-2">
                          <Maximize className="w-4 h-4 text-purple-600" />
                          <span className="font-medium text-gray-900">Full Screen Interstitial</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Displays as popup overlay on app launch
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ImageIcon className="w-4 h-4 inline mr-1" />
                    Image/Video *
                  </label>
                  
                  {(mediaPreview || formData.image_url) && (
                    <div className="mb-3">
                      <div className="relative inline-block max-w-full">
                        {formData.ad_type === "video" || mediaFile?.type.startsWith("video/") ? (
                          <video
                            src={mediaPreview || formData.image_url}
                            className="max-w-full h-48 object-cover rounded-lg border border-gray-300"
                            controls
                          />
                        ) : (
                          <img
                            src={mediaPreview || formData.image_url}
                            alt="Preview"
                            className="max-w-full h-48 object-cover rounded-lg border border-gray-300"
                          />
                        )}
                        <button
                          type="button"
                          onClick={handleRemoveMedia}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleMediaFileChange}
                        className="hidden"
                        disabled={isSubmitting || !!formData.image_url}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSubmitting || !!formData.image_url}
                        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Upload className="w-5 h-5" />
                        <span>Upload from Device</span>
                      </button>
                      <p className="text-xs text-gray-500 mt-1">
                        Supports images and videos (max 50MB)
                      </p>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">OR</span>
                      </div>
                    </div>

                    <div>
                      <input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => {
                          setFormData({ ...formData, image_url: e.target.value });
                          setMediaFile(null);
                          setMediaPreview("");
                        }}
                        placeholder="https://example.com/banner.jpg"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting || !!mediaFile}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter a direct URL to an image or video
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <LinkIcon className="w-4 h-4 inline mr-1" />
                    Target URL (optional)
                  </label>
                  <input
                    type="url"
                    value={formData.target_url}
                    onChange={(e) =>
                      setFormData({ ...formData, target_url: e.target.value })
                    }
                    placeholder="https://example.com/landing-page"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Where users will be directed when clicking the ad
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="is_active"
                    className="ml-2 text-sm font-medium text-gray-700"
                  >
                    Active (show to users)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    isUploadingMedia ? "Uploading..." : "Saving..."
                  ) : (
                    editingAd ? "Update" : "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
