import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { X, Mail } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/onboarding");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Sign In</h1>
            <button
              onClick={() => navigate("/")}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in with Gmail</h2>
              <p className="text-gray-600 mb-6">Click the button below to continue with your Google account</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  console.log('Attempting Gmail login...');
                  const response = await fetch('/api/oauth/google/redirect_url', {
                    credentials: 'include'
                  });
                  const data = await response.json();
                  
                  if (data.redirectUrl) {
                    console.log('Redirecting to OAuth URL:', data.redirectUrl);
                    window.location.href = data.redirectUrl;
                  } else {
                    console.error('No redirect URL received');
                    alert('Gmail login is not configured.');
                  }
                } catch (error) {
                  console.error('Gmail login error:', error);
                  alert('Failed to initiate Gmail login.');
                }
              }}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Continue with Gmail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

