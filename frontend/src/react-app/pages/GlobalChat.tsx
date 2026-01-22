import { useState, useEffect, useRef } from "react";
import { useAuth } from "@getmocha/users-service/react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { Send, MapPin, Globe, Users, Loader2, Smile, Paperclip, Reply, Trash2, X, FileText, Image as ImageIcon, Film, Phone, Building2, Plus, MessageCircle } from "lucide-react";

interface ChatMessage {
  id: number;
  user_id: string;
  message: string;
  chat_scope: string;
  scope_value: string | null;
  created_at: string;
  full_name: string | null;
  profile_picture_url: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  attachment_name: string | null;
  reactions: Array<{ emoji: string; count: number }>;
  user_reactions: string[];
  replies_count: number;
}

interface ChatReply {
  id: number;
  parent_message_id: number;
  user_id: string;
  message: string;
  created_at: string;
  full_name: string | null;
  profile_picture_url: string | null;
}

interface ContactRequest {
  id: number;
  user_id: string;
  company_name: string;
  hospital_name: string | null;
  location: string | null;
  description: string | null;
  status: string;
  full_name: string | null;
  profile_picture_url: string | null;
  replies_count: number;
  created_at: string;
}

interface ContactReply {
  id: number;
  request_id: number;
  user_id: string;
  contact_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  contact_designation: string | null;
  additional_notes: string | null;
  full_name: string | null;
  profile_picture_url: string | null;
  created_at: string;
}

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🎉", "🔥"];

export default function GlobalChat() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"state" | "country" | "global">("state");
  const [activeView, setActiveView] = useState<"chat" | "contacts">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [userState, setUserState] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<number | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const [replies, setReplies] = useState<Record<number, ChatReply[]>>({});
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
  const [submittingReply, setSubmittingReply] = useState<number | null>(null);
  const [showContactRequestModal, setShowContactRequestModal] = useState(false);
  const [showContactReplyModal, setShowContactReplyModal] = useState(false);
  const [selectedContactRequest, setSelectedContactRequest] = useState<ContactRequest | null>(null);
  const [contactReplies, setContactReplies] = useState<ContactReply[]>([]);
  const [showContactRepliesModal, setShowContactRepliesModal] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const previousMessageCountRef = useRef(0);

  useEffect(() => {
    if (user) {
      fetchUserLocation();
    }
  }, [user]);

  useEffect(() => {
    if (user && (activeTab === "global" || (activeTab === "state" && userState) || (activeTab === "country" && userCountry))) {
      fetchData();
      
      pollingInterval.current = setInterval(() => {
        fetchData();
      }, 3000);

      return () => {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
        }
      };
    }
  }, [user, activeTab, userState, userCountry, activeView]);

  useEffect(() => {
    const isNewMessage = messages.length > previousMessageCountRef.current;
    previousMessageCountRef.current = messages.length;

    if (shouldAutoScrollRef.current || (isNewMessage && isUserNearBottom())) {
      scrollToBottom();
      shouldAutoScrollRef.current = false;
    }
  }, [messages]);

  const isUserNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom < 100;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [userProfession, setUserProfession] = useState<string | null>(null);

  const fetchUserLocation = async () => {
    try {
      const response = await fetch("/api/users/me");
      const data = await response.json();
      setUserState(data.profile?.state || null);
      setUserCountry(data.profile?.country || null);
      setUserProfession(data.profile?.profession || "biomedical_engineer");
    } catch (error) {
      console.error("Error fetching user location:", error);
    }
  };

  const getProfessionLabel = (profession: string | null) => {
    switch (profession) {
      case "biomedical_engineer": return "Biomedical Engineers";
      case "nursing": return "Nursing Professionals";
      case "ambulance": return "Ambulance Providers";
      case "physiotherapy": return "Physiotherapy Professionals";
      default: return "Healthcare Professionals";
    }
  };

  const fetchData = async () => {
    try {
      if (activeView === "chat") {
        const response = await fetch(`/api/chat/messages?scope=${activeTab}`);
        const data = await response.json();
        setMessages(data);
      } else {
        const response = await fetch(`/api/contact-requests?scope=${activeTab}`);
        const data = await response.json();
        setContactRequests(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    shouldAutoScrollRef.current = true;
    previousMessageCountRef.current = 0;
  }, [activeTab, activeView]);

  const fetchReplies = async (messageId: number) => {
    try {
      const response = await fetch(`/api/chat/messages/${messageId}/replies`);
      const data = await response.json();
      setReplies(prev => ({ ...prev, [messageId]: data }));
    } catch (error) {
      console.error("Error fetching replies:", error);
    }
  };

  const fetchContactReplies = async (requestId: number) => {
    try {
      const response = await fetch(`/api/contact-requests/${requestId}/replies`);
      const data = await response.json();
      setContactReplies(data);
    } catch (error) {
      console.error("Error fetching contact replies:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !selectedFile) return;

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append("message", newMessage || " ");
      formData.append("chat_scope", activeTab);
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      await fetch("/api/chat/messages", {
        method: "POST",
        body: formData,
      });
      
      setNewMessage("");
      removeFile();
      shouldAutoScrollRef.current = true;
      await fetchData();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateContactRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch("/api/contact-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: formData.get("company_name"),
          hospital_name: formData.get("hospital_name"),
          location: formData.get("location"),
          description: formData.get("description"),
          chat_scope: activeTab,
        }),
      });

      if (response.ok) {
        setShowContactRequestModal(false);
        setActiveView("contacts");
        await fetchData();
      }
    } catch (error) {
      console.error("Error creating contact request:", error);
    }
  };

  const handleReplyToContactRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch(`/api/contact-requests/${selectedContactRequest!.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_name: formData.get("contact_name"),
          contact_phone: formData.get("contact_phone"),
          contact_email: formData.get("contact_email"),
          contact_designation: formData.get("contact_designation"),
          additional_notes: formData.get("additional_notes"),
        }),
      });

      if (response.ok) {
        setShowContactReplyModal(false);
        setSelectedContactRequest(null);
        await fetchData();
      }
    } catch (error) {
      console.error("Error replying to contact request:", error);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      await fetch(`/api/chat/messages/${messageId}`, {
        method: "DELETE",
      });
      await fetchData();
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleDeleteContactRequest = async (requestId: number) => {
    if (!confirm("Are you sure you want to delete this contact request?")) return;

    try {
      await fetch(`/api/contact-requests/${requestId}`, {
        method: "DELETE",
      });
      await fetchData();
    } catch (error) {
      console.error("Error deleting contact request:", error);
    }
  };

  const handleReaction = async (messageId: number, emoji: string) => {
    try {
      await fetch(`/api/chat/messages/${messageId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      await fetchData();
      setShowEmojiPicker(null);
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const toggleReplies = async (messageId: number) => {
    const isExpanded = expandedReplies.has(messageId);
    
    if (isExpanded) {
      const newExpanded = new Set(expandedReplies);
      newExpanded.delete(messageId);
      setExpandedReplies(newExpanded);
    } else {
      const newExpanded = new Set(expandedReplies);
      newExpanded.add(messageId);
      setExpandedReplies(newExpanded);
      
      if (!replies[messageId]) {
        await fetchReplies(messageId);
      }
    }
  };

  const handleViewContactReplies = async (request: ContactRequest) => {
    setSelectedContactRequest(request);
    setShowContactRepliesModal(true);
    await fetchContactReplies(request.id);
  };

  const handleReplySubmit = async (messageId: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replyTexts[messageId]?.trim()) return;

    setSubmittingReply(messageId);
    try {
      const response = await fetch(`/api/chat/messages/${messageId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyTexts[messageId] }),
      });

      if (response.ok) {
        setReplyTexts(prev => ({ ...prev, [messageId]: "" }));
        await fetchReplies(messageId);
        await fetchData();
      }
    } catch (error) {
      console.error("Error posting reply:", error);
    } finally {
      setSubmittingReply(null);
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

  const formatDateSeparator = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    
    return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toDateString();
  };

  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const grouped: { [key: string]: ChatMessage[] } = {};
    
    messages.forEach(msg => {
      const dateKey = getMessageDate(msg.created_at);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(msg);
    });

    return grouped;
  };

  const getTabLabel = () => {
    if (activeTab === "state") return userState || "State";
    if (activeTab === "country") return userCountry || "Country";
    return "Global";
  };

  const canAccessTab = (tab: "state" | "country" | "global") => {
    if (tab === "global") return true;
    if (tab === "country") return !!userCountry;
    if (tab === "state") return !!userState;
    return false;
  };

  const getFileIcon = (type: string | null) => {
    if (!type) return <FileText className="w-4 h-4" />;
    if (type === "image") return <ImageIcon className="w-4 h-4" />;
    if (type === "video") return <Film className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto mb-20 lg:mb-0">
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign in to access Global Chat</h3>
            <p className="text-gray-600">Connect with biomedical engineers worldwide</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto mb-20 lg:mb-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Global Chat</h1>
          <p className="text-gray-600">Connect and chat with {getProfessionLabel(userProfession).toLowerCase()}</p>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab("state")}
            disabled={!canAccessTab("state")}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${
              activeTab === "state"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-50 shadow disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MapPin className="w-5 h-5" />
              <span>{userState || "State"}</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("country")}
            disabled={!canAccessTab("country")}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${
              activeTab === "country"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-50 shadow disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="w-5 h-5" />
              <span>{userCountry || "Country"}</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("global")}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${
              activeTab === "global"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-50 shadow"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Globe className="w-5 h-5" />
              <span>Global</span>
            </div>
          </button>
        </div>

        {!canAccessTab(activeTab) ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Location Required</h3>
            <p className="text-gray-600 mb-4">
              Please update your location in your profile to access {activeTab} chat
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col" style={{ height: "calc(100vh - 350px)", minHeight: "500px" }}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {activeTab === "state" && <MapPin className="w-5 h-5" />}
                  {activeTab === "country" && <Users className="w-5 h-5" />}
                  {activeTab === "global" && <Globe className="w-5 h-5" />}
                  <h3 className="font-semibold">{getTabLabel()} Chat</h3>
                  <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                    {getProfessionLabel(userProfession)} Only
                  </span>
                </div>
                <button
                  onClick={() => setShowContactRequestModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Request Contact</span>
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveView("chat")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                    activeView === "chat"
                      ? "bg-white/30 shadow-sm"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>Messages</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveView("contacts")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                    activeView === "contacts"
                      ? "bg-white/30 shadow-sm"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>Contact Requests</span>
                  </div>
                </button>
              </div>
            </div>

            {activeView === "chat" ? (
              <>
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Globe className="w-16 h-16 text-gray-300 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
                      <p className="text-gray-600">Be the first to start the conversation!</p>
                    </div>
                  ) : (
                    Object.keys(groupedMessages).map((dateKey) => (
                      <div key={dateKey}>
                        <div className="flex items-center justify-center my-4">
                          <div className="bg-gray-200 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                            {formatDateSeparator(groupedMessages[dateKey][0].created_at)}
                          </div>
                        </div>

                        <div className="space-y-4">
                          {groupedMessages[dateKey].map((msg) => {
                            const isOwnMessage = msg.user_id === user.id;
                            return (
                              <div key={msg.id} className="space-y-2">
                                <div className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                                  {!isOwnMessage && (
                                    <div className="flex-shrink-0">
                                      {msg.profile_picture_url ? (
                                        <img
                                          src={msg.profile_picture_url}
                                          alt={msg.full_name || "User"}
                                          className="w-10 h-10 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full"></div>
                                      )}
                                    </div>
                                  )}
                                  <div className={`flex-1 max-w-md ${isOwnMessage ? "text-right" : ""}`}>
                                    <div className={`inline-block ${isOwnMessage ? "bg-blue-600 text-white" : "bg-white text-gray-900"} rounded-2xl px-4 py-3 shadow relative group`}>
                                      {!isOwnMessage && (
                                        <div className="font-semibold text-sm mb-1">
                                          {msg.full_name || "Anonymous"}
                                        </div>
                                      )}
                                      <p className="break-words">{msg.message}</p>
                                      
                                      {msg.attachment_url && (
                                        <div className="mt-2">
                                          {msg.attachment_type === "image" ? (
                                            <img
                                              src={msg.attachment_url}
                                              alt={msg.attachment_name || "Attachment"}
                                              className="max-w-full rounded-lg max-h-64 object-cover"
                                            />
                                          ) : msg.attachment_type === "video" ? (
                                            <video
                                              src={msg.attachment_url}
                                              controls
                                              className="max-w-full rounded-lg max-h-64"
                                            />
                                          ) : (
                                            <a
                                              href={msg.attachment_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className={`flex items-center gap-2 p-2 rounded-lg ${isOwnMessage ? "bg-blue-700" : "bg-gray-100"}`}
                                            >
                                              {getFileIcon(msg.attachment_type)}
                                              <span className="text-sm truncate">{msg.attachment_name}</span>
                                            </a>
                                          )}
                                        </div>
                                      )}

                                      {msg.reactions.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {msg.reactions.map((reaction, idx) => (
                                            <button
                                              key={idx}
                                              onClick={() => handleReaction(msg.id, reaction.emoji)}
                                              className={`text-xs px-2 py-1 rounded-full ${
                                                msg.user_reactions.includes(reaction.emoji)
                                                  ? isOwnMessage ? "bg-blue-700" : "bg-blue-100"
                                                  : isOwnMessage ? "bg-blue-500" : "bg-gray-100"
                                              }`}
                                            >
                                              {reaction.emoji} {reaction.count}
                                            </button>
                                          ))}
                                        </div>
                                      )}

                                      <div className={`absolute ${isOwnMessage ? "left-2" : "right-2"} top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}>
                                        <div className="relative" ref={showEmojiPicker === msg.id ? emojiPickerRef : null}>
                                          <button
                                            onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                                            className={`p-1 rounded ${isOwnMessage ? "bg-blue-700 hover:bg-blue-800" : "bg-gray-200 hover:bg-gray-300"}`}
                                          >
                                            <Smile className="w-4 h-4" />
                                          </button>
                                          
                                          {showEmojiPicker === msg.id && (
                                            <div className="absolute top-8 left-0 bg-white rounded-lg shadow-xl p-2 z-10 flex gap-1">
                                              {COMMON_EMOJIS.map((emoji) => (
                                                <button
                                                  key={emoji}
                                                  onClick={() => handleReaction(msg.id, emoji)}
                                                  className="text-xl hover:bg-gray-100 rounded p-1"
                                                >
                                                  {emoji}
                                                </button>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        
                                        <button
                                          onClick={() => toggleReplies(msg.id)}
                                          className={`p-1 rounded ${isOwnMessage ? "bg-blue-700 hover:bg-blue-800" : "bg-gray-200 hover:bg-gray-300"}`}
                                        >
                                          <Reply className="w-4 h-4" />
                                        </button>
                                        
                                        {isOwnMessage && (
                                          <button
                                            onClick={() => handleDeleteMessage(msg.id)}
                                            className="p-1 rounded bg-red-500 hover:bg-red-600 text-white"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className={`text-xs text-gray-500 mt-1 flex items-center gap-2 ${isOwnMessage ? "justify-end" : ""}`}>
                                      <span>{formatTime(msg.created_at)}</span>
                                      {msg.replies_count > 0 && (
                                        <button
                                          onClick={() => toggleReplies(msg.id)}
                                          className="text-blue-600 hover:underline"
                                        >
                                          {msg.replies_count} {msg.replies_count === 1 ? "reply" : "replies"}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {expandedReplies.has(msg.id) && (
                                  <div className={`ml-13 space-y-3 border-l-2 border-gray-200 pl-4 ${isOwnMessage ? "mr-13" : ""}`}>
                                    {replies[msg.id]?.map((reply) => (
                                      <div key={reply.id} className="flex items-start gap-3">
                                        {reply.profile_picture_url ? (
                                          <img
                                            src={reply.profile_picture_url}
                                            alt={reply.full_name || "User"}
                                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                          />
                                        ) : (
                                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex-shrink-0"></div>
                                        )}
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-sm text-gray-900">
                                              {reply.full_name || "Anonymous"}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                              {formatTime(reply.created_at)}
                                            </span>
                                          </div>
                                          <p className="text-sm text-gray-700">{reply.message}</p>
                                        </div>
                                      </div>
                                    ))}

                                    <form onSubmit={(e) => handleReplySubmit(msg.id, e)} className="flex gap-2">
                                      <input
                                        type="text"
                                        value={replyTexts[msg.id] || ""}
                                        onChange={(e) => setReplyTexts(prev => ({ ...prev, [msg.id]: e.target.value }))}
                                        placeholder="Write a reply..."
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={submittingReply === msg.id}
                                      />
                                      <button
                                        type="submit"
                                        disabled={!replyTexts[msg.id]?.trim() || submittingReply === msg.id}
                                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <Send className="w-4 h-4" />
                                      </button>
                                    </form>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-white">
                  {selectedFile && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                      {filePreview ? (
                        <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          {getFileIcon(selectedFile.type.startsWith("image/") ? "image" : selectedFile.type.startsWith("video/") ? "video" : "document")}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <X className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                      disabled={isSending}
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    
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
                      disabled={isSending || (!newMessage.trim() && !selectedFile)}
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
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                ) : contactRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Phone className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No contact requests yet</h3>
                    <p className="text-gray-600 mb-4">Looking for a vendor contact? Request it here!</p>
                    <button
                      onClick={() => setShowContactRequestModal(true)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
                    >
                      Request Contact
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contactRequests.map((request) => (
                      <div
                        key={request.id}
                        className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-3 flex-1">
                            {request.profile_picture_url ? (
                              <img
                                src={request.profile_picture_url}
                                alt={request.full_name || "User"}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                                <span className="text-white text-lg font-bold">
                                  {(request.full_name || "U").charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Building2 className="w-5 h-5 text-blue-600" />
                                <h3 className="text-lg font-bold text-gray-900">
                                  {request.company_name}
                                </h3>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                Requested by {request.full_name || "Anonymous"}
                              </p>
                              {request.hospital_name && (
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Hospital:</span> {request.hospital_name}
                                </p>
                              )}
                              {request.location && (
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Location:</span> {request.location}
                                </p>
                              )}
                              {request.description && (
                                <p className="text-sm text-gray-600 mt-2">{request.description}</p>
                              )}
                            </div>
                          </div>
                          {user?.id === request.user_id && (
                            <button
                              onClick={() => handleDeleteContactRequest(request.id)}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                              title="Delete request"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
                          {request.replies_count > 0 && (
                            <button
                              onClick={() => handleViewContactReplies(request)}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <Phone className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {request.replies_count} {request.replies_count === 1 ? "Contact" : "Contacts"}
                              </span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedContactRequest(request);
                              setShowContactReplyModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-md transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-medium">Share Contact</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Contact Request Modal */}
        {showContactRequestModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-2xl font-bold text-gray-900">Request Contact</h2>
                <button
                  onClick={() => setShowContactRequestModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleCreateContactRequest} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company/Vendor Name *
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    required
                    placeholder="e.g., Philips Healthcare, GE Healthcare, Siemens Healthineers"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hospital/Facility Name
                  </label>
                  <input
                    type="text"
                    name="hospital_name"
                    placeholder="e.g., Apollo Hospital, AIIMS"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    placeholder="e.g., Mumbai, Delhi NCR, Bangalore"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Details
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    placeholder="Specify what you need - service engineer contact, sales representative, spare parts supplier, etc."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  Post Request
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Contact Reply Modal */}
        {showContactReplyModal && selectedContactRequest && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Share Contact</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    For: {selectedContactRequest.company_name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowContactReplyModal(false);
                    setSelectedContactRequest(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleReplyToContactRequest} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    name="contact_name"
                    required
                    placeholder="e.g., Rajesh Kumar"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="contact_phone"
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="contact_email"
                      placeholder="contact@company.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designation
                  </label>
                  <input
                    type="text"
                    name="contact_designation"
                    placeholder="e.g., Service Engineer, Sales Manager, Regional Head"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    name="additional_notes"
                    rows={3}
                    placeholder="Any helpful information about this contact..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <p className="text-xs text-gray-500">
                  * At least phone number or email is required
                </p>

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  Share Contact
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Contact Replies Modal */}
        {showContactRepliesModal && selectedContactRequest && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Contacts Shared</h2>
                  <p className="text-sm text-gray-600 mt-1">{selectedContactRequest.company_name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowContactRepliesModal(false);
                    setSelectedContactRequest(null);
                    setContactReplies([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {contactReplies.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No contacts shared yet</p>
                ) : (
                  contactReplies.map((reply) => (
                    <div key={reply.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start gap-3 mb-3">
                        {reply.profile_picture_url ? (
                          <img
                            src={reply.profile_picture_url}
                            alt={reply.full_name || "User"}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                            <span className="text-white font-bold">
                              {(reply.full_name || "U").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            Shared by {reply.full_name || "Anonymous"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(reply.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 space-y-2">
                        <h4 className="font-semibold text-gray-900">{reply.contact_name}</h4>
                        {reply.contact_designation && (
                          <p className="text-sm text-gray-600">{reply.contact_designation}</p>
                        )}
                        <div className="space-y-1">
                          {reply.contact_phone && (
                            <a
                              href={`tel:${reply.contact_phone}`}
                              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                            >
                              <Phone className="w-4 h-4" />
                              {reply.contact_phone}
                            </a>
                          )}
                          {reply.contact_email && (
                            <a
                              href={`mailto:${reply.contact_email}`}
                              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                            >
                              📧 {reply.contact_email}
                            </a>
                          )}
                        </div>
                        {reply.additional_notes && (
                          <p className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200">
                            {reply.additional_notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
