import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { X, Star, User, Clock, BookOpen, Award, MessageSquare, Users } from "lucide-react";
import CourseReviewModal from "./CourseReviewModal";
import { getLocalizedPrice } from "@/shared/currency-utils";

interface CourseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  userId?: string;
}

interface Review {
  id: number;
  user_id: string;
  rating: number;
  review_text: string;
  full_name: string;
  profile_picture_url: string;
  created_at: string;
}

interface CourseDetails {
  id: number;
  title: string;
  description: string;
  category: string;
  duration_hours: number;
  modules_count: number;
  video_url: string;
  content: string;
  instructor_name: string;
  instructor_bio: string;
  instructor_image_url: string;
  instructor_credentials: string;
  learning_objectives: string;
  prerequisites: string;
  price: number;
  currency: string;
  average_rating: number;
  total_reviews: number;
  total_enrollments: number;
  image_url: string;
  equipment_name: string;
  equipment_model: string;
}

export default function CourseDetailModal({
  isOpen,
  onClose,
  courseId,
  userId,
}: CourseDetailModalProps) {
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "reviews">("overview");
  const [userCountry, setUserCountry] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && courseId) {
      loadCourseDetails();
    }
  }, [isOpen, courseId]);

  const loadCourseDetails = async () => {
    setIsLoading(true);
    try {
      const courseRes = await fetch(`/api/courses/${courseId}/details`);
      if (courseRes.ok) {
        const courseData = await courseRes.json();
        setCourse(courseData);
      }

      const reviewsRes = await fetch(`/api/courses/${courseId}/reviews`);
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData);
      }

      if (userId) {
        const enrollmentRes = await fetch(`/api/courses/${courseId}/enrollment`);
        if (enrollmentRes.ok) {
          const enrollmentData = await enrollmentRes.json();
          setIsEnrolled(enrollmentData.is_enrolled);
        }

        const userReviewRes = await fetch(`/api/courses/${courseId}/my-review`);
        if (userReviewRes.ok) {
          const reviewData = await userReviewRes.json();
          setHasReviewed(reviewData.has_reviewed);
        }

        const profileRes = await fetch("/api/users/me");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setUserCountry(profileData.profile?.country || null);
        }
      }
    } catch (error) {
      console.error("Error loading course details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
      });

      if (res.ok) {
        setIsEnrolled(true);
        alert("Successfully enrolled in the course!");
        loadCourseDetails();
      } else {
        alert("Failed to enroll in the course");
      }
    } catch (error) {
      console.error("Error enrolling:", error);
      alert("An error occurred");
    }
  };

  const handleSubmitReview = async (rating: number, reviewText: string) => {
    const res = await fetch(`/api/courses/${courseId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, review_text: reviewText }),
    });

    if (res.ok) {
      setHasReviewed(true);
      loadCourseDetails();
    } else {
      throw new Error("Failed to submit review");
    }
  };

  if (!isOpen || !course) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{course.title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Course Header */}
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {course.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-gray-900">
                          {course.average_rating.toFixed(1)}
                        </span>
                        <span className="text-gray-600 text-sm">
                          ({course.total_reviews} reviews)
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4">{course.description}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration_hours} hours</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        <span>{course.modules_count} modules</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{course.total_enrollments} enrolled</span>
                      </div>
                    </div>
                  </div>

                  {course.image_url && (
                    <div className="w-full md:w-64 h-48 rounded-lg overflow-hidden">
                      <img
                        src={course.image_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Instructor Info */}
                {course.instructor_name && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Instructor
                    </h3>
                    <div className="flex items-start gap-4">
                      {course.instructor_image_url ? (
                        <img
                          src={course.instructor_image_url}
                          alt={course.instructor_name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                          {course.instructor_name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {course.instructor_name}
                        </h4>
                        {course.instructor_credentials && (
                          <p className="text-sm text-gray-600 mb-2">
                            {course.instructor_credentials}
                          </p>
                        )}
                        {course.instructor_bio && (
                          <p className="text-sm text-gray-700">
                            {course.instructor_bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <div className="flex gap-6">
                    <button
                      onClick={() => setActiveTab("overview")}
                      className={`pb-3 font-medium transition-colors ${
                        activeTab === "overview"
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab("reviews")}
                      className={`pb-3 font-medium transition-colors ${
                        activeTab === "reviews"
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Reviews ({course.total_reviews})
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === "overview" ? (
                  <div className="space-y-6">
                    {course.equipment_name && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Equipment Covered
                        </h3>
                        <p className="text-gray-700">
                          {course.equipment_name}
                          {course.equipment_model && ` - ${course.equipment_model}`}
                        </p>
                      </div>
                    )}

                    {course.learning_objectives && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">
                          What You'll Learn
                        </h3>
                        <div className="space-y-2">
                          {course.learning_objectives.split("\n").map((obj, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <Award className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <p className="text-gray-700">{obj}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {course.prerequisites && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Prerequisites
                        </h3>
                        <p className="text-gray-700">{course.prerequisites}</p>
                      </div>
                    )}

                    {course.content && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Course Content
                        </h3>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {course.content}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userId && isEnrolled && !hasReviewed && (
                      <button
                        onClick={() => setShowReviewModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Write a Review
                      </button>
                    )}

                    {reviews.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p>No reviews yet. Be the first to review this course!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <div
                            key={review.id}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-start gap-3">
                              {review.profile_picture_url ? (
                                <img
                                  src={review.profile_picture_url}
                                  alt={review.full_name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                                  {review.full_name?.charAt(0) || "?"}
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-semibold text-gray-900">
                                    {review.full_name}
                                  </h4>
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-4 h-4 ${
                                          star <= review.rating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 mb-2">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </p>
                                {review.review_text && (
                                  <p className="text-gray-700 text-sm">
                                    {review.review_text}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200">
            {userId ? (
              isEnrolled ? (
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/courses/${courseId}/play`);
                  }}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Continue Learning
                </button>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    {course.price === 0 ? (
                      <p className="text-2xl font-bold text-green-600">Free Course</p>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-gray-900">
                          {getLocalizedPrice(course.price, course.currency, userCountry).formatted}
                        </p>
                        {userCountry && getLocalizedPrice(course.price, course.currency, userCountry).currency.code !== course.currency && (
                          <p className="text-xs text-gray-500 mt-1">
                            Original: {course.currency} {course.price}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <button
                    onClick={handleEnroll}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                  >
                    Enroll Now
                  </button>
                </div>
              )
            ) : (
              <button
                onClick={onClose}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {showReviewModal && (
        <CourseReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleSubmitReview}
          courseTitle={course.title}
        />
      )}
    </>
  );
}
