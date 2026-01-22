import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle } from "lucide-react";

interface OnboardingBusinessSpecialitiesProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

interface Speciality {
  id: number;
  name: string;
}

export default function OnboardingBusinessSpecialities({ onNext, onBack }: OnboardingBusinessSpecialitiesProps) {
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [selectedSpecialities, setSelectedSpecialities] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSpecialities();
  }, []);

  const loadSpecialities = async () => {
    try {
      const response = await fetch("/api/specialities");
      if (response.ok) {
        const data = await response.json();
        setSpecialities(data);
      }
    } catch (error) {
      console.error("Error loading specialities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSpeciality = (id: number) => {
    setSelectedSpecialities((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (selectedSpecialities.length === 0) {
      alert("Please select at least one speciality");
      return;
    }

    onNext({ speciality_ids: selectedSpecialities });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading specialities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Specialities</h1>
      <p className="text-gray-600 mb-8">Choose the medical specialities your business covers</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {specialities.map((speciality) => {
          const isSelected = selectedSpecialities.includes(speciality.id);
          return (
            <button
              key={speciality.id}
              onClick={() => toggleSpeciality(speciality.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{speciality.name}</span>
                {isSelected && <CheckCircle className="w-5 h-5 text-blue-600" />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          Selected: {selectedSpecialities.length} specialit{selectedSpecialities.length !== 1 ? "ies" : "y"}
        </p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={selectedSpecialities.length === 0}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );
}
