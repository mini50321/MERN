import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/react-app/contexts/AuthContext";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import DailyActionFeed from "@/react-app/components/DailyActionFeed";
import ChatBot from "@/react-app/components/ChatBot";
import { ShoppingCart, Wrench, Calendar, TrendingUp } from "lucide-react";

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const profile = (user as any).profile;
      if (!profile?.onboarding_completed) {
        navigate("/onboarding");
        return;
      }
      if (profile?.account_type !== "freelancer") {
        navigate("/onboarding");
      }
    }
  }, [user, navigate]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto pb-20 lg:pb-0">
        {/* Daily Action Feed */}
        <DailyActionFeed />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Freelancer Dashboard</h1>
          <p className="text-gray-600">Manage your services, orders, and schedule</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">0</h3>
            <p className="text-sm text-gray-600">Active Orders</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <Wrench className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">0</h3>
            <p className="text-sm text-gray-600">Service Requests</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">0</h3>
            <p className="text-sm text-gray-600">Scheduled Jobs</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">₹0</h3>
            <p className="text-sm text-gray-600">Monthly Earnings</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome to Your Freelancer Dashboard</h2>
          <p className="text-purple-100 mb-6">
            Your freelancer profile has been created successfully. Start accepting orders and managing your services.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h4 className="font-semibold mb-1">Manage Orders</h4>
              <p className="text-sm text-purple-100">Track and fulfill customer orders</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h4 className="font-semibold mb-1">Schedule Services</h4>
              <p className="text-sm text-purple-100">Organize your service calendar</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h4 className="font-semibold mb-1">Build Your Brand</h4>
              <p className="text-sm text-purple-100">Showcase your portfolio and expertise</p>
            </div>
          </div>
        </div>
      </div>
      <ChatBot />
    </DashboardLayout>
  );
}
