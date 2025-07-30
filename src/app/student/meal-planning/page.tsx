'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/student/meal-planning/Header';
import DateRibbon from '@/components/student/meal-planning/DateRibbon';
import MealCard from '@/components/student/meal-planning/MealCard';
import CategoryPanel from '@/components/student/meal-planning/CategoryPanel';

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

interface MealSelection {
  id: string;
  date: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER';
  isLocked: boolean;
  mealPlan: MealPlan;
}

export default function MealPlanningPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Set default selected date to tomorrow
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selections, setSelections] = useState<MealSelection[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Panel states
  const [showPanel, setShowPanel] = useState(false);
  const [currentMealType, setCurrentMealType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MealPlan | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchMealData();
    }
  }, [status, router]);

  const fetchMealData = async () => {
    try {
      setLoading(true);
      
      // Fetch for next 7 days including today
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 6);

      const [plansResponse, selectionsResponse] = await Promise.all([
        fetch(`/api/meal-planning/plans?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        fetch(`/api/meal-planning/selections?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
      ]);

      const plansResult = await plansResponse.json();
      const selectionsResult = await selectionsResponse.json();

      setMealPlans(plansResult.mealPlans || []);
      setSelections(selectionsResult.selections || []);
    } catch (error) {
      console.error('Error fetching meal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayStatus = (date: Date): 'complete' | 'partial' | null => {
    const dateStr = date.toISOString().split('T')[0];
    const daySelections = selections.filter(s => s.date.split('T')[0] === dateStr);
    
    if (daySelections.length === 0) {return null;}
    if (daySelections.length === 3) {return 'complete';}
    return 'partial';
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const openMealPanel = (mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER') => {
    setCurrentMealType(mealType);
    setSelectedCategory(null);
    setShowPanel(true);
  };

  const closePanel = () => {
    setShowPanel(false);
    setSelectedCategory(null);
  };

  const handleCategorySelect = (plan: MealPlan) => {
    setSelectedCategory(plan);
  };

  const confirmSelection = async () => {
    if (!selectedCategory || !currentMealType) {return;}

    try {
      const response = await fetch('/api/meal-planning/selections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate.toISOString(),
          mealType: currentMealType,
          mealPlanId: selectedCategory.id
        })
      });

      if (response.ok) {
        await fetchMealData();
        closePanel();
        
        // Show success animation
        const mealCard = document.querySelector(`[data-meal="${currentMealType}"]`);
        mealCard?.classList.add('flip-animation');
        setTimeout(() => {
          mealCard?.classList.remove('flip-animation');
        }, 600);
      }
    } catch (error) {
      console.error('Error saving selection:', error);
    }
  };

  const getSelectedMeal = (mealType: string): MealSelection | null => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    return selections.find(s => 
      s.date.split('T')[0] === dateStr && s.mealType === mealType
    ) || null;
  };

  const getAvailablePlans = (mealType: string) => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    return mealPlans.filter(p => 
      p.date.split('T')[0] === dateStr && p.mealType === mealType
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Header */}
      <Header userName={session?.user?.name} />

      {/* Date Ribbon */}
      <DateRibbon 
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        getDayStatus={getDayStatus}
      />

      {/* Main Content */}
      <main className="px-5 py-6">
        {/* Meal Cards */}
        <div className="space-y-4">
          {(['BREAKFAST', 'LUNCH', 'DINNER'] as const).map((mealType) => (
            <MealCard
              key={mealType}
              mealType={mealType}
              selection={getSelectedMeal(mealType)}
              onMealSelect={openMealPanel}
            />
          ))}
        </div>
      </main>

      {/* Category Selection Panel */}
      <CategoryPanel
        isOpen={showPanel}
        currentMealType={currentMealType}
        availablePlans={getAvailablePlans(currentMealType || '')}
        selectedCategory={selectedCategory}
        onClose={closePanel}
        onCategorySelect={handleCategorySelect}
        onConfirm={confirmSelection}
      />

      {/* Global Styles */}
      <style jsx global>{`
        .flip-animation {
          animation: flip 0.6s ease-in-out;
        }
        @keyframes flip {
          0% { transform: rotateY(0deg); }
          50% { transform: rotateY(90deg); }
          100% { transform: rotateY(0deg); }
        }
      `}</style>
    </div>
  );
} 