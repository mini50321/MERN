import { createContext, useContext, useState, ReactNode } from "react";
import Toast from "@/react-app/components/Toast";
import { playNotificationSound } from "@/react-app/utils/soundEffects";

interface ToastData {
  id: string;
  type: "success" | "error" | "info" | "notification";
  message: string;
  title?: string;
  notificationType?: string;
}

interface ToastContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showNotification: (title: string, message: string, notificationType?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showSuccess = (message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type: "success", message }]);
  };

  const showError = (message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type: "error", message }]);
  };

  const showNotification = (title: string, message: string, notificationType?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type: "notification", message, title, notificationType }]);
    
    // Play notification sound
    playNotificationSound();
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        <div className="flex flex-col gap-3 pointer-events-auto">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              id={toast.id}
              type={toast.type}
              message={toast.message}
              title={toast.title}
              notificationType={toast.notificationType}
              onClose={removeToast}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}
