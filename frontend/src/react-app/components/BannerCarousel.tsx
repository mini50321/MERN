import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface BannerItem {
  id: number;
  type: "image" | "video";
  url: string;
  link?: string;
  display_mode?: string;
}

export default function BannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bannerItems, setBannerItems] = useState<BannerItem[]>([]);
  const [fullscreenAds, setFullscreenAds] = useState<BannerItem[]>([]);
  const [showFullscreenAd, setShowFullscreenAd] = useState(false);
  const [currentFullscreenIndex, setCurrentFullscreenIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  useEffect(() => {
    const loadBannerAds = async () => {
      try {
        const res = await fetch("/api/ads/banners");
        if (res.ok) {
          const data = await res.json();
          const banners = data.filter((ad: BannerItem) => ad.display_mode !== "fullscreen");
          const fullscreen = data.filter((ad: BannerItem) => ad.display_mode === "fullscreen");
          
          setBannerItems(banners);
          setFullscreenAds(fullscreen);
          
          // Show fullscreen ad if available and not shown in this session
          if (fullscreen.length > 0 && !sessionStorage.getItem("fullscreen_ad_shown")) {
            setTimeout(() => {
              setShowFullscreenAd(true);
              sessionStorage.setItem("fullscreen_ad_shown", "true");
            }, 1000);
          }
        }
      } catch (error) {
        console.error("Error loading banner ads:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBannerAds();
  }, []);

  useEffect(() => {
    if (bannerItems.length === 0) return;

    const currentItem = bannerItems[currentIndex];
    if (currentItem.type === "video" && videoRef.current) {
      videoRef.current.play();
    } else {
      timerRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % bannerItems.length);
      }, 5000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentIndex, bannerItems]);

  useEffect(() => {
    if (showFullscreenAd && fullscreenAds[currentFullscreenIndex]?.type === "video" && fullscreenVideoRef.current) {
      fullscreenVideoRef.current.play();
    }
  }, [showFullscreenAd, currentFullscreenIndex, fullscreenAds]);

  useEffect(() => {
    setImageError(false);
  }, [currentIndex]);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleVideoError = () => {
    setImageError(true);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % bannerItems.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + bannerItems.length) % bannerItems.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const handleVideoEnded = () => {
    goToNext();
  };

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "BUTTON" || target.closest("button")) {
      return;
    }
    
    if (currentItem?.link) {
      window.open(currentItem.link, "_blank");
    }
  };

  const handleFullscreenClick = () => {
    const currentAd = fullscreenAds[currentFullscreenIndex];
    if (currentAd?.link) {
      window.open(currentAd.link, "_blank");
    }
  };

  const handleCloseFullscreen = () => {
    setShowFullscreenAd(false);
  };

  const handleFullscreenVideoEnded = () => {
    if (currentFullscreenIndex < fullscreenAds.length - 1) {
      setCurrentFullscreenIndex(currentFullscreenIndex + 1);
    } else {
      setShowFullscreenAd(false);
    }
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Loading banners...</p>
        </div>
      </div>
    );
  }

  if (bannerItems.length === 0 && !showFullscreenAd) {
    return null;
  }

  const currentItem = bannerItems[currentIndex];

  return (
    <>
      {bannerItems.length > 0 && currentItem && (
        <div 
          className={`relative w-full h-64 rounded-2xl overflow-hidden group ${
            currentItem.link ? "cursor-pointer" : ""
          } ${imageError ? "bg-gradient-to-br from-gray-100 to-gray-200" : "bg-gray-900"}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleClick}
        >
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Content unavailable</p>
                {bannerItems.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNext();
                    }}
                    className="text-blue-500 text-xs hover:text-blue-600"
                  >
                    Next banner →
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {currentItem.type === "image" ? (
                <img
                  src={currentItem.url}
                  alt="Banner"
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              ) : (
                <video
                  ref={videoRef}
                  src={currentItem.url}
                  className="w-full h-full object-cover"
                  onEnded={handleVideoEnded}
                  onError={handleVideoError}
                  playsInline
                  muted
                />
              )}
            </>
          )}

          {bannerItems.length > 1 && !imageError && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrev();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {bannerItems.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToSlide(index);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      index === currentIndex
                        ? "bg-white w-4"
                        : "bg-white/50 hover:bg-white/75"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {showFullscreenAd && fullscreenAds.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-black rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={handleCloseFullscreen}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm"
            >
              <X className="w-6 h-6" />
            </button>

            <div 
              className={`w-full h-full ${fullscreenAds[currentFullscreenIndex]?.link ? "cursor-pointer" : ""}`}
              onClick={handleFullscreenClick}
            >
              {fullscreenAds[currentFullscreenIndex]?.type === "image" ? (
                <img
                  src={fullscreenAds[currentFullscreenIndex].url}
                  alt="Advertisement"
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  ref={fullscreenVideoRef}
                  src={fullscreenAds[currentFullscreenIndex]?.url}
                  className="w-full h-full object-contain"
                  onEnded={handleFullscreenVideoEnded}
                  playsInline
                  muted
                  controls
                />
              )}
            </div>

            {fullscreenAds.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {fullscreenAds.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentFullscreenIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentFullscreenIndex
                        ? "bg-white w-8"
                        : "bg-white/50 hover:bg-white/75"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
