import { useState, useRef } from "react";
import { ArrowLeft, Upload, FileText, Image, X } from "lucide-react";

interface OnboardingFreelancerPortfolioProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

interface PortfolioItem {
  title: string;
  description: string;
  file: File;
  file_type: string;
}

export default function OnboardingFreelancerPortfolio({ onComplete, onBack }: OnboardingFreelancerPortfolioProps) {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    title: "",
    description: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type.startsWith("image/") ? "image" : "document";

    if (fileType === "image" && file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    if (fileType === "document" && file.size > 10 * 1024 * 1024) {
      alert("Document size must be less than 10MB");
      return;
    }

    setPortfolioItems([
      ...portfolioItems,
      {
        title: currentItem.title || file.name,
        description: currentItem.description,
        file,
        file_type: fileType,
      },
    ]);

    setCurrentItem({ title: "", description: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeItem = (index: number) => {
    setPortfolioItems(portfolioItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsUploading(true);

    try {
      const uploadedUrls: any[] = [];

      for (const item of portfolioItems) {
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("title", item.title);
        formData.append("description", item.description);
        formData.append("file_type", item.file_type);

        const response = await fetch("/api/onboarding/upload-portfolio", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          uploadedUrls.push({
            title: item.title,
            description: item.description,
            file_url: result.file_url,
            file_type: item.file_type,
          });
        }
      }

      onComplete({ portfolio: uploadedUrls });
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload portfolio items. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-h-[90vh] overflow-y-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolio</h1>
      <p className="text-gray-600 mb-8">Upload certifications, documents, or images showcasing your work (Optional)</p>

      <div className="space-y-6 mb-8">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={currentItem.title}
                onChange={(e) => setCurrentItem({ ...currentItem, title: e.target.value })}
                placeholder="e.g., Certification, Project Name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={currentItem.description}
                onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                placeholder="Brief description of this item"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
            >
              <Upload className="w-5 h-5" />
              Add Portfolio Item
            </button>

            <p className="text-xs text-gray-500 text-center">
              Accepted: Images (max 5MB), PDF/DOC (max 10MB)
            </p>
          </div>
        </div>

        {portfolioItems.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Portfolio Items ({portfolioItems.length})
            </h3>
            <div className="space-y-3">
              {portfolioItems.map((item, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.file_type === "image" ? (
                      <Image className="w-6 h-6 text-blue-600" />
                    ) : (
                      <FileText className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{item.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{item.description || "No description"}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.file.name}</p>
                  </div>
                  <button
                    onClick={() => removeItem(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onComplete({ portfolio: [] })}
          disabled={isUploading}
          className="flex-1 py-4 border border-gray-300 text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          Skip
        </button>
        <button
          onClick={handleSubmit}
          disabled={isUploading || portfolioItems.length === 0}
          className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? "Uploading..." : "Complete Onboarding"}
        </button>
      </div>
    </div>
  );
}
