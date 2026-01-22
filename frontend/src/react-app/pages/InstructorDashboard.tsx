import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import CreateCourseModal from "@/react-app/components/CreateCourseModal";
import EditCourseModal from "@/react-app/components/EditCourseModal";
import {
  DollarSign,
  TrendingUp,
  Users,
  BookOpen,
  Plus,
  Edit,
  Eye,
  Star,
  BarChart3,
  Clock,
  Check,
} from "lucide-react";
import { getLocalizedPrice } from "@/shared/currency-utils";

interface Course {
  id: number;
  title: string;
  category: string;
  price: number;
  currency: string;
  total_enrollments: number;
  total_revenue: number;
  average_rating: number;
  total_reviews: number;
  approval_status: string;
  is_active: boolean;
  image_url: string;
  thumbnail_gradient: string;
  created_at: string;
}

interface EarningsData {
  total_earnings: number;
  currency: string;
  pending_earnings: number;
  lifetime_earnings: number;
  this_month_earnings: number;
}

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [userCountry, setUserCountry] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [coursesRes, earningsRes, profileRes] = await Promise.all([
        fetch("/api/courses/instructor/my-courses"),
        fetch("/api/courses/instructor/earnings"),
        fetch("/api/users/me"),
      ]);

      if (coursesRes.ok) {
        const data = await coursesRes.json();
        setCourses(data);
      }

      if (earningsRes.ok) {
        const data = await earningsRes.json();
        setEarnings(data);
      }

      if (profileRes.ok) {
        const data = await profileRes.json();
        setUserCountry(data.profile?.country || null);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseCreated = () => {
    setShowCreateModal(false);
    loadDashboardData();
  };

  const handleCourseUpdated = () => {
    setEditingCourse(null);
    loadDashboardData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <Check className="w-3 h-3" />
            Approved
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto mb-20 lg:mb-0">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Instructor Dashboard
            </h1>
            <p className="text-gray-600">Manage your courses and track your earnings</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-md transition-all font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Create Course</span>
          </button>
        </div>

        {/* Earnings Overview */}
        {earnings && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5" />
                <h3 className="text-sm font-medium opacity-90">Total Earnings</h3>
              </div>
              <p className="text-3xl font-bold">
                {getLocalizedPrice(earnings.total_earnings, earnings.currency, userCountry).formatted}
              </p>
              <p className="text-xs opacity-75 mt-1">Available for withdrawal</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5" />
                <h3 className="text-sm font-medium opacity-90">This Month</h3>
              </div>
              <p className="text-3xl font-bold">
                {getLocalizedPrice(earnings.this_month_earnings, earnings.currency, userCountry).formatted}
              </p>
              <p className="text-xs opacity-75 mt-1">Current month revenue</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5" />
                <h3 className="text-sm font-medium opacity-90">Lifetime</h3>
              </div>
              <p className="text-3xl font-bold">
                {getLocalizedPrice(earnings.lifetime_earnings, earnings.currency, userCountry).formatted}
              </p>
              <p className="text-xs opacity-75 mt-1">All-time earnings</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5" />
                <h3 className="text-sm font-medium opacity-90">Active Courses</h3>
              </div>
              <p className="text-3xl font-bold">
                {courses.filter((c) => c.is_active && c.approval_status === "approved").length}
              </p>
              <p className="text-xs opacity-75 mt-1">Published and selling</p>
            </div>
          </div>
        )}

        {/* Courses List */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">My Courses</h2>

          {courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No courses yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start sharing your knowledge and earn money
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-md transition-all font-medium"
              >
                Create Your First Course
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => {
                const revenue = getLocalizedPrice(
                  course.total_revenue || 0,
                  course.currency,
                  userCountry
                );

                return (
                  <div
                    key={course.id}
                    className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all"
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        {course.image_url ? (
                          <img
                            src={course.image_url}
                            alt={course.title}
                            className="w-32 h-24 object-cover rounded-lg"
                          />
                        ) : (
                          <div
                            className={`w-32 h-24 rounded-lg bg-gradient-to-br ${
                              course.thumbnail_gradient ||
                              "from-blue-500 to-indigo-600"
                            } flex items-center justify-center`}
                          >
                            <BookOpen className="w-8 h-8 text-white opacity-80" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {course.title}
                            </h3>
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-sm text-gray-600">
                                {course.category}
                              </span>
                              {getStatusBadge(course.approval_status)}
                              {!course.is_active && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                  Inactive
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => setEditingCourse(course)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>{course.total_enrollments} students</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>
                              {course.average_rating.toFixed(1)} ({course.total_reviews})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            <span>
                              {course.price === 0
                                ? "Free"
                                : getLocalizedPrice(course.price, course.currency, userCountry).formatted}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                            <TrendingUp className="w-4 h-4" />
                            <span>{revenue.formatted} earned</span>
                          </div>
                          <button
                            onClick={() => navigate(`/learning-center`)}
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Live</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showCreateModal && (
          <CreateCourseModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleCourseCreated}
          />
        )}

        {editingCourse && (
          <EditCourseModal
            course={editingCourse}
            isOpen={true}
            onClose={() => setEditingCourse(null)}
            onSuccess={handleCourseUpdated}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
