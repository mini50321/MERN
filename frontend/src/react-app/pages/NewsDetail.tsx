import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { ArrowLeft, Download, Heart, MessageCircle, Calendar } from "lucide-react";
import type { NewsWithCounts } from "@/shared/types";

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [news, setNews] = useState<NewsWithCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchNewsDetail();
    }
  }, [id]);

  const fetchNewsDetail = async () => {
    try {
      const response = await fetch(`/api/news/${id}`);
      if (response.ok) {
        const data = await response.json();
        setNews(data);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Post not found</h1>
          <p className="text-gray-600 mb-6">This post may have been removed or doesn't exist</p>
          <Link
            to="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-3">
            <img
              src="https://ucarecdn.com/34458975-99c3-4f1a-b7b5-b81f574b85b0/34458975_transparent.png"
              alt="MAVY"
              className="h-8"
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900">MAVY</h1>
              <p className="text-xs text-gray-600">Medical & Allied Ventures</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Main News Content */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="p-6">
            {/* Author Info */}
            {news.is_user_post === 1 && news.author_name && (
              <div className="flex items-center gap-3 mb-4">
                {news.author_profile_picture_url ? (
                  <img
                    src={news.author_profile_picture_url}
                    alt={news.author_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {news.author_name[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{news.author_name}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{news.category || "Community Member"}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(news.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* News Image */}
            {news.image_url && (
              <img
                src={news.image_url}
                alt={news.title}
                className="w-full rounded-xl mb-4 object-cover max-h-96"
              />
            )}

            {/* Title and Content */}
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{news.title}</h1>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-4">{news.content}</p>

            {/* Engagement Stats */}
            <div className="flex items-center gap-6 text-gray-600 border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <span className="font-medium">{news.likes_count} likes</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                <span className="font-medium">{news.comments_count} comments</span>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action for Non-Users */}
        {!user && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-white text-center">
            <div className="max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Join MAVY Community</h2>
              <p className="text-blue-100 mb-6">
                Sign up to engage with this post, connect with professionals, and stay updated on industry news
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/signup"
                  className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Sign Up Now
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors border-2 border-blue-500"
                >
                  Already have an account?
                </Link>
              </div>
              
              <div className="mt-8 pt-6 border-t border-blue-500">
                <p className="text-sm text-blue-100 mb-3">Download our mobile app</p>
                <div className="flex gap-3 justify-center">
                  <a
                    href="#"
                    className="flex items-center gap-2 px-4 py-2 bg-black rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                    </svg>
                    <div className="text-left">
                      <p className="text-[10px] text-gray-300">Download on the</p>
                      <p className="text-sm font-semibold">App Store</p>
                    </div>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-2 px-4 py-2 bg-black rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                    </svg>
                    <div className="text-left">
                      <p className="text-[10px] text-gray-300">Get it on</p>
                      <p className="text-sm font-semibold">Google Play</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* For Logged-in Users */}
        {user && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <p className="text-gray-600 mb-4">Want to engage with this post?</p>
            <Link
              to="/news"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all inline-block"
            >
              View in News Feed
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
