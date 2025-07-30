import React from 'react';
import { Calendar, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { format, addDays, startOfToday, isToday, isTomorrow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface DateOption {
  date: string;
  label: string;
  sublabel: string;
  isAvailable: boolean;
  cutoffTime?: string;
  specialOffer?: string;
}

interface DateSelectionCardProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  cutoffHours?: number;
  className?: string;
}

export const DateSelectionCard: React.FC<DateSelectionCardProps> = ({
  selectedDate,
  onDateChange,
  cutoffHours = 22,
  className,
}) => {
  // Generate date options for next 7 days
  const dateOptions: DateOption[] = React.useMemo(() => {
    const options: DateOption[] = [];
    const today = startOfToday();
    
    for (let i = 1; i <= 7; i++) {
      const date = addDays(today, i);
      const dateString = format(date, 'yyyy-MM-dd');
      
      let label = format(date, 'EEEE');
      let sublabel = format(date, 'MMM d');
      
      if (isTomorrow(date)) {
        label = 'Tomorrow';
        sublabel = format(date, 'EEEE, MMM d');
      } else if (i === 2) {
        sublabel = `${format(date, 'EEEE, MMM d')}`;
      }
      
      options.push({
        date: dateString,
        label,
        sublabel,
        isAvailable: true,
        cutoffTime: `Order before ${cutoffHours % 12 || 12}:00 ${cutoffHours >= 12 ? 'PM' : 'AM'} today`,
        specialOffer: i === 1 ? '10% off on first order' : undefined,
      });
    }
    
    return options;
  }, [cutoffHours]);

  const selectedOption = dateOptions.find(opt => opt.date === selectedDate);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-heading-2 mb-2">When would you like your meal?</h2>
            <p className="text-body-sm text-neutral-600">
              Select your preferred delivery date for hostel meals
            </p>
          </div>
          <div className="icon-container-primary">
            <Calendar className="w-6 h-6 text-primary-600" />
          </div>
        </div>
        
        {selectedOption && (
          <div className="mt-4 p-4 bg-white rounded-xl border border-primary-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-heading-4 text-primary-700">
                  {selectedOption.label}
                </p>
                <p className="text-body-sm text-neutral-600">
                  {selectedOption.sublabel}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 text-warning-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-caption font-medium">
                    {selectedOption.cutoffTime}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-3 gap-3">
          {dateOptions.slice(0, 6).map((option) => (
            <button
              key={option.date}
              onClick={() => onDateChange(option.date)}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all duration-200",
                "hover:border-primary-400 hover:bg-primary-50",
                "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                selectedDate === option.date
                  ? "border-primary-500 bg-primary-50"
                  : "border-neutral-200 bg-white",
                !option.isAvailable && "opacity-50 cursor-not-allowed"
              )}
              disabled={!option.isAvailable}
            >
              {option.specialOffer && (
                <div className="absolute -top-2 -right-2 bg-error-500 text-white text-xs px-2 py-1 rounded-full">
                  Offer
                </div>
              )}
              
              <div className="text-center">
                <p className={cn(
                  "font-semibold",
                  selectedDate === option.date ? "text-primary-700" : "text-neutral-900"
                )}>
                  {option.label}
                </p>
                <p className="text-caption text-neutral-600 mt-1">
                  {format(new Date(option.date), 'MMM d')}
                </p>
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-600"
            onClick={() => {/* Show all dates modal */}}
          >
            View all dates
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          
          <div className="flex items-center space-x-2 text-info-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-caption">
              Orders must be placed 1 day in advance
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 