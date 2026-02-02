import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "@/react-app/contexts/AuthContext";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { Send, ArrowLeft, Loader2 } from "lucide-react";

interface Message {
  id: number;
  sender_user_id: string;
  receiver_user_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface UserProfile {
  user_id: string;
  full_name: string;
  last_name: string;
  profile_picture_url: string;
  specialisation: string;
}

export default function DirectMessage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !userId) return;

    fetchOtherUserProfile();
    fetchMessages();

    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [user, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchOtherUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/profile`);
      const data = await response.json();
      setOtherUser(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/direct-messages/${userId}`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !userId) return;

    setIsSending(true);
    try {
      await fetch(`/api/direct-messages/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      });
      
      setNewMessage("");
      await fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto mb-20 lg:mb-0">
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign in required</h3>
            <p className="text-gray-600">Please sign in to access messages</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto mb-20 lg:mb-0">
        {/* Header */}
        <div className="bg-white rounded-t-2xl shadow-lg p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/connect")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            {otherUser && (
              <>
                {otherUser.profile_picture_url ? (
                  <img
                    src={otherUser.profile_picture_url}
                    alt={otherUser.full_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                    {otherUser.full_name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900">
                    {otherUser.full_name} {otherUser.last_name}
                  </h2>
                  {otherUser.specialisation && (
                    <p className="text-sm text-gray-600">{otherUser.specialisation}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Messages Container */}
        <div 
          ref={messagesContainerRef}
          className="bg-gray-50 overflow-y-auto p-6 space-y-4"
          style={{ height: "calc(100vh - 300px)", minHeight: "400px" }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Send className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-600">Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.sender_user_id === user.user_id;
              return (
                <div key={msg.id} className={`flex gap-3 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                  {!isOwnMessage && otherUser && (
                    <div className="flex-shrink-0">
                      {otherUser.profile_picture_url ? (
                        <img
                          src={otherUser.profile_picture_url}
                          alt={otherUser.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {otherUser.full_name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {isOwnMessage && (
                    <div className="flex-shrink-0">
                      {user.profile_picture_url ? (
                        <img
                          src={user.profile_picture_url}
                          alt={user.full_name || user.business_name || "You"}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {(user.full_name || user.business_name || "U")[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className={`flex-1 max-w-md ${isOwnMessage ? "text-right" : ""}`}>
                    <div className={`inline-block ${isOwnMessage ? "bg-blue-600 text-white" : "bg-white text-gray-900"} rounded-2xl px-4 py-3 shadow`}>
                      <p className="break-words">{msg.message}</p>
                    </div>
                    <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? "text-right" : ""}`}>
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="bg-white rounded-b-2xl shadow-lg border-t border-gray-200 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSending}
            />
            
            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              <span>Send</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
