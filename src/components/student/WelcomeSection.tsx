import React from 'react';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';

interface WelcomeSectionProps {
  userName?: string;
  selectedDate?: string;
  roomNumber?: string;
  university?: string;
  upcomingOrdersCount?: number;
  lastOrderDate?: string;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ 
  userName,
  selectedDate,
  roomNumber,
  university,
  upcomingOrdersCount = 0,
  lastOrderDate
}) => {
  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 12) {return 'Good morning';}
    if (currentHour < 17) {return 'Good afternoon';}
    return 'Good evening';
  };

  const formatSelectedDate = () => {
    if (!selectedDate) {return 'Select a date';}
    return format(new Date(selectedDate), 'EEEE, MMM d');
  };

  return (
    <div className="card p-6">
      {/* Main Greeting */}
      <div className="mb-6">
        <h1 className="text-heading-2 mb-2">
          {getGreeting()}
          {userName && (
            <span className="text-primary-600">, {userName.split(' ')[0]}</span>
          )}!
        </h1>
        <p className="text-body-sm">Ready to order some delicious food?</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-primary-50 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="icon-container-primary">
              <Calendar className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-caption">Ordering for</p>
              <p className="text-heading-4">{formatSelectedDate()}</p>
            </div>
          </div>
        </div>

        <div className="bg-info-50 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="icon-container">
              <Clock className="w-5 h-5 text-info-600" />
            </div>
            <div>
              <p className="text-caption">Active Orders</p>
              <p className="text-heading-4">{upcomingOrdersCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Info */}
      <div className="flex items-center justify-between bg-neutral-50 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="icon-container-sm">
            <User className="w-4 h-4 text-neutral-600" />
          </div>
          <div>
            <p className="text-body-sm font-medium">Room {roomNumber}</p>
            <p className="text-caption">{university}</p>
          </div>
        </div>
        
        {lastOrderDate && (
          <div className="text-right">
            <p className="text-caption">Last order</p>
            <p className="text-body-sm font-medium">
              {format(new Date(lastOrderDate), 'MMM d')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeSection;
