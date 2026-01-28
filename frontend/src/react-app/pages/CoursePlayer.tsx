import { useState, useEffect } from "react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { useParams, useNavigate } from "react-router";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import {
  ChevronLeft,
  CheckCircle,
  Circle,
  Lock,
  PlayCircle,
  BookOpen,
  FileText,
  Award,
} from "lucide-react";

interface Module {
  id: number;
  module_number: number;
  title: string;
  description: string;
  lessons: Lesson[];
  total_lessons: number;
  completed_lessons: number;
}

interface Lesson {
  id: number;
  lesson_number: number;
  title: string;
  description: string;
  content_type: string;
  video_url: string;
  content: string;
  duration_minutes: number;
  is_free_preview: boolean;
  is_completed: boolean;
}

interface Course {
  id: number;
  title: string;
  description: string;
  instructor_name: string;
  category: string;
}

interface Progress {
  progress_percentage: number;
  is_completed: boolean;
}

export default function CoursePlayer() {
  const { user } = useAuth();
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [certificate, setCertificate] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate("/learning-center");
      return;
    }
    loadCourseData();
  }, [courseId, user]);

  const loadCourseData = async () => {
    setIsLoading(true);
    try {
      // Check enrollment
      const enrollmentRes = await fetch(`/api/courses/${courseId}/enrollment`);
      if (enrollmentRes.ok) {
        const enrollmentData = await enrollmentRes.json();
        if (!enrollmentData.is_enrolled) {
          navigate("/learning-center");
          return;
        }
        setIsEnrolled(true);
      }

      // Load course details
      const courseRes = await fetch(`/api/courses/${courseId}/details`);
      if (courseRes.ok) {
        const courseData = await courseRes.json();
        setCourse(courseData);
      }

      // Load modules and lessons
      const modulesRes = await fetch(`/api/courses/${courseId}/modules`);
      if (modulesRes.ok) {
        const modulesData = await modulesRes.json();
        setModules(modulesData);

        // Select first incomplete lesson or first lesson
        if (modulesData.length > 0) {
          for (const module of modulesData) {
            const incompleteLesson = module.lessons.find((l: Lesson) => !l.is_completed);
            if (incompleteLesson) {
              setSelectedLesson(incompleteLesson);
              break;
            }
          }
          // If all completed or no incomplete found, select first lesson
          if (!selectedLesson && modulesData[0].lessons.length > 0) {
            setSelectedLesson(modulesData[0].lessons[0]);
          }
        }
      }

      // Load progress
      const progressRes = await fetch(`/api/courses/${courseId}/progress`);
      if (progressRes.ok) {
        const progressData = await progressRes.json();
        setProgress(progressData);

        // If completed, check for certificate
        if (progressData.is_completed) {
          const certRes = await fetch(`/api/courses/${courseId}/certificate`, {
            method: "POST",
          });
          if (certRes.ok) {
            const certData = await certRes.json();
            setCertificate(certData);
          }
        }
      }
    } catch (error) {
      console.error("Error loading course data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLessonComplete = async (lessonId: number) => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        // Reload course data to update completion status
        loadCourseData();

        // Show completion message if course is now complete
        if (data.is_completed && !progress?.is_completed) {
          alert("Congratulations! You've completed this course! 🎉");
        }
      }
    } catch (error) {
      console.error("Error marking lesson complete:", error);
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

  if (!isEnrolled || !course) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto mb-20 lg:mb-0">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/learning-center")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Learning Center</span>
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
                <p className="text-gray-600">{course.instructor_name}</p>
              </div>
              {certificate && (
                <button
                  onClick={() => window.open(`/certificates/${certificate.certificate_number}`, "_blank")}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:shadow-md transition-all font-medium"
                >
                  <Award className="w-5 h-5" />
                  <span>View Certificate</span>
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Course Progress</span>
                <span className="font-semibold">{progress?.progress_percentage || 0}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                  style={{ width: `${progress?.progress_percentage || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Player & Content */}
          <div className="lg:col-span-2 space-y-6">
            {selectedLesson && (
              <>
                {/* Video Player */}
                {selectedLesson.video_url && (
                  <div className="bg-black rounded-2xl overflow-hidden shadow-lg aspect-video">
                    <video
                      key={selectedLesson.id}
                      className="w-full h-full"
                      controls
                      controlsList="nodownload"
                      onEnded={() => handleLessonComplete(selectedLesson.id)}
                    >
                      <source src={selectedLesson.video_url} type="video/mp4" />
                      Your browser does not support video playback.
                    </video>
                  </div>
                )}

                {/* Lesson Info */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900 mb-2">
                        {selectedLesson.title}
                      </h2>
                      {selectedLesson.description && (
                        <p className="text-gray-600">{selectedLesson.description}</p>
                      )}
                    </div>
                    {!selectedLesson.is_completed && (
                      <button
                        onClick={() => handleLessonComplete(selectedLesson.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>Mark Complete</span>
                      </button>
                    )}
                  </div>

                  {/* Lesson Content */}
                  {selectedLesson.content && (
                    <div className="mt-6 prose max-w-none">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Lesson Notes
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
                        {selectedLesson.content}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {!selectedLesson && modules.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <PlayCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Select a lesson to start learning
                </h3>
                <p className="text-gray-600">
                  Choose a lesson from the curriculum on the right
                </p>
              </div>
            )}
          </div>

          {/* Course Curriculum Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-6">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Course Curriculum
                </h3>
              </div>

              <div className="max-h-[70vh] overflow-y-auto">
                {modules.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <p>No modules available yet</p>
                  </div>
                ) : (
                  modules.map((module) => (
                    <div key={module.id} className="border-b border-gray-200 last:border-0">
                      <div className="p-4 bg-gray-50">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Module {module.module_number}: {module.title}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {module.completed_lessons} of {module.total_lessons} lessons completed
                        </p>
                      </div>

                      <div className="divide-y divide-gray-100">
                        {module.lessons.map((lesson) => (
                          <button
                            key={lesson.id}
                            onClick={() => setSelectedLesson(lesson)}
                            className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                              selectedLesson?.id === lesson.id ? "bg-blue-50" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {lesson.is_completed ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : lesson.is_free_preview || isEnrolled ? (
                                  <Circle className="w-5 h-5 text-gray-400" />
                                ) : (
                                  <Lock className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-gray-900 text-sm mb-1">
                                  {lesson.title}
                                </h5>
                                {lesson.duration_minutes && (
                                  <p className="text-xs text-gray-500">
                                    {lesson.duration_minutes} min
                                  </p>
                                )}
                              </div>
                              {selectedLesson?.id === lesson.id && (
                                <PlayCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
