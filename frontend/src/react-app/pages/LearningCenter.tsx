import { useState, useEffect, useRef } from "react";
import { useAuth } from "@getmocha/users-service/react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import CreateCourseModal from "@/react-app/components/CreateCourseModal";
import CourseDetailModal from "@/react-app/components/CourseDetailModal";
import { getLocalizedPrice } from "@/shared/currency-utils";
import { GraduationCap, PlayCircle, Clock, BookOpen, Plus, Check, Star, Users, MoreHorizontal, Code, Flag } from "lucide-react";
import EditCourseModal from "@/react-app/components/EditCourseModal";
import DeleteConfirmModal from "@/react-app/components/DeleteConfirmModal";

interface Course {
  id: number | string;
  title: string;
  description: string;
  duration_hours: number;
  modules_count: number;
  category: string;
  thumbnail_gradient: string;
  image_url: string;
  average_rating: number;
  total_reviews: number;
  total_enrollments: number;
  instructor_name: string;
  price: number;
  currency: string;
  equipment_name: string;
  equipment_model: string;
  submitted_by_user_id?: string;
  video_url?: string;
  instructor_bio?: string;
  instructor_image_url?: string;
  instructor_credentials?: string;
  learning_objectives?: string;
  prerequisites?: string;
  course_outline?: string;
  content?: string;
}

export default function LearningCenter() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<Set<number>>(new Set());
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<number | string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenuForCourse, setShowMenuForCourse] = useState<number | string | null>(null);
  const menuRefs = useRef<Record<string | number, HTMLDivElement | null>>({});

  const categories = ["All", "Equipment Maintenance", "Safety Protocols", "Diagnostics", "Regulations", "Clinical Skills", "Technology"];

  useEffect(() => {
    loadCourses();
    if (user) {
      loadEnrollments();
      loadUserProfile();
    }
  }, [selectedCategory, user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenuForCourse !== null) {
        const menuElement = menuRefs.current[showMenuForCourse];
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setShowMenuForCourse(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenuForCourse]);

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/courses?category=${selectedCategory}`);
      if (res.ok) {
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error loading courses:", error);
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEnrollments = async () => {
    try {
      const res = await fetch("/api/courses/my-enrollments");
      if (res.ok) {
        const data = await res.json();
        setEnrolledCourses(new Set(data.map((e: any) => e.course_id)));
      }
    } catch (error) {
      console.error("Error loading enrollments:", error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const res = await fetch("/api/users/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUserCountry(data.profile?.country || null);
        const userId = data.profile?.user_id || data.user_id || (user as any)?.user_id || (user as any)?.id;
        setCurrentUserId(userId);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const handleCourseSubmitted = () => {
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 4000);
    loadCourses();
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setShowMenuForCourse(null);
  };

  const handleDelete = async (courseId: number | string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setCourses(courses.filter(c => c.id !== courseId));
        setDeletingCourseId(null);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete course");
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Failed to delete course");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    loadCourses();
    setEditingCourse(null);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const filteredCourses = selectedCategory === "All"
    ? courses
    : courses.filter((course) => course.category === selectedCategory);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto mb-20 lg:mb-0">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Center</h1>
            <p className="text-gray-600">Advance your skills with expert-led courses and certifications</p>
          </div>
          {user && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-md transition-all font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Submit Course</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const isEnrolled = enrolledCourses.has(course.id);
              const localizedPrice = getLocalizedPrice(course.price, course.currency, userCountry);
              const isOwner = currentUserId && course.submitted_by_user_id && String(currentUserId) === String(course.submitted_by_user_id);

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 relative"
                >
                  <div className={`h-48 bg-gradient-to-br ${course.thumbnail_gradient || "from-blue-500 to-cyan-500"} flex items-center justify-center relative overflow-hidden`}>
                    {course.image_url ? (
                      <img
                        src={course.image_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <PlayCircle className="w-16 h-16 text-white opacity-90" />
                    )}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      {isEnrolled && (
                        <div className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Enrolled
                        </div>
                      )}
                      {isOwner && (
                        <div className="relative z-10" ref={(el) => { menuRefs.current[course.id] = el; }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMenuForCourse(showMenuForCourse === course.id ? null : course.id);
                            }}
                            className="p-2 bg-white hover:bg-gray-100 rounded-lg shadow-md transition-colors"
                            title="Options"
                          >
                            <MoreHorizontal className="w-5 h-5 text-gray-600" />
                          </button>
                          {showMenuForCourse === course.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-64 z-50">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(course);
                                }}
                                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                              >
                                <Code className="w-5 h-5" />
                                <span className="text-sm font-medium">Edit Course</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingCourseId(course.id);
                                  setShowMenuForCourse(null);
                                }}
                                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-red-600"
                              >
                                <Flag className="w-5 h-5" />
                                <span className="text-sm font-medium">Delete Course</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-6" onClick={() => setSelectedCourseId(typeof course.id === 'number' ? course.id : parseInt(String(course.id), 10))}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {course.category}
                      </span>
                      {course.total_reviews > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium text-gray-700">
                            {course.average_rating.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({course.total_reviews})
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                      {course.description}
                    </p>
                    {course.equipment_name && (
                      <div className="mb-3 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                        {course.equipment_name}
                        {course.equipment_model && ` - ${course.equipment_model}`}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration_hours}h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{course.modules_count} modules</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{course.total_enrollments}</span>
                      </div>
                    </div>
                    {course.instructor_name && (
                      <p className="text-xs text-gray-500 mb-4">
                        Instructor: {course.instructor_name}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        {course.price === 0 ? (
                          <span className="text-lg font-bold text-green-600">Free</span>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">
                            {localizedPrice.formatted}
                          </span>
                        )}
                      </div>
                      <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-md transition-all font-medium text-sm">
                        {isEnrolled ? "Continue" : "View Details"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && filteredCourses.length === 0 && (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">Try selecting a different category</p>
          </div>
        )}

        {showCreateModal && (
          <CreateCourseModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleCourseSubmitted}
          />
        )}

        {selectedCourseId && (
          <CourseDetailModal
            isOpen={true}
            onClose={() => {
              setSelectedCourseId(null);
              loadCourses();
              if (user) loadEnrollments();
            }}
            courseId={selectedCourseId}
            userId={user?.id}
          />
        )}

        {showSuccessToast && (
          <div className="fixed bottom-24 lg:bottom-8 right-8 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up z-50">
            <Check className="w-5 h-5" />
            <span className="font-medium">Course submitted successfully! It will be reviewed by our team.</span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
