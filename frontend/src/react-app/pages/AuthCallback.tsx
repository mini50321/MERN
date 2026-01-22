import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { Loader2, MapPin } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { exchangeCodeForSessionToken } = useAuth();
  const [status, setStatus] = useState("Completing sign in...");
  const hasExchanged = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent double execution in React StrictMode
      if (hasExchanged.current) {
        return;
      }
      hasExchanged.current = true;
      try {
        await exchangeCodeForSessionToken();
        
        // Check if user is an admin
        setStatus("Checking access level...");
        const adminCheckRes = await fetch("/api/check-admin");
        const adminCheck = await adminCheckRes.json();
        
        if (adminCheck.is_admin) {
          navigate("/admin/dashboard");
          return;
        }

        // Check if user has completed onboarding
        setStatus("Loading your profile...");
        const profileRes = await fetch("/api/users/me");
        const profileData = await profileRes.json();
        
        // Check if location needs to be set (for new users)
        const needsLocation = !profileData.profile?.state || !profileData.profile?.country;
        
        if (needsLocation && "geolocation" in navigator) {
          setStatus("Detecting your location...");
          
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 10000,
                maximumAge: 0,
              });
            });

            // Send location to backend to get state and country
            await fetch("/api/profile/set-location", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              }),
            });
          } catch (error) {
            console.error("Location detection error:", error);
            // Continue without location - user can request change later
          }
        }
        
        if (profileData.profile?.onboarding_completed) {
          // Redirect to appropriate dashboard based on account type
          const accountType = profileData.profile.account_type;
          if (accountType === "business") {
            navigate("/business-dashboard");
            return;
          } else if (accountType === "individual") {
            navigate("/dashboard");
            return;
          } else if (accountType === "freelancer") {
            navigate("/freelancer-dashboard");
            return;
          } else if (accountType === "patient") {
            navigate("/patient-dashboard");
            return;
          }
          // If no specific account type, go to general dashboard
          navigate("/dashboard");
          return;
        } else {
          // User hasn't completed onboarding - redirect to onboarding
          navigate("/onboarding");
          return;
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        navigate("/");
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="relative mb-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          {status.includes("location") && (
            <MapPin className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          )}
        </div>
        <p className="text-gray-700 font-medium">{status}</p>
      </div>
    </div>
  );
}
