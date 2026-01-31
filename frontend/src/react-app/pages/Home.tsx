import { useAuth } from "@/react-app/contexts/AuthContext";
import { useNavigate } from "react-router";
import { 
  Briefcase, 
  Network, 
  GraduationCap,
  Loader2,
  Search,
  Users,
  TrendingUp,
  Award,
  ArrowRight,
  Building2,
  Megaphone,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Send,
  Check,
  ChevronDown,
  Youtube,
  Linkedin,
  Facebook,
  Instagram,
  Menu,
  X,
  HelpCircle,
  HeadphonesIcon,
  Heart,
  Share2,
  Bookmark,
  Star,
  Stethoscope,
  Ambulance,
  Activity,
  Wrench,
  Sparkles,
  Shield,
  Clock,
  CheckCircle2,
  Play,
  Zap,
  Scissors
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import SignInPromptModal from "@/react-app/components/SignInPromptModal";
import type { Job, NewsWithCounts } from "@/shared/types";
import type { ExhibitionWithCounts } from "@/shared/exhibition-types";
import { shuffleArray } from "@/shared/utils";

type LegalModal = "privacy" | "terms" | "refund" | null;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
  type: 'plus' | 'heart' | 'circle' | 'pulse' | 'dna';
  color: string;
  pulsePhase: number;
}

function HealthcareParticleTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -100, y: -100 });
  const prevMouseRef = useRef({ x: -100, y: -100 });
  const animationRef = useRef<number | undefined>(undefined);
  const isMovingRef = useRef(false);

  const colors = [
    '#22c55e', // green
    '#3b82f6', // blue
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#8b5cf6', // violet
    '#f97316', // orange
    '#14b8a6', // teal
  ];

  const particleTypes: Particle['type'][] = ['plus', 'heart', 'circle', 'pulse', 'dna'];

  const spawnParticle = useCallback((x: number, y: number) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    const particle: Particle = {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1, 
      size: 6 + Math.random() * 10,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      life: 1,
      maxLife: 1,
      type: particleTypes[Math.floor(Math.random() * particleTypes.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      pulsePhase: Math.random() * Math.PI * 2,
    };
    particlesRef.current.push(particle);
  }, []);

  const drawParticle = useCallback((ctx: CanvasRenderingContext2D, p: Particle) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.life * 0.8;

    ctx.shadowColor = p.color;
    ctx.shadowBlur = 15 * p.life;

    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2;

    const s = p.size * (0.5 + p.life * 0.5); // shrink as it fades

    switch (p.type) {
      case 'plus':
        ctx.beginPath();
        ctx.rect(-s / 4, -s / 2, s / 2, s);
        ctx.rect(-s / 2, -s / 4, s, s / 2);
        ctx.fill();
        break;

      case 'heart':
        // Heart shape
        ctx.beginPath();
        const hs = s * 0.6;
        ctx.moveTo(0, hs * 0.3);
        ctx.bezierCurveTo(-hs, -hs * 0.5, -hs, hs * 0.5, 0, hs);
        ctx.bezierCurveTo(hs, hs * 0.5, hs, -hs * 0.5, 0, hs * 0.3);
        ctx.fill();
        break;

      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = p.life * 0.4;
        ctx.beginPath();
        ctx.arc(0, 0, s / 3, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'pulse':
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const pw = s * 1.5;
        ctx.moveTo(-pw, 0);
        ctx.lineTo(-pw * 0.5, 0);
        ctx.lineTo(-pw * 0.3, -s * 0.8);
        ctx.lineTo(-pw * 0.1, s * 0.4);
        ctx.lineTo(pw * 0.1, 0);
        ctx.lineTo(pw * 0.3, -s * 0.3);
        ctx.lineTo(pw * 0.5, 0);
        ctx.lineTo(pw, 0);
        ctx.stroke();
        break;

      case 'dna':
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        const dnaLen = s;
        const phase = p.pulsePhase + p.rotation * 2;
        for (let i = 0; i < 3; i++) {
          const t = i / 2;
          const y1 = (t - 0.5) * dnaLen;
          const x1 = Math.sin(phase + t * Math.PI) * s * 0.4;
          const x2 = Math.sin(phase + t * Math.PI + Math.PI) * s * 0.4;
          
          ctx.beginPath();
          ctx.arc(x1, y1, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x2, y1, 3, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.globalAlpha = p.life * 0.5;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y1);
          ctx.stroke();
          ctx.globalAlpha = p.life * 0.8;
        }
        break;
    }

    ctx.restore();
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Check if mouse is moving
    const dx = mouseRef.current.x - prevMouseRef.current.x;
    const dy = mouseRef.current.y - prevMouseRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Only spawn particles when mouse is moving
    if (mouseRef.current.x > 0 && distance > 2) {
      isMovingRef.current = true;
      // Spawn more particles based on movement speed
      const particleCount = Math.min(Math.ceil(distance / 10), 3);
      for (let i = 0; i < particleCount; i++) {
        spawnParticle(
          mouseRef.current.x + (Math.random() - 0.5) * 10,
          mouseRef.current.y + (Math.random() - 0.5) * 10
        );
      }
    } else {
      isMovingRef.current = false;
    }
    
    prevMouseRef.current = { ...mouseRef.current };

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(p => {
      // Update physics
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02; // slight gravity
      p.vx *= 0.99; // friction
      p.vy *= 0.99;
      p.rotation += p.rotationSpeed;
      p.life -= 0.015; // fade rate
      p.pulsePhase += 0.1;

      if (p.life <= 0) return false;

      drawParticle(ctx, p);
      return true;
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [spawnParticle, drawParticle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        mouseRef.current = { x: touch.clientX, y: touch.clientY };
      }
    };

    const handleTouchEnd = () => {
      mouseRef.current = { x: -100, y: -100 };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -100, y: -100 };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('mouseleave', handleMouseLeave);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[60]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}


export default function Home() {
  const { isPending, redirectToLogin, user } = useAuth();
  const navigate = useNavigate();
  const [, setCurrentSlide] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [activeLegalModal, setActiveLegalModal] = useState<LegalModal>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [signInPromptMessage, setSignInPromptMessage] = useState("");
  const [latestJobs, setLatestJobs] = useState<Job[]>([]);
  const [latestExhibitions, setLatestExhibitions] = useState<ExhibitionWithCounts[]>([]);
  const [latestNews, setLatestNews] = useState<NewsWithCounts[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResults, setSearchResults] = useState({
    jobs: [] as Job[],
    exhibitions: [] as ExhibitionWithCounts[],
    news: [] as NewsWithCounts[],
    faqs: [] as Array<{ question: string; answer: string; category: string }>
  });
  const [isSearching, setIsSearching] = useState(false);
  const [activeServiceTab, setActiveServiceTab] = useState<"patient" | "professional">("patient");
  const [heroCounter, setHeroCounter] = useState({ patients: 0, professionals: 0, services: 0 });
  const [ribbonCut, setRibbonCut] = useState(true); // Default to cut until we load settings
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number }>>([]);
  const [ribbonAnimating, setRibbonAnimating] = useState(false);
  const [ribbonText, setRibbonText] = useState({
    heading: "Grand Opening",
    subheading: "Welcome to the Future of Healthcare",
    instruction: "Cut the ribbon to enter",
    buttonText: "CUT",
    badgeText: "VIP Launch"
  });
  
  // Fetch ribbon settings on mount
  useEffect(() => {
    const fetchRibbonSettings = async () => {
      try {
        const res = await fetch("/api/ribbon-settings");
        if (res.ok) {
          const settings = await res.json();
          const isEnabled = settings.ribbon_cutting_enabled === "true";
          const serverVersion = settings.ribbon_version || "1";
          const localVersion = localStorage.getItem('mavy-ribbon-version') || "";
          const wasCut = localStorage.getItem('mavy-ribbon-cut') === 'true';
          
          // Update ribbon text from settings
          setRibbonText({
            heading: settings.ribbon_heading || "Grand Opening",
            subheading: settings.ribbon_subheading || "Welcome to the Future of Healthcare",
            instruction: settings.ribbon_instruction || "Cut the ribbon to enter",
            buttonText: settings.ribbon_button_text || "CUT",
            badgeText: settings.ribbon_badge_text || "VIP Launch"
          });
          
          // Show ribbon if enabled AND (never cut OR version changed)
          if (isEnabled && (!wasCut || localVersion !== serverVersion)) {
            setRibbonCut(false);
            localStorage.setItem('mavy-ribbon-version', serverVersion);
          }
        }
      } catch (error) {
        console.error("Error fetching ribbon settings:", error);
      }
    };
    fetchRibbonSettings();
  }, []);

  const handleRibbonCut = () => {
    if (ribbonAnimating) return;
    setRibbonAnimating(true);
    
    // Generate confetti particles
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'];
    const particles: Array<{ id: number; x: number; y: number; color: string; delay: number }> = [];
    for (let i = 0; i < 150; i++) {
      particles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5
      });
    }
    setConfetti(particles);
    
    // After animation, hide ribbon and save to localStorage
    setTimeout(() => {
      setRibbonCut(true);
      localStorage.setItem('mavy-ribbon-cut', 'true');
      setConfetti([]);
    }, 3000);
  };

  const faqCategories = [
    {
      title: "General",
      icon: <HelpCircle className="w-6 h-6" />,
      gradient: "from-blue-500 to-cyan-500",
      questions: [
        {
          id: "general-1",
          question: "What is Mavy?",
          answer: "Mavy is a comprehensive healthcare platform serving both patients and healthcare professionals. Patients can book physiotherapy, nursing care, ambulance services, and medical equipment. Healthcare professionals can find jobs, learn, network, and grow their careers."
        },
        {
          id: "general-2",
          question: "What types of accounts are available?",
          answer: "Mavy offers accounts for Patients (to book healthcare services), Individual professionals (biomedical engineers in hospitals/companies), Freelancers (independent consultants), and Businesses (companies offering medical products and services)."
        },
        {
          id: "general-3",
          question: "Is Mavy free to use?",
          answer: "Yes! Mavy offers free access to core features. We also offer premium subscriptions (Mavy Plus, Mavy Pro, Mavy Max) with additional features like priority support, advanced search, unlimited downloads, and analytics."
        }
      ]
    },
    {
      title: "Patient Services",
      icon: <Heart className="w-6 h-6" />,
      gradient: "from-rose-500 to-pink-500",
      questions: [
        {
          id: "patient-1",
          question: "How do I book healthcare services?",
          answer: "Sign in to Mavy, go to the Patient Dashboard, and select the service you need (Physiotherapy, Nursing, Ambulance, or Equipment). Fill in the details, choose a professional, and confirm your booking."
        },
        {
          id: "patient-2",
          question: "Are the healthcare professionals verified?",
          answer: "Yes, all healthcare professionals on our platform undergo KYC verification. We verify their credentials, certifications, and experience before they can accept bookings."
        },
        {
          id: "patient-3",
          question: "What if I need to cancel a booking?",
          answer: "You can cancel bookings through your dashboard. Cancellation policies vary by service type and timing. We recommend canceling at least 24 hours before the scheduled appointment."
        }
      ]
    },
    {
      title: "Jobs & Careers",
      icon: <Briefcase className="w-6 h-6" />,
      gradient: "from-purple-500 to-indigo-500",
      questions: [
        {
          id: "jobs-1",
          question: "Can I post job opportunities?",
          answer: "Yes! Businesses and individuals can post job listings. Go to Jobs section and click 'Post a Job'. You can list full-time positions, contracts, gigs, or on-site service opportunities."
        },
        {
          id: "jobs-2",
          question: "How do I apply for jobs?",
          answer: "Browse the Jobs section, click on any listing that interests you, and apply directly. Employers will contact you if your profile matches their requirements."
        }
      ]
    },
    {
      title: "Learning & Certification",
      icon: <GraduationCap className="w-6 h-6" />,
      gradient: "from-amber-500 to-orange-500",
      questions: [
        {
          id: "learning-1",
          question: "How does the Learning Center work?",
          answer: "The Learning Center offers video courses on medical equipment and healthcare topics. Enroll in courses, track progress, and earn certificates upon completion."
        },
        {
          id: "learning-2",
          question: "Do I get certificates after completing courses?",
          answer: "Yes! Upon successfully completing a course, you'll receive a certificate that you can add to your profile and share with employers."
        }
      ]
    }
  ];

  // Animated counter effect
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    
    const targets = { patients: 10000, professionals: 5000, services: 25000 };
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setHeroCounter({
        patients: Math.round(targets.patients * easeOut),
        professionals: Math.round(targets.professionals * easeOut),
        services: Math.round(targets.services * easeOut)
      });
      
      if (step >= steps) clearInterval(timer);
    }, interval);
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchPreviewContent();
  }, []);



  const fetchPreviewContent = async () => {
    setLoadingContent(true);
    try {
      const jobsResponse = await fetch("/api/jobs");
      const jobsData = await jobsResponse.json();
      setLatestJobs(shuffleArray(jobsData as Job[]).slice(0, 3));

      const exhibitionsResponse = await fetch("/api/exhibitions");
      const exhibitionsData = await exhibitionsResponse.json();
      setLatestExhibitions(shuffleArray(exhibitionsData as ExhibitionWithCounts[]).slice(0, 3));

      const newsResponse = await fetch("/api/news?category=Technology");
      const newsData = await newsResponse.json();
      setLatestNews(shuffleArray(newsData as NewsWithCounts[]).slice(0, 3));
    } catch (error) {
      console.error("Error fetching preview content:", error);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleInteractionPrompt = (message: string) => {
    setSignInPromptMessage(message);
    setShowSignInPrompt(true);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm)
      });

      if (response.ok) {
        setSubmitStatus("success");
        setContactForm({ name: "", email: "", phone: "", subject: "", message: "" });
        setTimeout(() => setSubmitStatus("idle"), 5000);
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSearchModal(true);

    try {
      const query = searchQuery.toLowerCase();

      const jobsResponse = await fetch("/api/jobs");
      const jobs = await jobsResponse.json();
      const matchedJobs = jobs.filter((job: Job) =>
        job.title?.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query) ||
        job.company_name?.toLowerCase().includes(query)
      );

      const exhibitionsResponse = await fetch("/api/exhibitions");
      const exhibitions = await exhibitionsResponse.json();
      const matchedExhibitions = exhibitions.filter((exhibition: ExhibitionWithCounts) =>
        exhibition.title?.toLowerCase().includes(query) ||
        exhibition.description?.toLowerCase().includes(query)
      );

      const newsResponse = await fetch("/api/news");
      const news = await newsResponse.json();
      const matchedNews = news.filter((item: NewsWithCounts) =>
        item.title?.toLowerCase().includes(query) ||
        item.content?.toLowerCase().includes(query)
      );

      const matchedFaqs: Array<{ question: string; answer: string; category: string }> = [];
      faqCategories.forEach((category) => {
        category.questions.forEach((faq) => {
          if (faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query)) {
            matchedFaqs.push({ question: faq.question, answer: faq.answer, category: category.title });
          }
        });
      });

      setSearchResults({
        jobs: matchedJobs.slice(0, 5),
        exhibitions: matchedExhibitions.slice(0, 5),
        news: matchedNews.slice(0, 5),
        faqs: matchedFaqs.slice(0, 5)
      });
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setIsSearching(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500/30 rounded-full animate-spin border-t-blue-500"></div>
            <Sparkles className="w-8 h-8 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-blue-200 animate-pulse">Loading Mavy...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Healthcare Particle Trail Effect */}
      <HealthcareParticleTrail />
      {/* Grand Opening Ribbon Overlay */}
      {!ribbonCut && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
          {/* Dark backdrop with gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 transition-opacity duration-1000 ${ribbonAnimating ? 'opacity-0' : 'opacity-100'}`} />
          
          {/* Sparkle background */}
          <div className="absolute inset-0">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  opacity: Math.random() * 0.7 + 0.3
                }}
              />
            ))}
          </div>

          {/* Content container */}
          <div className={`relative z-10 text-center transition-all duration-1000 ${ribbonAnimating ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}>
            {/* Grand Opening Text */}
            <div className="mb-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm rounded-full border border-yellow-500/30 mb-6">
                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                <span className="text-yellow-300 font-semibold tracking-wider uppercase text-sm">{ribbonText.badgeText}</span>
                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
                <span className="bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">{ribbonText.heading}</span>
              </h1>
              <p className="text-xl text-blue-200 mb-2">{ribbonText.subheading}</p>
              <p className="text-lg text-gray-400">{ribbonText.instruction}</p>
            </div>

            {/* Ribbon Container */}
            <div className="relative">
              {/* Left Ribbon Tail */}
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[50vw] -translate-x-full transition-all duration-700 ${ribbonAnimating ? '-translate-x-[200%] -rotate-12' : ''}`}>
                <div className="h-20 bg-gradient-to-r from-red-700 via-red-600 to-red-500 shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/20" />
                  <div className="absolute top-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400/50 to-yellow-400" />
                  <div className="absolute bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400/50 to-yellow-400" />
                </div>
                <div className="absolute right-0 top-full w-16 h-12 bg-gradient-to-br from-red-600 to-red-800" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
              </div>

              {/* Right Ribbon Tail */}
              <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-[50vw] translate-x-full transition-all duration-700 ${ribbonAnimating ? 'translate-x-[200%] rotate-12' : ''}`}>
                <div className="h-20 bg-gradient-to-l from-red-700 via-red-600 to-red-500 shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/20" />
                  <div className="absolute top-2 left-0 right-0 h-1 bg-gradient-to-l from-transparent via-yellow-400/50 to-yellow-400" />
                  <div className="absolute bottom-2 left-0 right-0 h-1 bg-gradient-to-l from-transparent via-yellow-400/50 to-yellow-400" />
                </div>
                <div className="absolute left-0 top-full w-16 h-12 bg-gradient-to-bl from-red-600 to-red-800" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
              </div>

              {/* Center Cut Button */}
              <button
                onClick={handleRibbonCut}
                disabled={ribbonAnimating}
                className="relative group"
              >
                {/* Glowing ring */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 rounded-full blur-xl opacity-50 group-hover:opacity-80 animate-pulse scale-150" />
                
                {/* Button */}
                <div className="relative w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-yellow-300/50 group-hover:scale-110 transition-transform duration-300 cursor-pointer">
                  <div className="absolute inset-2 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 rounded-full" />
                  <div className="relative flex flex-col items-center">
                    <Scissors className="w-12 h-12 md:w-16 md:h-16 text-red-700 group-hover:rotate-45 transition-transform duration-300" />
                    <span className="text-red-800 font-bold text-sm mt-1">{ribbonText.buttonText}</span>
                  </div>
                </div>
              </button>
            </div>

            {/* Mavy Logo */}
            <div className="mt-12 flex items-center justify-center gap-3">
              <img 
                src="https://mocha-cdn.com/019aa4be-ddf3-7171-a6f8-d818a2612e58/34458975_transparent.png" 
                alt="Mavy Logo" 
                className="h-12 w-auto"
              />
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Mavy</span>
            </div>
          </div>

          {/* Confetti particles */}
          {confetti.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-3 h-3 animate-confetti"
              style={{
                left: `${particle.x}%`,
                top: '-5%',
                backgroundColor: particle.color,
                animationDelay: `${particle.delay}s`,
                borderRadius: Math.random() > 0.5 ? '50%' : '0%',
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}
        </div>
      )}

      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        <div className="mx-4 mt-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/10 border border-white/20">
            <div className="container mx-auto px-4 lg:px-6">
              <div className="flex items-center justify-between py-3">
                {/* Logo */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur-lg opacity-50"></div>
                    <img 
                      src="https://mocha-cdn.com/019aa4be-ddf3-7171-a6f8-d818a2612e58/34458975_transparent.png" 
                      alt="Mavy Logo" 
                      className="h-10 w-auto relative"
                    />
                  </div>
                  <div>
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Mavy</span>
                    <p className="text-[10px] text-gray-500 -mt-1">Healthcare Redefined</p>
                  </div>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-6">
                  <NavLink href="#services">Services</NavLink>
                  <NavLink href="#features">Features</NavLink>
                  <NavLink href="#testimonials">Reviews</NavLink>
                  <NavLink href="#faq">FAQ</NavLink>
                  <NavLink href="#contact">Contact</NavLink>
                </nav>

                {/* Desktop CTA */}
                <div className="hidden md:flex items-center gap-3">
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="pl-10 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 lg:w-48"
                    />
                  </form>
                  <button
                    onClick={() => {
                      if (user) {
                        navigate("/onboarding");
                      } else {
                        navigate("/login?method=gmail");
                      }
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105 text-sm flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Get Started
                  </button>
                </div>

                {/* Mobile Menu Button */}
                <div className="flex md:hidden items-center gap-2">
                  <button
                    onClick={() => setShowSearchModal(true)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <Search className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Mobile Navigation */}
              {mobileMenuOpen && (
                <nav className="md:hidden py-4 border-t border-gray-100">
                  <div className="flex flex-col space-y-3">
                    <MobileNavLink href="#services" onClick={() => setMobileMenuOpen(false)}>Services</MobileNavLink>
                    <MobileNavLink href="#features" onClick={() => setMobileMenuOpen(false)}>Features</MobileNavLink>
                    <MobileNavLink href="#testimonials" onClick={() => setMobileMenuOpen(false)}>Reviews</MobileNavLink>
                    <MobileNavLink href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</MobileNavLink>
                    <MobileNavLink href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</MobileNavLink>
                    <button
                      onClick={() => {
                        if (user) {
                          navigate("/onboarding");
                        } else {
                          navigate("/login?method=gmail");
                        }
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm mt-2"
                    >
                      Get Started Free
                    </button>
                  </div>
                </nav>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Immersive Full Screen */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
          
          {/* Floating Icons */}
          <div className="absolute top-32 left-[10%] animate-float">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <Stethoscope className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="absolute top-48 right-[15%] animate-float" style={{ animationDelay: '1s' }}>
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <Heart className="w-8 h-8 text-rose-400" />
            </div>
          </div>
          <div className="absolute bottom-40 left-[20%] animate-float" style={{ animationDelay: '2s' }}>
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <Activity className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="absolute bottom-32 right-[25%] animate-float" style={{ animationDelay: '0.5s' }}>
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <Briefcase className="w-8 h-8 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10 pt-24 pb-12">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-blue-200">India's Leading Healthcare Platform</span>
              <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-semibold">NEW</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-white">Healthcare at Your</span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">Fingertips</span>
            </h1>

            {/* Sub-headline */}
            <p className="text-lg md:text-xl text-blue-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              Book physiotherapy, nursing care, ambulance services & medical equipment instantly.
              <span className="text-white font-medium"> For healthcare professionals: </span>
              Find jobs, learn, network & grow your career.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => {
                  if (user) {
                    navigate("/onboarding");
                  } else {
                    navigate("/login?method=gmail");
                  }
                }}
                className="group px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3"
              >
                <span>Start Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-2xl font-semibold text-lg border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-3"
              >
                <Play className="w-5 h-5" />
                <span>Explore Services</span>
              </button>
            </div>

            {/* Stats Counter */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                  {heroCounter.patients.toLocaleString()}+
                </div>
                <div className="text-sm text-blue-300">Happy Patients</div>
              </div>
              <div className="text-center border-x border-white/20">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                  {heroCounter.professionals.toLocaleString()}+
                </div>
                <div className="text-sm text-blue-300">Professionals</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                  {heroCounter.services.toLocaleString()}+
                </div>
                <div className="text-sm text-blue-300">Services Done</div>
              </div>
            </div>
          </div>

          {/* App Store Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <a
              href="https://play.google.com/store/apps/details?id=com.mavy.themavytech&hl=en"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20"
            >
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              <div className="text-left">
                <div className="text-xs text-blue-200">GET IT ON</div>
                <div className="text-sm font-semibold text-white">Google Play</div>
              </div>
            </a>
            <a
              href="https://apps.apple.com/in/app/mavy-partner/id6740711624"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20"
            >
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05,20.28C16.23,21.23 15.39,22.08 14.42,22C13.46,21.93 13.12,21.35 12.04,21.35C10.96,21.35 10.58,22 9.66,22.08C8.74,22.15 7.82,21.21 7,20.28C5.32,18.38 4.03,14.73 5.76,12.19C6.61,10.93 8.04,10.16 9.58,10.08C10.5,10 11.37,10.64 12.04,10.64C12.71,10.64 13.85,9.89 15.02,10.05C15.56,10.08 17.18,10.27 18.27,11.89C18.17,11.96 16.31,13.09 16.35,15.47C16.39,18.28 18.72,19.23 18.74,19.24C18.71,19.32 18.36,20.56 17.05,20.28M13.5,3.5C14.2,2.65 14.86,1.5 14.7,0.35C13.69,0.4 12.46,1.04 11.73,1.89C11.08,2.64 10.38,3.84 10.57,4.96C11.69,5.05 12.81,4.35 13.5,3.5Z"/>
              </svg>
              <div className="text-left">
                <div className="text-xs text-blue-200">Download on the</div>
                <div className="text-sm font-semibold text-white">App Store</div>
              </div>
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-white/50" />
        </div>
      </section>

      {/* Services Section - Tabbed */}
      <section id="services" className="py-20 md:py-28 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-4">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Our Services</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">
              Everything You Need in
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Healthcare</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you're a patient seeking care or a healthcare professional building your career
            </p>
          </div>

          {/* Service Tabs */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex p-1.5 bg-gray-100 rounded-2xl">
              <button
                onClick={() => setActiveServiceTab("patient")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeServiceTab === "patient"
                    ? "bg-white text-blue-600 shadow-lg"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  For Patients
                </span>
              </button>
              <button
                onClick={() => setActiveServiceTab("professional")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeServiceTab === "professional"
                    ? "bg-white text-indigo-600 shadow-lg"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  For Professionals
                </span>
              </button>
            </div>
          </div>

          {/* Patient Services */}
          {activeServiceTab === "patient" && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
              <ServiceCard
                icon={<Activity className="w-8 h-8" />}
                title="Physiotherapy"
                description="Home visits by certified physiotherapists for rehabilitation, pain management & mobility"
                gradient="from-emerald-500 to-teal-500"
                features={["Home Visits", "Expert Therapists", "Personalized Plans"]}
                onClick={() => handleInteractionPrompt("Sign in to book physiotherapy services")}
              />
              <ServiceCard
                icon={<Heart className="w-8 h-8" />}
                title="Nursing Care"
                description="Professional nursing services including patient care, medication & post-operative support"
                gradient="from-rose-500 to-pink-500"
                features={["24/7 Available", "Trained Nurses", "Home Care"]}
                onClick={() => handleInteractionPrompt("Sign in to book nursing services")}
              />
              <ServiceCard
                icon={<Ambulance className="w-8 h-8" />}
                title="Ambulance"
                description="Emergency & non-emergency ambulance services with trained paramedics"
                gradient="from-red-500 to-orange-500"
                features={["Fast Response", "GPS Tracking", "Equipped Vehicles"]}
                onClick={() => handleInteractionPrompt("Sign in to book ambulance services")}
              />
              <ServiceCard
                icon={<Wrench className="w-8 h-8" />}
                title="Equipment"
                description="Rent wheelchairs, hospital beds, oxygen concentrators & medical devices"
                gradient="from-blue-500 to-indigo-500"
                features={["Wide Range", "Delivery", "Maintenance"]}
                onClick={() => handleInteractionPrompt("Sign in to rent medical equipment")}
              />
            </div>
          )}

          {/* Professional Services */}
          {activeServiceTab === "professional" && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
              <ServiceCard
                icon={<Briefcase className="w-8 h-8" />}
                title="Find Jobs"
                description="Discover opportunities in hospitals, companies & freelance projects"
                gradient="from-violet-500 to-purple-500"
                features={["Full-time", "Contracts", "Freelance"]}
                onClick={() => handleInteractionPrompt("Sign in to explore job opportunities")}
              />
              <ServiceCard
                icon={<GraduationCap className="w-8 h-8" />}
                title="Learn & Certify"
                description="Video courses on medical equipment, maintenance & healthcare tech"
                gradient="from-amber-500 to-orange-500"
                features={["Video Courses", "Certificates", "Expert Instructors"]}
                onClick={() => handleInteractionPrompt("Sign in to access learning center")}
              />
              <ServiceCard
                icon={<Network className="w-8 h-8" />}
                title="Network"
                description="Connect with doctors, engineers, manufacturers & healthcare leaders"
                gradient="from-cyan-500 to-blue-500"
                features={["Global Network", "Direct Messages", "Collaborations"]}
                onClick={() => handleInteractionPrompt("Sign in to start networking")}
              />
              <ServiceCard
                icon={<TrendingUp className="w-8 h-8" />}
                title="Grow Business"
                description="Showcase products, find dealers & expand your healthcare business"
                gradient="from-green-500 to-emerald-500"
                features={["Product Listing", "Lead Generation", "Analytics"]}
                onClick={() => handleInteractionPrompt("Sign in to grow your business")}
              />
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full mb-4">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-700">Why Choose Mavy</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                Trusted by Thousands Across India
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We're building the most reliable healthcare platform that connects patients with quality care and empowers healthcare professionals to thrive.
              </p>

              <div className="space-y-6">
                <FeatureRow
                  icon={<CheckCircle2 className="w-6 h-6 text-green-500" />}
                  title="Verified Professionals"
                  description="All healthcare providers undergo strict KYC verification"
                />
                <FeatureRow
                  icon={<Clock className="w-6 h-6 text-blue-500" />}
                  title="Quick Response"
                  description="Get connected with service providers within minutes"
                />
                <FeatureRow
                  icon={<Shield className="w-6 h-6 text-purple-500" />}
                  title="Secure Platform"
                  description="Your data is protected with enterprise-grade security"
                />
                <FeatureRow
                  icon={<Star className="w-6 h-6 text-amber-500" />}
                  title="Rated Excellence"
                  description="4.8/5 rating from 100+ reviews on app stores"
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur-3xl opacity-20"></div>
              <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <StatBox number="10K+" label="Active Users" icon={<Users className="w-5 h-5" />} />
                  <StatBox number="500+" label="Professionals" icon={<Award className="w-5 h-5" />} />
                  <StatBox number="25K+" label="Services Done" icon={<CheckCircle2 className="w-5 h-5" />} />
                  <StatBox number="4.8" label="App Rating" icon={<Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Content Preview */}
      <section id="content-preview" className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          {/* Jobs */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Latest Job Opportunities</h3>
                <p className="text-gray-600">Find your next career move in healthcare</p>
              </div>
              <button
                onClick={() => handleInteractionPrompt("Sign in to view all jobs")}
                className="hidden md:flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
              >
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {loadingContent ? (
              <div className="grid md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : latestJobs.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-6">
                {latestJobs.map((job) => (
                  <JobCard key={job.id} job={job} onClick={() => handleInteractionPrompt("Sign in to apply for this job")} />
                ))}
              </div>
            ) : (
              <EmptyState icon={<Briefcase />} title="No Jobs Available" subtitle="Check back soon for new opportunities" />
            )}
          </div>

          {/* Exhibitions */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Upcoming Medical Exhibitions</h3>
                <p className="text-gray-600">Industry events and conferences</p>
              </div>
              <button
                onClick={() => handleInteractionPrompt("Sign in to view all exhibitions")}
                className="hidden md:flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
              >
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {loadingContent ? (
              <div className="grid md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-6">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : latestExhibitions.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-6">
                {latestExhibitions.map((exhibition) => (
                  <ExhibitionCard key={exhibition.id} exhibition={exhibition} onClick={() => handleInteractionPrompt("Sign in to view exhibition details")} />
                ))}
              </div>
            ) : (
              <EmptyState icon={<Calendar />} title="No Exhibitions Available" subtitle="Check back for upcoming events" />
            )}
          </div>

          {/* News */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Latest Technology News</h3>
                <p className="text-gray-600">Stay updated with healthcare innovations</p>
              </div>
              <button
                onClick={() => handleInteractionPrompt("Sign in to read all news")}
                className="hidden md:flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
              >
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {loadingContent ? (
              <div className="grid md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-6">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : latestNews.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-6">
                {latestNews.map((news) => (
                  <NewsCard key={news.id} news={news} onClick={() => handleInteractionPrompt("Sign in to read full article")} onInteract={(msg) => handleInteractionPrompt(msg)} />
                ))}
              </div>
            ) : (
              <EmptyState icon={<Megaphone />} title="No News Available" subtitle="Check back for latest updates" />
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 md:py-28 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-4">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-medium text-blue-200">User Reviews</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
              Loved by Healthcare Community
            </h2>
            <p className="text-lg text-blue-200 max-w-2xl mx-auto">
              See what patients and professionals say about their Mavy experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TestimonialCard
              name="Dr. Priya Sharma"
              role="Hospital Administrator"
              rating={5}
              text="Mavy has transformed how we manage equipment services. Quick, reliable, and professional. Highly recommended for any healthcare facility."
              gradient="from-blue-500 to-cyan-500"
            />
            <TestimonialCard
              name="Rajesh Kumar"
              role="Biomedical Engineer"
              rating={5}
              text="Found my dream job through Mavy! The platform connects you with the right opportunities. The learning center is also fantastic for skill development."
              gradient="from-purple-500 to-pink-500"
            />
            <TestimonialCard
              name="Anita Patel"
              role="Patient"
              rating={5}
              text="Booked physiotherapy for my father - the therapist was excellent and came right on time. Very easy to use app and great customer support."
              gradient="from-emerald-500 to-teal-500"
            />
            <TestimonialCard
              name="Vikram Singh"
              role="Medical Equipment Dealer"
              rating={5}
              text="Great platform for business growth. Connected with hospitals and professionals across India. The lead quality is excellent."
              gradient="from-amber-500 to-orange-500"
            />
            <TestimonialCard
              name="Sunita Reddy"
              role="Nursing Professional"
              rating={5}
              text="Flexible work opportunities and good earnings. The app is user-friendly and payments are always on time. Very happy with Mavy!"
              gradient="from-rose-500 to-pink-500"
            />
            <TestimonialCard
              name="Mohammed Ali"
              role="Service Technician"
              rating={5}
              text="The service manuals library is incredibly helpful. Also love the global chat feature to connect with other engineers. Must-have for biomedical professionals."
              gradient="from-indigo-500 to-blue-500"
            />
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="font-semibold text-white">4.8 / 5.0</span>
              <span className="text-blue-200">•</span>
              <span className="text-blue-200">Based on 100+ app store reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-28 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-4">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">FAQ</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about Mavy
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {faqCategories.map((category) => (
              <div key={category.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className={`flex items-center gap-3 p-4 bg-gradient-to-r ${category.gradient}`}>
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white">
                    {category.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white">{category.title}</h3>
                </div>
                <div className="p-4 space-y-3">
                  {category.questions.map((faq) => (
                    <div key={faq.id} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                        className="w-full text-left p-4 flex items-start justify-between gap-3 hover:bg-gray-100 transition-colors"
                      >
                        <span className="font-medium text-gray-900 text-sm lg:text-base">{faq.question}</span>
                        <ChevronDown className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${expandedFaq === faq.id ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedFaq === faq.id && (
                        <div className="px-4 pb-4 text-gray-600 text-sm lg:text-base animate-fade-in">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 max-w-xl mx-auto">
              <HeadphonesIcon className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Still Have Questions?</h3>
              <p className="text-gray-600 mb-4">Our support team is here to help!</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="mailto:info@themavy.com" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                  Email Support
                </a>
                <a href="tel:+918886688864" className="px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all">
                  Call Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-4">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Contact Us</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Get in Touch</h2>
              <p className="text-lg text-gray-600 mb-8">Have questions or need assistance? We're here to help!</p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Email</p>
                    <a href="mailto:info@themavy.com" className="text-blue-600 hover:text-blue-700">info@themavy.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Phone</p>
                    <a href="tel:+918886688864" className="text-blue-600 hover:text-blue-700">+91 88866 88864</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Business Hours</p>
                    <p className="text-gray-600">Mon - Fri: 9AM - 6PM IST</p>
                    <p className="text-gray-600">Sat: 10AM - 4PM IST</p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="mt-8">
                <p className="font-semibold text-gray-900 mb-4">Follow Us</p>
                <div className="flex gap-3">
                  <SocialLink href="https://www.facebook.com/people/MAVY/61553710213992/" icon={<Facebook />} />
                  <SocialLink href="https://www.instagram.com/mavy_tech/" icon={<Instagram />} />
                  <SocialLink href="https://www.linkedin.com/in/mavy-tech-solutions-b9667028a" icon={<Linkedin />} />
                  <SocialLink href="https://www.youtube.com/@mavytechsolutions" icon={<Youtube />} />
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Send us a Message</h3>
              
              {submitStatus === "success" && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">Thank you! We'll get back to you within 24 hours.</p>
                </div>
              )}

              {submitStatus === "error" && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  Something went wrong. Please try again or email us directly.
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                  <input
                    type="text"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="How can we help?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
                    placeholder="Tell us more..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Transform Your Healthcare Experience?</h2>
            <p className="text-lg md:text-xl mb-8 text-blue-100">
              Join thousands of patients and healthcare professionals already using Mavy
            </p>
            <button
              onClick={() => {
                if (user) {
                  navigate("/onboarding");
                } else {
                  navigate("/login?method=gmail");
                }
              }}
              className="px-10 py-5 bg-white text-blue-600 rounded-2xl font-bold text-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 inline-flex items-center gap-3"
            >
              Get Started Free
              <ArrowRight className="w-6 h-6" />
            </button>
            <p className="mt-6 text-sm text-blue-200">No credit card required • Free forever plan available</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-300 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-8">
            <div className="col-span-2 md:col-span-4 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src="https://mocha-cdn.com/019aa4be-ddf3-7171-a6f8-d818a2612e58/34458975_transparent.png" alt="Mavy Logo" className="h-8 w-auto" />
                <span className="text-xl font-bold text-white">Mavy</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">Complete healthcare platform for patients and professionals</p>
              <div className="flex gap-3">
                <a href="https://play.google.com/store/apps/details?id=com.mavy.themavytech&hl=en" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-xs">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/></svg>
                  <span>Google Play</span>
                </a>
                <a href="https://apps.apple.com/in/app/mavy-partner/id6740711624" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-xs">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05,20.28C16.23,21.23 15.39,22.08 14.42,22C13.46,21.93 13.12,21.35 12.04,21.35C10.96,21.35 10.58,22 9.66,22.08C8.74,22.15 7.82,21.21 7,20.28C5.32,18.38 4.03,14.73 5.76,12.19C6.61,10.93 8.04,10.16 9.58,10.08C10.5,10 11.37,10.64 12.04,10.64C12.71,10.64 13.85,9.89 15.02,10.05C15.56,10.08 17.18,10.27 18.27,11.89C18.17,11.96 16.31,13.09 16.35,15.47C16.39,18.28 18.72,19.23 18.74,19.24C18.71,19.32 18.36,20.56 17.05,20.28M13.5,3.5C14.2,2.65 14.86,1.5 14.7,0.35C13.69,0.4 12.46,1.04 11.73,1.89C11.08,2.64 10.38,3.84 10.57,4.96C11.69,5.05 12.81,4.35 13.5,3.5Z"/></svg>
                  <span>App Store</span>
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#services" className="hover:text-blue-400 transition-colors">Services</a></li>
                <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
                <li><button onClick={redirectToLogin} className="hover:text-blue-400 transition-colors text-left">Jobs</button></li>
                <li><button onClick={redirectToLogin} className="hover:text-blue-400 transition-colors text-left">Learning</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#faq" className="hover:text-blue-400 transition-colors">FAQ</a></li>
                <li><a href="#contact" className="hover:text-blue-400 transition-colors">Support</a></li>
                <li><button onClick={redirectToLogin} className="hover:text-blue-400 transition-colors text-left">Manuals</button></li>
                <li><button onClick={redirectToLogin} className="hover:text-blue-400 transition-colors text-left">Exhibitions</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => setActiveLegalModal("privacy")} className="hover:text-blue-400 transition-colors text-left">Privacy Policy</button></li>
                <li><button onClick={() => setActiveLegalModal("terms")} className="hover:text-blue-400 transition-colors text-left">Terms</button></li>
                <li><button onClick={() => setActiveLegalModal("refund")} className="hover:text-blue-400 transition-colors text-left">Refund Policy</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:info@themavy.com" className="hover:text-blue-400 transition-colors flex items-center gap-2"><Mail className="w-4 h-4" />info@themavy.com</a></li>
                <li><a href="tel:+918886688864" className="hover:text-blue-400 transition-colors flex items-center gap-2"><Phone className="w-4 h-4" />+91 88866 88864</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">© 2025 Mavy. All Rights Reserved.</p>
            <div className="flex gap-3">
              <SocialLink href="https://www.facebook.com/people/MAVY/61553710213992/" icon={<Facebook className="w-4 h-4" />} small />
              <SocialLink href="https://www.instagram.com/mavy_tech/" icon={<Instagram className="w-4 h-4" />} small />
              <SocialLink href="https://www.linkedin.com/in/mavy-tech-solutions-b9667028a" icon={<Linkedin className="w-4 h-4" />} small />
              <SocialLink href="https://www.youtube.com/@mavytechsolutions" icon={<Youtube className="w-4 h-4" />} small />
            </div>
          </div>
        </div>
      </footer>

      {/* Legal Modals */}
      {activeLegalModal === "privacy" && <LegalModal title="Privacy Policy" onClose={() => setActiveLegalModal(null)} content={<PrivacyContent />} />}
      {activeLegalModal === "terms" && <LegalModal title="Terms & Conditions" onClose={() => setActiveLegalModal(null)} content={<TermsContent />} />}
      {activeLegalModal === "refund" && <LegalModal title="Refund Policy" onClose={() => setActiveLegalModal(null)} content={<RefundContent />} />}

      {/* Sign In Prompt */}
      <SignInPromptModal
        isOpen={showSignInPrompt}
        onClose={() => setShowSignInPrompt(false)}
        onSignIn={() => {
          setShowSignInPrompt(false);
          redirectToLogin();
        }}
        message={signInPromptMessage}
      />

      {/* Search Modal */}
      {showSearchModal && (
        <SearchModal
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
          isSearching={isSearching}
          searchResults={searchResults}
          onClose={() => setShowSearchModal(false)}
          onInteract={handleInteractionPrompt}
        />
      )}

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg) scale(0);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
      `}</style>
      
    </div>
  );
}

// Component definitions
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <a href={href} onClick={handleClick} className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
      {children}
    </a>
  );
}

function MobileNavLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
    onClick();
  };
  return (
    <a href={href} onClick={handleClick} className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors py-2">
      {children}
    </a>
  );
}

function ServiceCard({ icon, title, description, gradient, features, onClick }: { icon: React.ReactNode; title: string; description: string; gradient: string; features: string[]; onClick: () => void }) {
  return (
    <div onClick={onClick} className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 cursor-pointer hover:-translate-y-2">
      <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{title}</h3>
      <p className="text-gray-600 mb-4 text-sm">{description}</p>
      <div className="flex flex-wrap gap-2">
        {features.map((feature, i) => (
          <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{feature}</span>
        ))}
      </div>
    </div>
  );
}

function FeatureRow({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">{icon}</div>
      <div>
        <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </div>
  );
}

function StatBox({ number, label, icon }: { number: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
      <div className="flex items-center justify-center gap-2 mb-2 text-white/80">{icon}</div>
      <div className="text-3xl font-bold text-white mb-1">{number}</div>
      <div className="text-sm text-white/60">{label}</div>
    </div>
  );
}

function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  return (
    <div onClick={onClick} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer hover:-translate-y-1">
      <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{job.title}</h4>
      {job.company_name && (
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700 font-medium">{job.company_name}</span>
        </div>
      )}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{job.description}</p>
      <div className="flex flex-wrap gap-2">
        {job.job_type && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{job.job_type}</span>}
        {job.location && <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{job.location}</span>}
      </div>
    </div>
  );
}

function ExhibitionCard({ exhibition, onClick }: { exhibition: ExhibitionWithCounts; onClick: () => void }) {
  return (
    <div onClick={onClick} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1">
      {exhibition.image_url && (
        <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 relative">
          <img src={exhibition.image_url} alt={exhibition.title} className="w-full h-full object-cover" />
          {exhibition.category && (
            <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-blue-600">
              {exhibition.category}
            </div>
          )}
        </div>
      )}
      <div className="p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{exhibition.title}</h4>
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Calendar className="w-4 h-4" />
          <span>{exhibition.event_start_date && new Date(exhibition.event_start_date).toLocaleDateString()}</span>
        </div>
        {exhibition.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{exhibition.location}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function NewsCard({ news, onClick, onInteract }: { news: NewsWithCounts; onClick: () => void; onInteract: (msg: string) => void }) {
  return (
    <div onClick={onClick} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1">
      {news.image_url && (
        <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
          <img src={news.image_url} alt={news.title} className="w-full h-full object-cover" />
          {news.category && (
            <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-indigo-600">
              {news.category}
            </div>
          )}
        </div>
      )}
      <div className="p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{news.title}</h4>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{news.content}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{news.published_date && new Date(news.published_date).toLocaleDateString()}</span>
          <div className="flex items-center gap-3">
            <button onClick={(e) => { e.stopPropagation(); onInteract("Sign in to like this post"); }} className="flex items-center gap-1 text-gray-600 hover:text-red-500">
              <Heart className="w-4 h-4" /><span>{news.likes_count || 0}</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onInteract("Sign in to share this post"); }} className="text-gray-600 hover:text-blue-500">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onInteract("Sign in to save this post"); }} className="text-gray-600 hover:text-yellow-500">
              <Bookmark className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-12 text-center border border-gray-200">
      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{subtitle}</p>
    </div>
  );
}

function TestimonialCard({ name, role, rating, text, gradient }: { name: string; role: string; rating: number; text: string; gradient: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
      <div className="flex items-center gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-5 h-5 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-400"}`} />
        ))}
      </div>
      <p className="text-white/90 mb-6 italic">"{text}"</p>
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold`}>
          {name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-white">{name}</p>
          <p className="text-sm text-blue-200">{role}</p>
        </div>
      </div>
    </div>
  );
}

function SocialLink({ href, icon, small }: { href: string; icon: React.ReactNode; small?: boolean }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${small ? 'w-8 h-8' : 'w-10 h-10'} bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors text-gray-300 hover:text-white`}>
      {icon}
    </a>
  );
}

function LegalModal({ title, onClose, content }: { title: string; onClose: () => void; content: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 max-w-4xl w-full my-8 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b">
          <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-6 h-6" /></button>
        </div>
        {content}
      </div>
    </div>
  );
}

function SearchModal({ searchQuery, setSearchQuery, handleSearch, isSearching, searchResults, onClose, onInteract }: { searchQuery: string; setSearchQuery: (q: string) => void; handleSearch: (e: React.FormEvent) => void; isSearching: boolean; searchResults: { jobs: Job[]; exhibitions: ExhibitionWithCounts[]; news: NewsWithCounts[]; faqs: { question: string; answer: string; category: string }[] }; onClose: () => void; onInteract: (msg: string) => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Search</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search jobs, news, exhibitions..." className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
          </div>
        </form>
        {isSearching ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : (
          <div className="space-y-6">
            {searchResults.jobs.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Briefcase className="w-5 h-5 text-blue-600" />Jobs</h4>
                <div className="space-y-2">{searchResults.jobs.map((job) => (
                  <div key={job.id} onClick={() => onInteract("Sign in to view job details")} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <h5 className="font-semibold text-gray-900">{job.title}</h5>
                    {job.company_name && <p className="text-sm text-gray-600">{job.company_name}</p>}
                  </div>
                ))}</div>
              </div>
            )}
            {searchResults.news.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Megaphone className="w-5 h-5 text-blue-600" />News</h4>
                <div className="space-y-2">{searchResults.news.map((n) => (
                  <div key={n.id} onClick={() => onInteract("Sign in to read article")} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <h5 className="font-semibold text-gray-900">{n.title}</h5>
                  </div>
                ))}</div>
              </div>
            )}
            {searchResults.faqs.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><HelpCircle className="w-5 h-5 text-blue-600" />FAQs</h4>
                <div className="space-y-2">{searchResults.faqs.map((faq, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-lg">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium mb-2 inline-block">{faq.category}</span>
                    <h5 className="font-semibold text-gray-900 mb-2">{faq.question}</h5>
                    <p className="text-sm text-gray-600">{faq.answer}</p>
                  </div>
                ))}</div>
              </div>
            )}
            {searchResults.jobs.length === 0 && searchResults.exhibitions.length === 0 && searchResults.news.length === 0 && searchResults.faqs.length === 0 && searchQuery && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
                <p className="text-gray-600">Try different keywords</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Legal content components (simplified for brevity)
function PrivacyContent() {
  return (
    <div className="prose prose-sm max-w-none text-gray-700">
      <p><strong>Effective Date:</strong> 01 July 2024</p>
      <p>This Privacy Policy explains how Mavy collects, uses, and protects your personal information.</p>
      <h4 className="font-bold text-gray-900 mt-6">Information We Collect</h4>
      <p>We collect information you provide (name, email, phone, profile data) and information automatically gathered (device info, usage data, location if permitted).</p>
      <h4 className="font-bold text-gray-900 mt-6">How We Use Your Information</h4>
      <p>To provide services, communicate with you, verify credentials, improve our platform, and ensure safety.</p>
      <h4 className="font-bold text-gray-900 mt-6">Data Security</h4>
      <p>We use encrypted data transmission, secure servers, access restrictions, and regular security audits.</p>
      <h4 className="font-bold text-gray-900 mt-6">Contact Us</h4>
      <p>Email: <a href="mailto:info@themavy.com" className="text-blue-600">info@themavy.com</a> | Phone: +91 88866 88864</p>
    </div>
  );
}

function TermsContent() {
  return (
    <div className="prose prose-sm max-w-none text-gray-700">
      <p><strong>Effective Date:</strong> 01 July 2024</p>
      <p>By using Mavy, you agree to these terms and conditions.</p>
      <h4 className="font-bold text-gray-900 mt-6">User Accounts</h4>
      <p>You are responsible for maintaining account security and providing accurate information.</p>
      <h4 className="font-bold text-gray-900 mt-6">User Conduct</h4>
      <p>Do not use the platform for illegal purposes, post false content, or harass other users.</p>
      <h4 className="font-bold text-gray-900 mt-6">Intellectual Property</h4>
      <p>Platform content is owned by Mavy. You retain ownership of content you post but grant us license to display it.</p>
      <h4 className="font-bold text-gray-900 mt-6">Contact Us</h4>
      <p>Email: <a href="mailto:info@themavy.com" className="text-blue-600">info@themavy.com</a> | Phone: +91 88866 88864</p>
    </div>
  );
}

function RefundContent() {
  return (
    <div className="prose prose-sm max-w-none text-gray-700">
      <p><strong>Effective Date:</strong> 01 July 2024</p>
      <h4 className="font-bold text-gray-900 mt-6">Subscription Refunds</h4>
      <p>We offer a 30-day money-back guarantee on all paid subscriptions. Request within 30 days for full refund.</p>
      <h4 className="font-bold text-gray-900 mt-6">How to Request</h4>
      <p>Contact support via email or phone. Refunds processed within 5-10 business days.</p>
      <h4 className="font-bold text-gray-900 mt-6">Non-Refundable</h4>
      <p>Subscriptions beyond 30 days, partial periods, and promotional subscriptions are non-refundable.</p>
      <h4 className="font-bold text-gray-900 mt-6">Contact Us</h4>
      <p>Email: <a href="mailto:info@themavy.com" className="text-blue-600">info@themavy.com</a> | Phone: +91 88866 88864</p>
    </div>
  );
}
