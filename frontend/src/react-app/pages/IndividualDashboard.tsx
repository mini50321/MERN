import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import DailyActionFeed from "@/react-app/components/DailyActionFeed";
import ChatBot from "@/react-app/components/ChatBot";
import PartnerOrderNotification from "@/react-app/components/PartnerOrderNotification";
import { Award, Briefcase, BookOpen, Bell } from "lucide-react";

export default function IndividualDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [lastCheckedId, setLastCheckedId] = useState<number>(0);

  useEffect(() => {
    if (user) {
      const profile = (user as any).profile;
      if (!profile?.onboarding_completed) {
        navigate("/onboarding");
        return;
      }
      if (profile?.account_type !== "individual") {
        navigate("/onboarding");
      }
    }
  }, [user, navigate]);

  // Poll for new orders every 10 seconds
  useEffect(() => {
    const checkForNewOrders = async () => {
      try {
        const response = await fetch("/api/partner/pending-orders");
        if (response.ok) {
          const orders = await response.json();
          setPendingOrders(orders);
          
          // Check if there's a new order (higher ID than last checked)
          if (orders.length > 0) {
            const latestOrder = orders[0];
            if (latestOrder.id > lastCheckedId) {
              setLastCheckedId(latestOrder.id);
              setCurrentOrder(latestOrder);
              setShowNotification(true);
            }
          }
        }
      } catch (error) {
        console.error("Error checking for orders:", error);
      }
    };

    // Check immediately
    checkForNewOrders();
    
    // Then check every 10 seconds
    const interval = setInterval(checkForNewOrders, 10000);
    
    return () => clearInterval(interval);
  }, [lastCheckedId]);

  const handleAcceptOrder = async (orderId: number) => {
    try {
      const response = await fetch(`/api/partner/orders/${orderId}/accept`, {
        method: "POST",
      });
      
      if (response.ok) {
        setShowNotification(false);
        setCurrentOrder(null);
        // Remove from pending orders
        setPendingOrders(pendingOrders.filter(o => o.id !== orderId));
      }
    } catch (error) {
      console.error("Error accepting order:", error);
    }
  };

  const handleRejectOrder = async (orderId: number) => {
    try {
      const response = await fetch(`/api/partner/orders/${orderId}/reject`, {
        method: "POST",
      });
      
      if (response.ok) {
        setShowNotification(false);
        setCurrentOrder(null);
        // Remove from pending orders
        setPendingOrders(pendingOrders.filter(o => o.id !== orderId));
      }
    } catch (error) {
      console.error("Error rejecting order:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto pb-20 lg:pb-0">
        {/* Daily Action Feed */}
        <DailyActionFeed />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Individual Dashboard</h1>
          <p className="text-gray-600">Track your professional growth and opportunities</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
              <Bell className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{pendingOrders.length}</h3>
            <p className="text-sm text-gray-600">Pending Bookings</p>
            {pendingOrders.length > 0 && (
              <div className="absolute top-2 right-2">
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">0</h3>
            <p className="text-sm text-gray-600">Skills Certified</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <Briefcase className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">0</h3>
            <p className="text-sm text-gray-600">Job Invitations</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">0</h3>
            <p className="text-sm text-gray-600">Courses Enrolled</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome to Your Professional Dashboard</h2>
          <p className="text-green-100 mb-6">
            Your profile has been created successfully. Enhance your skills and discover new opportunities.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h4 className="font-semibold mb-1">Build Your Skills</h4>
              <p className="text-sm text-green-100">Complete courses and earn certificates</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h4 className="font-semibold mb-1">Explore Jobs</h4>
              <p className="text-sm text-green-100">Find opportunities that match your expertise</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <h4 className="font-semibold mb-1">Network & Learn</h4>
              <p className="text-sm text-green-100">Connect with industry professionals</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Order Notification Modal */}
      {showNotification && currentOrder && (
        <PartnerOrderNotification
          order={currentOrder}
          onAccept={handleAcceptOrder}
          onReject={handleRejectOrder}
          onClose={() => {
            setShowNotification(false);
            setCurrentOrder(null);
          }}
        />
      )}
      
      <ChatBot />
    </DashboardLayout>
  );
}
