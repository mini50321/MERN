import { useEffect } from "react";
import { CheckCircle, XCircle, X, Bell, DollarSign, Star, Package } from "lucide-react";

export interface ToastProps {
  id: string;
  type: "success" | "error" | "info" | "notification";
  message: string;
  title?: string;
  notificationType?: string;
  onClose: (id: string) => void;
}

export default function Toast({ id, type, message, title, notificationType, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 6000); // Slightly longer for notifications

    return () => clearTimeout(timer);
  }, [id, onClose]);

  const getNotificationIcon = () => {
    if (type === "success") return <CheckCircle className="w-6 h-6 text-green-600" />;
    if (type === "error") return <XCircle className="w-6 h-6 text-red-600" />;
    
    // Notification-specific icons
    switch (notificationType) {
      case "new_order":
        return <Package className="w-6 h-6 text-blue-600" />;
      case "quote_received":
        return <DollarSign className="w-6 h-6 text-green-600" />;
      case "order_accepted":
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case "quote_accepted":
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case "order_completed":
        return <Star className="w-6 h-6 text-yellow-600" />;
      case "rating_received":
        return <Star className="w-6 h-6 text-yellow-600" />;
      case "order_cancelled":
        return <XCircle className="w-6 h-6 text-red-600" />;
      case "quote_declined":
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Bell className="w-6 h-6 text-blue-600" />;
    }
  };

  const getStyles = () => {
    if (type === "success") {
      return {
        container: "bg-green-50 border-green-500",
        title: "text-green-900",
        message: "text-green-800",
        button: "hover:bg-green-100 text-green-700"
      };
    }
    if (type === "error") {
      return {
        container: "bg-red-50 border-red-500",
        title: "text-red-900",
        message: "text-red-800",
        button: "hover:bg-red-100 text-red-700"
      };
    }
    // Notification (info) styles
    return {
      container: "bg-blue-50 border-blue-500",
      title: "text-blue-900",
      message: "text-blue-800",
      button: "hover:bg-blue-100 text-blue-700"
    };
  };

  const styles = getStyles();
  const displayTitle = title || (type === "success" ? "Success" : type === "error" ? "Error" : "Notification");

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border-2 min-w-[320px] max-w-md animate-slide-in ${styles.container}`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getNotificationIcon()}
      </div>
      <div className="flex-1">
        <p className={`font-semibold text-sm ${styles.title}`}>
          {displayTitle}
        </p>
        <p className={`text-sm mt-0.5 ${styles.message}`}>
          {message}
        </p>
      </div>
      <button
        onClick={() => onClose(id)}
        className={`flex-shrink-0 p-1 rounded-lg transition-colors ${styles.button}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
