import { useState } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCourseModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCourseModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Equipment Maintenance",
    duration_hours: "",
    modules_count: "",
    equipment_name: "",
    equipment_model: "",
    instructor_name: "",
    instructor_bio: "",
    instructor_credentials: "",
    learning_objectives: "",
    prerequisites: "",
    content: "",
    price: "0",
    currency: "USD",
  });

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [instructorImageFile, setInstructorImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const categories = [
    "Equipment Maintenance",
    "Safety Protocols",
    "Diagnostics",
    "Regulations",
    "Clinical Skills",
    "Technology",
  ];

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 500 * 1024 * 1024) {
        alert("Video file size must be less than 500MB");
        return;
      }
      setVideoFile(file);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("Image file size must be less than 5MB");
        return;
      }
      setImageFile(file);
    }
  };

  const handleInstructorImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("Image file size must be less than 5MB");
        return;
      }
      setInstructorImageFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.category) {
      alert("Please fill in all required fields");
      return;
    }

    if (!videoFile) {
      alert("Please upload a course video");
      return;
    }

    setIsUploading(true);
    setUploadProgress("Uploading video...");

    try {
      // Upload video
      const videoFormData = new FormData();
      videoFormData.append("video", videoFile);

      const videoRes = await fetch("/api/courses/upload-video", {
        method: "POST",
        body: videoFormData,
      });

      if (!videoRes.ok) {
        throw new Error("Failed to upload video");
      }

      const videoData = await videoRes.json();

      // Upload course image if provided
      let imageUrl = null;
      if (imageFile) {
        setUploadProgress("Uploading course image...");
        const imageFormData = new FormData();
        imageFormData.append("image", imageFile);

        const imageRes = await fetch("/api/news/upload-image", {
          method: "POST",
          body: imageFormData,
        });

        if (imageRes.ok) {
          const imageData = await imageRes.json();
          imageUrl = imageData.image_url;
        }
      }

      // Upload instructor image if provided
      let instructorImageUrl = null;
      if (instructorImageFile) {
        setUploadProgress("Uploading instructor photo...");
        const instructorImageFormData = new FormData();
        instructorImageFormData.append("image", instructorImageFile);

        const instructorImageRes = await fetch("/api/news/upload-image", {
          method: "POST",
          body: instructorImageFormData,
        });

        if (instructorImageRes.ok) {
          const instructorImageData = await instructorImageRes.json();
          instructorImageUrl = instructorImageData.image_url;
        }
      }

      // Submit course
      setUploadProgress("Submitting course...");
      const courseRes = await fetch("/api/courses/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          video_url: videoData.video_url,
          image_url: imageUrl,
          instructor_image_url: instructorImageUrl,
          duration_hours: parseFloat(formData.duration_hours) || null,
          modules_count: parseInt(formData.modules_count) || 0,
          price: parseFloat(formData.price) || 0,
        }),
      });

      if (!courseRes.ok) {
        throw new Error("Failed to submit course");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error submitting course:", error);
      alert("Failed to submit course. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Submit a Course</h2>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Advanced MRI Maintenance"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Brief overview of the course..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Modules
                </label>
                <input
                  type="number"
                  value={formData.modules_count}
                  onChange={(e) => setFormData({ ...formData, modules_count: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ({formData.currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0 for free"
                />
              </div>
            </div>
          </div>

          {/* Equipment Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment (Optional)</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment Name
                </label>
                <input
                  type="text"
                  value={formData.equipment_name}
                  onChange={(e) => setFormData({ ...formData, equipment_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., MRI Scanner"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment Model
                </label>
                <input
                  type="text"
                  value={formData.equipment_model}
                  onChange={(e) => setFormData({ ...formData, equipment_model: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Siemens Magnetom"
                />
              </div>
            </div>
          </div>

          {/* Instructor Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructor Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructor Name
                </label>
                <input
                  type="text"
                  value={formData.instructor_name}
                  onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructor Credentials
                </label>
                <input
                  type="text"
                  value={formData.instructor_credentials}
                  onChange={(e) => setFormData({ ...formData, instructor_credentials: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., PhD, CBET, 15+ years experience"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructor Bio
                </label>
                <textarea
                  value={formData.instructor_bio}
                  onChange={(e) => setFormData({ ...formData, instructor_bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Brief professional background..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructor Photo
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-sm">Choose Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleInstructorImageChange}
                      className="hidden"
                    />
                  </label>
                  {instructorImageFile && (
                    <span className="text-sm text-gray-600">{instructorImageFile.name}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Course Content */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Content</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Learning Objectives (one per line)
                </label>
                <textarea
                  value={formData.learning_objectives}
                  onChange={(e) => setFormData({ ...formData, learning_objectives: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="What will students learn?&#10;e.g.,&#10;Understand MRI safety protocols&#10;Perform routine maintenance checks&#10;Troubleshoot common issues"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prerequisites
                </label>
                <textarea
                  value={formData.prerequisites}
                  onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="What should students know before taking this course?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Outline
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Detailed course content and module breakdown..."
                />
              </div>
            </div>
          </div>

          {/* Media Files */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Media Files</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Video * (Max 500MB)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Upload Video</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                      required
                    />
                  </label>
                  {videoFile && (
                    <span className="text-sm text-gray-600">{videoFile.name}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Thumbnail (Max 5MB)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-sm">Choose Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {imageFile && (
                    <span className="text-sm text-gray-600">{imageFile.name}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-gray-200">
          {isUploading && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>{uploadProgress}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 animate-pulse"></div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isUploading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Uploading..." : "Submit Course"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
