import { X, Link2, Check } from "lucide-react";
import { useState } from "react";

interface ShareModalProps {
  newsId: number;
  newsTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ newsId, newsTitle, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  
  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/news/${newsId}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(newsTitle);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: "bg-green-500"
    },
    {
      name: "Email",
      icon: "https://cdn-icons-png.flaticon.com/512/732/732200.png",
      url: `mailto:?subject=${encodedTitle}&body=Check out this news: ${encodedUrl}`,
      color: "bg-blue-500"
    },
    {
      name: "Facebook",
      icon: "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "bg-blue-600"
    },
    {
      name: "Twitter",
      icon: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg",
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: "bg-sky-500"
    },
    {
      name: "LinkedIn",
      icon: "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: "bg-blue-700"
    },
    {
      name: "Telegram",
      icon: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg",
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      color: "bg-sky-400"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
      <div className="bg-white rounded-t-3xl lg:rounded-2xl w-full lg:max-w-md lg:mx-auto shadow-2xl animate-slide-up">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Share this post</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">{newsTitle}</p>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 text-sm text-gray-700 bg-transparent border-none outline-none"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  copied
                    ? "bg-green-500 text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {copied ? (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Copied
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Copy
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">Share via</p>
            <div className="grid grid-cols-3 gap-3">
              {shareOptions.map((option) => (
                <a
                  key={option.name}
                  href={option.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-12 h-12 ${option.color} rounded-full flex items-center justify-center p-2`}>
                    <img
                      src={option.icon}
                      alt={option.name}
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{option.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
