import { Briefcase, Heart } from "lucide-react";

interface OnboardingAccountTypeProps {
  onSelect: (type: string) => void;
}

export default function OnboardingAccountType({ onSelect }: OnboardingAccountTypeProps) {
  const mainOptions = [
    {
      type: "user",
      icon: <Heart className="w-16 h-16" />,
      title: "Looking for Healthcare Services",
      description: "Book physiotherapy, nursing care, ambulance services, medical equipment rental, and biomedical repairs",
      color: "from-teal-500 to-cyan-600",
      badge: "I Need Services"
    },
    {
      type: "partner",
      icon: <Briefcase className="w-16 h-16" />,
      title: "Offering Healthcare Services",
      description: "Doctors, nurses, biomedical engineers, manufacturers, dealers, and healthcare service providers",
      color: "from-blue-500 to-indigo-600",
      badge: "I Offer Services"
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Welcome to Mavy!</h1>
      <p className="text-gray-600 mb-2 text-center text-lg">Are you looking for healthcare services or offering healthcare services?</p>
      <p className="text-gray-500 mb-8 text-center text-sm">Choose the option that best describes you</p>

      <div className="grid md:grid-cols-2 gap-6">
        {mainOptions.map((option) => (
          <button
            key={option.type}
            onClick={() => onSelect(option.type === "user" ? "patient" : "partner")}
            className={`bg-gradient-to-br ${option.color} p-10 rounded-3xl text-white hover:shadow-2xl transition-all duration-300 hover:scale-105 text-center group relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="relative z-10">
              <div className="mb-6 flex justify-center">{option.icon}</div>
              <div className="inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 bg-white bg-opacity-30 backdrop-blur-sm">
                {option.badge}
              </div>
              <h3 className="text-3xl font-bold mb-4">{option.title}</h3>
              <p className="text-white text-opacity-95 leading-relaxed text-lg">
                {option.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-10 p-6 bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-2xl">
        <h4 className="font-bold text-gray-900 mb-3 text-center">Need help choosing?</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div className="text-center">
            <div className="text-3xl mb-2">👤</div>
            <p className="font-semibold text-teal-700 mb-1">Choose "Looking for Healthcare Services"</p>
            <p>If you need to book or request any medical services, equipment, or support</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🏥</div>
            <p className="font-semibold text-blue-700 mb-1">Choose "Offering Healthcare Services"</p>
            <p>If you provide healthcare services, medical equipment, or work in the medical field</p>
          </div>
        </div>
      </div>
    </div>
  );
}
