import { Stethoscope, Pill, Heart, Zap, Activity } from "lucide-react";

interface OnboardingProfessionSelectProps {
  onSelect: (profession: string) => void;
}

export default function OnboardingProfessionSelect({ onSelect }: OnboardingProfessionSelectProps) {
  const professions = [
    {
      value: "Biomedical Engineer",
      icon: <Zap className="w-12 h-12" />,
      title: "Biomedical Engineer",
      description: "Medical equipment design, maintenance, and clinical engineering",
      color: "from-blue-500 to-indigo-600",
    },
    {
      value: "Doctor",
      icon: <Stethoscope className="w-12 h-12" />,
      title: "Doctor",
      description: "Medical practitioners, physicians, and specialists",
      color: "from-red-500 to-rose-600",
    },
    {
      value: "Nurse",
      icon: <Heart className="w-12 h-12" />,
      title: "Nurse",
      description: "Nursing professionals, nurse practitioners, and healthcare support",
      color: "from-pink-500 to-rose-600",
    },
    {
      value: "Pharmacist",
      icon: <Pill className="w-12 h-12" />,
      title: "Pharmacist",
      description: "Pharmaceutical professionals and medication specialists",
      color: "from-green-500 to-emerald-600",
    },
    {
      value: "Physiotherapist",
      icon: <Activity className="w-12 h-12" />,
      title: "Physiotherapist",
      description: "Physical therapy and rehabilitation specialists",
      color: "from-purple-500 to-violet-600",
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <img 
          src="https://imagedelivery.net/camphNbfQDNepXylXIkEvQ/34458975_transparent.png/public" 
          alt="Mavy" 
          className="h-12 mx-auto mb-4"
        />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Mavy</h1>
        <p className="text-gray-600">Select your healthcare profession to get started</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {professions.map((profession) => (
          <button
            key={profession.value}
            onClick={() => onSelect(profession.value)}
            className="p-6 rounded-xl border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 hover:shadow-lg hover:scale-105 transition-all text-left"
          >
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${profession.color} flex items-center justify-center text-white mb-4`}>
              {profession.icon}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{profession.title}</h3>
            <p className="text-sm text-gray-600">{profession.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
