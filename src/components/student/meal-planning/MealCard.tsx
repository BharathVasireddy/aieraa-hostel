'use client';

import { Check } from 'lucide-react';

interface MealSelection {
  id: string;
  date: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER';
  isLocked: boolean;
  mealPlan: {
    mealCategory: {
      name: string;
    };
  };
}

interface MealCardProps {
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER';
  selection: MealSelection | null;
  onMealSelect: (mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER') => void;
}

export default function MealCard({ mealType, selection, onMealSelect }: MealCardProps) {
  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case 'BREAKFAST': return '🌅';
      case 'LUNCH': return '☀️';
      case 'DINNER': return '🌙';
      default: return '🍽️';
    }
  };

  const isSelected = !!selection;
  const isLocked = selection?.isLocked;

  return (
    <div
      data-meal={mealType}
      onClick={() => !isLocked && onMealSelect(mealType)}
      className={`
        bg-white rounded-2xl p-5 border transition-all duration-300 cursor-pointer
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:shadow-md hover:-translate-y-0.5'}
        ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}
        flip-animation-target
      `}
    >
      <div className="flex items-center mb-3">
        <span className="text-[22px] mr-3">{getMealIcon(mealType)}</span>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 capitalize">
            {mealType.toLowerCase()}
          </h3>
        </div>
        {isSelected && (
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
      <p className={`text-sm ${isSelected ? 'text-gray-700 font-medium' : 'text-gray-500 italic'}`}>
        {isSelected ? selection.mealPlan.mealCategory.name : 'Tap to choose your menu'}
      </p>
    </div>
  );
} 