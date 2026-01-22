import { useEffect, useState } from "react";
import { Trophy, Sparkles, X } from "lucide-react";

interface LevelUpModalProps {
  level: number;
  onClose: () => void;
}

export default function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-2xl p-8 max-w-md w-full text-center transform transition-all duration-300 ${
          isVisible ? "scale-100" : "scale-90"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="mb-4">
          <div className="inline-block bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-full mb-4 animate-bounce">
            <Trophy className="w-12 h-12 text-white" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          Level Up!
          <Sparkles className="w-6 h-6 text-yellow-500" />
        </h2>

        <div className="mb-4">
          <div className="text-6xl font-black bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
            Level {level}
          </div>
        </div>

        <p className="text-gray-600 mb-6">
          Congratulations! You've reached a new level. Keep up the amazing work!
        </p>

        <button
          onClick={handleClose}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
