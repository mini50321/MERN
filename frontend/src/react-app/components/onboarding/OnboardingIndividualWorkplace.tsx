import { useState } from "react";
import { ArrowLeft, Building, Briefcase } from "lucide-react";

interface OnboardingIndividualWorkplaceProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function OnboardingIndividualWorkplace({ onNext, onBack }: OnboardingIndividualWorkplaceProps) {
  const [workplaceType, setWorkplaceType] = useState("");
  const [workplaceName, setWorkplaceName] = useState("");

  const workplaceTypes = [
    { value: "hospital", label: "Hospital", icon: <Building className="w-8 h-8" /> },
    { value: "company", label: "Company", icon: <Briefcase className="w-8 h-8" /> },
    { value: "r&d", label: "R&D", icon: <Building className="w-8 h-8" /> },
    { value: "other", label: "Other", icon: <Building className="w-8 h-8" /> },
  ];

  const handleSubmit = () => {
    if (!workplaceType) {
      alert("Please select your employment type");
      return;
    }

    if (workplaceType === "other" && !workplaceName) {
      alert("Please enter your workplace name");
      return;
    }

    onNext({ workplace_type: workplaceType, workplace_name: workplaceName });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Employment Type</h1>
      <p className="text-gray-600 mb-8">Tell us where you work</p>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {workplaceTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setWorkplaceType(type.value)}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              workplaceType === type.value
                ? "border-blue-600 bg-blue-50 shadow-lg"
                : "border-gray-200 hover:border-gray-300 hover:shadow-md"
            }`}
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
              {type.icon}
            </div>
            <h3 className="text-lg font-bold text-gray-900">{type.label}</h3>
          </button>
        ))}
      </div>

      {workplaceType === "other" && (
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Workplace Name
          </label>
          <input
            type="text"
            value={workplaceName}
            onChange={(e) => setWorkplaceName(e.target.value)}
            placeholder="Enter your workplace name"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!workplaceType}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );
}
