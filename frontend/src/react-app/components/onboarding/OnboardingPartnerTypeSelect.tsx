import { useState } from "react";
import { Building2, User, Briefcase, Stethoscope, Heart, Activity, Ambulance } from "lucide-react";

interface OnboardingPartnerTypeSelectProps {
  onSelect: (type: string, profession?: string) => void;
  onBack: () => void;
  onDirectComplete: (profession: string) => void;
}

export default function OnboardingPartnerTypeSelect({ onSelect, onBack, onDirectComplete }: OnboardingPartnerTypeSelectProps) {
  const [selectedProfession, setSelectedProfession] = useState<string | null>(null);

  const professionOptions = [
    {
      type: "biomedical",
      icon: <Stethoscope className="w-12 h-12" />,
      title: "Biomedical Engineering",
      description: "Medical device manufacturing, sales, service, and repairs",
      color: "from-blue-500 to-indigo-600",
    },
    {
      type: "nursing",
      icon: <Heart className="w-12 h-12" />,
      title: "Nursing Services",
      description: "Home nursing, patient care, and healthcare support",
      color: "from-pink-500 to-rose-600",
    },
    {
      type: "physiotherapy",
      icon: <Activity className="w-12 h-12" />,
      title: "Physiotherapy",
      description: "Physical therapy, rehabilitation, and wellness services",
      color: "from-green-500 to-emerald-600",
    },
    {
      type: "ambulance",
      icon: <Ambulance className="w-12 h-12" />,
      title: "Ambulance Provider",
      description: "Emergency and non-emergency patient transport services",
      color: "from-red-500 to-orange-600",
    },
  ];

  const biomedicalTypes = [
    {
      type: "business",
      icon: <Building2 className="w-14 h-14" />,
      title: "Business/Company",
      description: "Medical device companies, manufacturers, dealers, or distributors",
      color: "from-blue-500 to-indigo-600",
      examples: "Manufacturers, Dealers, Suppliers"
    },
    {
      type: "individual",
      icon: <User className="w-14 h-14" />,
      title: "Individual Professional",
      description: "Biomedical engineers working for a hospital, clinic, or organization",
      color: "from-green-500 to-emerald-600",
      examples: "Hospital Engineers, Service Technicians"
    },
    {
      type: "freelancer",
      icon: <Briefcase className="w-14 h-14" />,
      title: "Independent Practitioner",
      description: "Self-employed biomedical engineers offering independent services",
      color: "from-purple-500 to-violet-600",
      examples: "Consultants, Independent Engineers"
    },
  ];

  const handleProfessionSelect = (profession: string) => {
    if (profession === "biomedical") {
      setSelectedProfession(profession);
    } else {
      // For nursing, physiotherapy, ambulance - complete directly
      onDirectComplete(profession);
    }
  };

  const handleBiomedicalTypeSelect = (type: string) => {
    onSelect(type, "Biomedical Engineer");
  };

  // Show biomedical type selection if biomedical was selected
  if (selectedProfession === "biomedical") {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <button
          onClick={() => setSelectedProfession(null)}
          className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">What type of biomedical partner are you?</h1>
        <p className="text-gray-600 mb-8 text-center text-lg">Help us understand how you'll be using Mavy</p>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {biomedicalTypes.map((option) => (
            <button
              key={option.type}
              onClick={() => handleBiomedicalTypeSelect(option.type)}
              className={`bg-gradient-to-br ${option.color} p-8 rounded-2xl text-white hover:shadow-2xl transition-all duration-300 hover:scale-105 text-center group relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <div className="relative z-10">
                <div className="mb-5 flex justify-center">{option.icon}</div>
                <h3 className="text-2xl font-bold mb-3">{option.title}</h3>
                <p className="text-white text-opacity-95 leading-relaxed mb-4">
                  {option.description}
                </p>
                <div className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-white bg-opacity-30 backdrop-blur-sm">
                  {option.examples}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Show profession selection
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <button
        onClick={onBack}
        className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">What service do you provide?</h1>
      <p className="text-gray-600 mb-8 text-center text-lg">Select your profession or service category</p>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {professionOptions.map((option) => (
          <button
            key={option.type}
            onClick={() => handleProfessionSelect(option.type)}
            className={`bg-gradient-to-br ${option.color} p-8 rounded-2xl text-white hover:shadow-2xl transition-all duration-300 hover:scale-105 text-center group relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="relative z-10">
              <div className="mb-5 flex justify-center">{option.icon}</div>
              <h3 className="text-2xl font-bold mb-3">{option.title}</h3>
              <p className="text-white text-opacity-95 leading-relaxed">
                {option.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
        <p className="text-sm text-blue-800">
          <strong>Biomedical engineers</strong> will complete a detailed profile setup.<br/>
          <strong>Nursing, Physiotherapy & Ambulance</strong> providers will be taken directly to their dashboard.
        </p>
      </div>
    </div>
  );
}
