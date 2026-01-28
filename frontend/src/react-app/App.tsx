import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@/react-app/contexts/AuthContext";
import { ToastProvider } from "@/react-app/components/ToastContainer";
import "@/react-app/styles/animations.css";

import HomePage from "@/react-app/pages/Home";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import DashboardPage from "@/react-app/pages/Dashboard";
import ManualsPage from "@/react-app/pages/Manuals";
import JobsPage from "@/react-app/pages/Jobs";
import NewsPage from "@/react-app/pages/News";
import NewsDetailPage from "@/react-app/pages/NewsDetail";
import ProfilePage from "@/react-app/pages/Profile";
import EditProfilePage from "@/react-app/pages/EditProfile";
import SettingsPage from "@/react-app/pages/Settings";
import LearningCenterPage from "@/react-app/pages/LearningCenter";
import CConnectPage from "@/react-app/pages/CConnect";
import MyPostsPage from "@/react-app/pages/MyPosts";
import SavedPostsPage from "@/react-app/pages/SavedPosts";
import ExhibitionsPage from "@/react-app/pages/Exhibitions";
import MyExhibitionsPage from "@/react-app/pages/MyExhibitions";
import SavedExhibitionsPage from "@/react-app/pages/SavedExhibitions";
import GlobalChatPage from "@/react-app/pages/GlobalChat";
import AdminDashboard from "@/react-app/pages/AdminDashboard";
import ServicesPage from "@/react-app/pages/Services";
import FundraisingPage from "@/react-app/pages/Fundraising";
import OnboardingPage from "@/react-app/pages/Onboarding";
import LoginPage from "@/react-app/pages/Login";
import BusinessDashboardPage from "@/react-app/pages/BusinessDashboard";
import IndividualDashboardPage from "@/react-app/pages/IndividualDashboard";
import FreelancerDashboardPage from "@/react-app/pages/FreelancerDashboard";
import SubscriptionPlansPage from "@/react-app/pages/SubscriptionPlans";
import GamificationPage from "@/react-app/pages/Gamification";
import ProductPortfolio from "@/react-app/pages/ProductPortfolio";
import DirectMessagePage from "@/react-app/pages/DirectMessage";
import EarnPage from "@/react-app/pages/Earn";
import AdminBookingSyncPage from "@/react-app/pages/AdminBookingSync";
import PatientDashboard from "@/react-app/pages/PatientDashboard";
import InstructorDashboard from "@/react-app/pages/InstructorDashboard";
import CoursePlayer from "@/react-app/pages/CoursePlayer";
import Marketplace from "@/react-app/pages/Marketplace";


const appRoutes = [
  { path: "/", element: <HomePage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/auth/callback", element: <AuthCallbackPage /> },
  { path: "/onboarding", element: <OnboardingPage /> },

  { path: "/dashboard", element: <DashboardPage /> },
  { path: "/business-dashboard", element: <BusinessDashboardPage /> },
  { path: "/individual-dashboard", element: <IndividualDashboardPage /> },
  { path: "/freelancer-dashboard", element: <FreelancerDashboardPage /> },
  { path: "/patient-dashboard", element: <PatientDashboard /> },
  { path: "/instructor-dashboard", element: <InstructorDashboard /> },
  { path: "/courses/:courseId/play", element: <CoursePlayer /> },
  { path: "/marketplace", element: <Marketplace /> },

  { path: "/manuals", element: <ManualsPage /> },
  { path: "/jobs", element: <JobsPage /> },

  { path: "/news", element: <NewsPage /> },
  { path: "/news/:id", element: <NewsDetailPage /> },

  { path: "/profile", element: <ProfilePage /> },
  { path: "/profile/edit", element: <EditProfilePage /> },
  { path: "/edit-profile", element: <EditProfilePage /> },
  { path: "/settings", element: <SettingsPage /> },

  { path: "/learning", element: <LearningCenterPage /> },
  { path: "/connect", element: <CConnectPage /> },

  { path: "/my-posts", element: <MyPostsPage /> },
  { path: "/saved-posts", element: <SavedPostsPage /> },

  { path: "/exhibitions", element: <ExhibitionsPage /> },
  { path: "/my-exhibitions", element: <MyExhibitionsPage /> },
  { path: "/saved-exhibitions", element: <SavedExhibitionsPage /> },

  { path: "/global-chat", element: <GlobalChatPage /> },
  { path: "/direct-message/:userId", element: <DirectMessagePage /> },

  { path: "/services", element: <ServicesPage /> },
  { path: "/fundraising", element: <FundraisingPage /> },
  { path: "/subscription-plans", element: <SubscriptionPlansPage /> },
  { path: "/gamification", element: <GamificationPage /> },
  { path: "/product-portfolio", element: <ProductPortfolio /> },
  { path: "/earn", element: <EarnPage /> },

  { path: "/admin/dashboard", element: <AdminDashboard /> },
  { path: "/admin/booking-sync", element: <AdminBookingSyncPage /> },
];


export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {appRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={route.element}
              />
            ))}
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}
