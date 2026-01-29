import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/react-app/contexts/AuthContext";
import OnboardingBusinessDetails from "@/react-app/components/onboarding/OnboardingBusinessDetails";
import OnboardingBusinessSpecialities from "@/react-app/components/onboarding/OnboardingBusinessSpecialities";
import OnboardingBusinessProducts from "@/react-app/components/onboarding/OnboardingBusinessProducts";
import OnboardingBusinessSummary from "@/react-app/components/onboarding/OnboardingBusinessSummary";
import OnboardingIndividualWorkplace from "@/react-app/components/onboarding/OnboardingIndividualWorkplace";
import OnboardingIndividualSpecialities from "@/react-app/components/onboarding/OnboardingIndividualSpecialities";
import OnboardingFreelancerDetails from "@/react-app/components/onboarding/OnboardingFreelancerDetails";
import OnboardingFreelancerSpecialities from "@/react-app/components/onboarding/OnboardingFreelancerSpecialities";
import OnboardingFreelancerPortfolio from "@/react-app/components/onboarding/OnboardingFreelancerPortfolio";
import OnboardingPatientDetails from "@/react-app/components/onboarding/OnboardingPatientDetails";
import OnboardingAccountType from "@/react-app/components/onboarding/OnboardingAccountType";
import OnboardingPartnerTypeSelect from "@/react-app/components/onboarding/OnboardingPartnerTypeSelect";

export default function Onboarding() {
  const { user, isPending, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0); // Start at step 0 (account type selection)
  const [accountType, setAccountType] = useState<string | null>(null);
  const [onboardingData, setOnboardingData] = useState<any>({
    profession: "Biomedical Engineer", // Set default profession
  });

  useEffect(() => {
    if (!isPending && !user) {
      navigate("/login");
      return;
    }
    
    if (user?.onboarding_completed) {
      const accountType = user.account_type;
      if (accountType === "patient") {
        navigate("/patient-dashboard");
      } else if (accountType === "business") {
        navigate("/business-dashboard");
      } else if (accountType === "freelancer") {
        navigate("/freelancer-dashboard");
      } else {
        navigate("/dashboard");
      }
      return;
    }
  }, [user, isPending, navigate]);

  const handleNext = (data: any) => {
    setOnboardingData({ ...onboardingData, ...data });
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep === 0) return;
    setCurrentStep(currentStep - 1);
  };

  const handleAccountTypeSelect = (type: string) => {
    // If user selects patient/general public, redirect to patient dashboard
    // This separates patient users from partner users
    if (type === "patient") {
      // Update account type and proceed to patient onboarding
      setAccountType("patient");
      setOnboardingData({ ...onboardingData, account_type: "patient" });
      setCurrentStep(1);
    } else if (type === "partner") {
      // For partners, show partner type selection (business/individual/freelancer)
      setAccountType("partner");
      setCurrentStep(1);
    } else {
      // Direct selection of business, individual, or freelancer
      setAccountType(type);
      setOnboardingData({ ...onboardingData, account_type: type });
      setCurrentStep(2);
    }
  };

  const handlePartnerTypeSelect = (type: string, profession?: string) => {
    setAccountType(type);
    setOnboardingData({ ...onboardingData, account_type: type, profession: profession || "Biomedical Engineer" });
    setCurrentStep(2);
  };

  const handleDirectComplete = async (profession: string) => {
    // For nursing, physiotherapy, ambulance - complete directly and go to dashboard
    const professionMap: Record<string, string> = {
      nursing: "Nursing Professional",
      physiotherapy: "Physiotherapy Professional", 
      ambulance: "Ambulance Provider"
    };

    const completeData = {
      ...onboardingData,
      account_type: "individual",
      profession: professionMap[profession] || profession,
    };

    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(completeData),
      });

      if (response.ok) {
        await refreshUser();
        navigate("/dashboard");
      } else {
        alert("Failed to complete onboarding. Please try again.");
      }
    } catch (error) {
      console.error("Onboarding error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleComplete = async (finalData: any) => {
    const completeData = { ...onboardingData, ...finalData };
    
    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(completeData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Onboarding completed:", result);
        
        await refreshUser();
        
        const targetAccountType = accountType || completeData.account_type;
        let redirectPath = "/dashboard";
        
        if (targetAccountType === "business") {
          redirectPath = "/business-dashboard";
        } else if (targetAccountType === "individual") {
          redirectPath = "/dashboard";
        } else if (targetAccountType === "freelancer") {
          redirectPath = "/freelancer-dashboard";
        } else if (targetAccountType === "patient") {
          redirectPath = "/patient-dashboard";
        }
        
        navigate(redirectPath);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Onboarding completion failed:", errorData);
        alert(`Failed to complete onboarding: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Onboarding error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const renderStep = () => {
    // Step 0: Account type selection
    if (currentStep === 0) {
      return <OnboardingAccountType onSelect={handleAccountTypeSelect} />;
    }

    // Step 1: Partner type selection (if accountType is "partner")
    if (currentStep === 1 && accountType === "partner") {
      return <OnboardingPartnerTypeSelect onSelect={handlePartnerTypeSelect} onBack={handleBack} onDirectComplete={handleDirectComplete} />;
    }
    
    if (accountType === "business") {
      switch (currentStep) {
        case 2:
          return <OnboardingBusinessDetails onNext={handleNext} onBack={handleBack} />;
        case 3:
          return <OnboardingBusinessSpecialities onNext={handleNext} onBack={handleBack} />;
        case 4:
          return <OnboardingBusinessProducts onNext={handleNext} onBack={handleBack} data={onboardingData} />;
        case 5:
          return <OnboardingBusinessSummary onComplete={handleComplete} onBack={handleBack} data={onboardingData} />;
        default:
          return null;
      }
    }

    if (accountType === "individual") {
      switch (currentStep) {
        case 2:
          return <OnboardingIndividualWorkplace onNext={handleNext} onBack={handleBack} />;
        case 3:
          return <OnboardingIndividualSpecialities onComplete={handleComplete} onBack={handleBack} />;
        default:
          return null;
      }
    }

    if (accountType === "freelancer") {
      switch (currentStep) {
        case 2:
          return <OnboardingFreelancerDetails onNext={handleNext} onBack={handleBack} />;
        case 3:
          return <OnboardingFreelancerSpecialities onNext={handleNext} onBack={handleBack} />;
        case 4:
          return <OnboardingFreelancerPortfolio onComplete={handleComplete} onBack={handleBack} />;
        default:
          return null;
      }
    }

    if (accountType === "patient") {
      switch (currentStep) {
        case 1:
          return <OnboardingPatientDetails onComplete={handleComplete} onBack={handleBack} />;
        default:
          return null;
      }
    }

    return null;
  };

  // Show loading state while authentication is being checked
  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {renderStep()}
      </div>
    </div>
  );
}
