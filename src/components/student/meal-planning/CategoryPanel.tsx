'use client';

import { useState } from 'react';
import { ChevronRight, Check } from 'lucide-react';

interface MealPlan {
  id: string;
  date: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER';
  mealCategory: {
    id: string;
    name: string;
    description?: string;
    isVegetarian: boolean;
    isVegan: boolean;
    isHalal: boolean;
  };
  mealItems: {
    id: string;
    name: string;
    order: number;
  }[];
  _count: {
    selections: number;
  };
}

interface CategoryPanelProps {
  isOpen: boolean;
  currentMealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | null;
  availablePlans: MealPlan[];
  selectedCategory: MealPlan | null;
  onClose: () => void;
  onCategorySelect: (plan: MealPlan) => void;
  onConfirm: () => void;
}

export default function CategoryPanel({
  isOpen,
  currentMealType,
  availablePlans,
  selectedCategory,
  onClose,
  onCategorySelect,
  onConfirm
}: CategoryPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const getCategoryIcon = (category: any) => {
    if (category.isVegetarian && !category.isVegan) {return '🥗';}
    if (category.isVegan) {return '🌱';}
    if (category.isHalal) {return '☪️';}
    if (category.name.includes('Continental')) {return '🍝';}
    if (category.name.includes('South')) {return '🥥';}
    if (category.name.includes('North')) {return '🫓';}
    return '🍽️';
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  if (!isOpen) {return null;}

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-40 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={`
        fixed bottom-0 left-0 right-0 bg-white rounded-t-[20px] z-50
        transform transition-transform duration-300 max-h-[80vh] flex flex-col
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}
      `}>
        {/* Handle */}
        <div className="w-9 h-1 bg-gray-300 rounded-full mx-auto my-3" />
        
        {/* Header */}
        <div className="px-6 pb-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Choose {currentMealType?.toLowerCase()} Menu
          </h2>
          <p className="text-sm text-gray-600">Review menu items and tap to select</p>
        </div>
        
        {/* Categories */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {availablePlans.map((plan) => {
            const isExpanded = expandedCategories.has(plan.id);
            const isSelected = selectedCategory?.id === plan.id;

            return (
              <div
                key={plan.id}
                className={`
                  mb-3 border rounded-xl transition-all duration-200 overflow-hidden
                  ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}
                `}
              >
                <div
                  onClick={() => onCategorySelect(plan)}
                  className="p-4 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        {plan.mealCategory.name}
                        {plan.mealCategory.isVegetarian && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Veg</span>
                        )}
                        {plan.mealCategory.isVegan && (
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">Vegan</span>
                        )}
                        {plan.mealCategory.isHalal && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Halal</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {plan.mealCategory.description || `${plan._count.selections} students selected`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-xl">
                        {getCategoryIcon(plan.mealCategory)}
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Menu Items */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCategoryExpansion(plan.id);
                  }}
                  className="px-4 pb-4 cursor-pointer"
                >
                  <button className="text-sm text-blue-600 font-medium flex items-center gap-1">
                    {isExpanded ? 'Hide' : 'Show'} menu items
                    <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                  
                  {isExpanded && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {plan.mealItems.map((item) => (
                        <div key={item.id} className="bg-white rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-700">{item.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onConfirm}
            disabled={!selectedCategory}
            className={`
              w-full py-4 rounded-xl font-semibold transition-all duration-200
              ${selectedCategory 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
            `}
          >
            {selectedCategory ? `Confirm ${selectedCategory.mealCategory.name}` : 'Select a menu to continue'}
          </button>
        </div>
      </div>
    </>
  );
} 