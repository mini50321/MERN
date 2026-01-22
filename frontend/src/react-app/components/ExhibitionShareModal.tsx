import { X } from "lucide-react";
import { 
  FaWhatsapp, 
  FaEnvelope, 
  FaFacebook, 
  FaTwitter, 
  FaLinkedin, 
  FaTelegram 
} from "react-icons/fa";

interface ExhibitionShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  exhibition: {
    id: number;
    title: string;
    description: string | null;
  };
}

export default function ExhibitionShareModal({ isOpen, onClose, exhibition }: ExhibitionShareModalProps) {
  if (!isOpen) return null;

  const url = `${window.location.origin}/exhibitions/${exhibition.id}`;
  const text = `Check out this exhibition: ${exhibition.title}`;
  const description = exhibition.description || "";

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: FaWhatsapp,
      color: "bg-green-500 hover:bg-green-600",
      url: `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
    },
    {
      name: "Email",
      icon: FaEnvelope,
      color: "bg-gray-600 hover:bg-gray-700",
      url: `mailto:?subject=${encodeURIComponent(exhibition.title)}&body=${encodeURIComponent(`${text}\n\n${description}\n\n${url}`)}`,
    },
    {
      name: "Facebook",
      icon: FaFacebook,
      color: "bg-blue-600 hover:bg-blue-700",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      name: "Twitter",
      icon: FaTwitter,
      color: "bg-sky-500 hover:bg-sky-600",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    },
    {
      name: "LinkedIn",
      icon: FaLinkedin,
      color: "bg-blue-700 hover:bg-blue-800",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      name: "Telegram",
      icon: FaTelegram,
      color: "bg-blue-500 hover:bg-blue-600",
      url: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    },
  ];

  const handleShare = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'width=600,height=400');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Share Exhibition</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4 line-clamp-2">{exhibition.title}</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {shareOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.name}
                  onClick={() => handleShare(option.url)}
                  className={`${option.color} text-white rounded-lg p-4 flex flex-col items-center gap-2 transition-all hover:shadow-lg`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{option.name}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2 font-medium">Or copy link:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                readOnly
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(url);
                  alert("Link copied to clipboard!");
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
