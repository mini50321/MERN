import { useEffect, useState } from "react";
import { Award, X } from "lucide-react";

interface BadgeUnlockedToastProps {
  badgeTitle: string;
  badgeIcon: string;
  onClose: () => void;
}

export default function BadgeUnlockedToast({ badgeTitle, badgeIcon, onClose }: BadgeUnlockedToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
    const timer = setTimeout(() => {
      handleClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed bottom-20 right-4 lg:bottom-4 lg:right-4 z-50 transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl shadow-lg p-4 flex items-center gap-3 max-w-sm">
        <div className="text-3xl">{badgeIcon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4" />
            <span className="font-bold text-sm">New Badge Unlocked!</span>
          </div>
          <p className="text-sm font-medium">{badgeTitle}</p>
        </div>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
