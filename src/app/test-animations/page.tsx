'use client';

import { useState } from 'react';
import AnimatedDataTable, { Column } from '@/components/ui/AnimatedDataTable';
import { 
  Users, 
  ShoppingCart, 
  Star, 
  Calendar,
  Package,
  Clock
} from 'lucide-react';

// Sample data for demonstration
interface DemoItem {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  orders: number;
}

const sampleData: DemoItem[] = [
  {
    id: '1',
    name: 'Butter Chicken',
    category: 'Main Course',
    price: 299,
    rating: 4.8,
    status: 'active',
    createdAt: '2024-01-15',
    orders: 150
  },
  {
    id: '2',
    name: 'Paneer Tikka',
    category: 'Starters',
    price: 199,
    rating: 4.5,
    status: 'active',
    createdAt: '2024-01-14',
    orders: 89
  },
  {
    id: '3',
    name: 'Biryani Special',
    category: 'Rice',
    price: 349,
    rating: 4.9,
    status: 'active',
    createdAt: '2024-01-13',
    orders: 245
  },
  {
    id: '4',
    name: 'Dal Makhani',
    category: 'Main Course',
    price: 159,
    rating: 4.3,
    status: 'pending',
    createdAt: '2024-01-12',
    orders: 67
  },
  {
    id: '5',
    name: 'Naan Basket',
    category: 'Breads',
    price: 89,
    rating: 4.6,
    status: 'active',
    createdAt: '2024-01-11',
    orders: 112
  },
  {
    id: '6',
    name: 'Masala Chai',
    category: 'Beverages',
    price: 39,
    rating: 4.4,
    status: 'inactive',
    createdAt: '2024-01-10',
    orders: 203
  },
  {
    id: '7',
    name: 'Rajma Rice',
    category: 'Main Course',
    price: 179,
    rating: 4.2,
    status: 'active',
    createdAt: '2024-01-09',
    orders: 78
  },
  {
    id: '8',
    name: 'Samosa Chat',
    category: 'Snacks',
    price: 99,
    rating: 4.7,
    status: 'active',
    createdAt: '2024-01-08',
    orders: 134
  }
];

const StatusBadge = ({ status }: { status: string }) => {
  const colors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default function TestAnimationsPage() {
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [keyboardNavEnabled, setKeyboardNavEnabled] = useState(true);
  const [gradientsEnabled, setGradientsEnabled] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(0.05);

  const columns: Column<DemoItem>[] = [
    {
      id: 'name',
      header: 'Menu Item',
      accessor: 'name',
      width: '25%',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Package className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{row.category}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'price',
      header: 'Price',
      accessor: 'price',
      width: '15%',
      sortable: true,
      align: 'right',
      render: (value) => (
        <div className="text-right">
          <p className="font-semibold text-gray-900">₹{value}</p>
        </div>
      ),
    },
    {
      id: 'rating',
      header: 'Rating',
      accessor: 'rating',
      width: '15%',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="text-sm font-medium">{value}</span>
        </div>
      ),
    },
    {
      id: 'orders',
      header: 'Orders',
      accessor: 'orders',
      width: '15%',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-1">
          <ShoppingCart className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium">{value}</span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      width: '15%',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      id: 'createdAt',
      header: 'Created',
      accessor: 'createdAt',
      width: '15%',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-1">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{value}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🚀 Animated Table Demo
          </h1>
          <p className="text-gray-600">
            Showcasing the enhanced table with smooth animations, keyboard navigation, and interactive features.
          </p>
        </div>

        {/* Animation Controls */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Animation Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="animations"
                checked={animationsEnabled}
                onChange={(e) => setAnimationsEnabled(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="animations" className="text-sm font-medium text-gray-700">
                Enable Animations
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="keyboard"
                checked={keyboardNavEnabled}
                onChange={(e) => setKeyboardNavEnabled(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="keyboard" className="text-sm font-medium text-gray-700">
                Keyboard Navigation
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="gradients"
                checked={gradientsEnabled}
                onChange={(e) => setGradientsEnabled(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="gradients" className="text-sm font-medium text-gray-700">
                Scroll Gradients
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <label htmlFor="speed" className="text-sm font-medium text-gray-700">
                Speed:
              </label>
              <input
                type="range"
                id="speed"
                min="0.01"
                max="0.1"
                step="0.01"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-gray-500">{animationSpeed}s</span>
            </div>
          </div>
        </div>

        {/* Features Guide */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">✨ Try These Features:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-3 h-3 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Smooth Entry Animations</p>
                <p className="text-xs text-gray-600">Watch rows animate in as you scroll</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="w-3 h-3 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Keyboard Navigation</p>
                <p className="text-xs text-gray-600">Use ↑↓ arrows or Tab to navigate</p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Star className="w-3 h-3 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Interactive Hover</p>
                <p className="text-xs text-gray-600">Hover over rows for smooth scaling</p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShoppingCart className="w-3 h-3 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Click to Select</p>
                <p className="text-xs text-gray-600">Click any row to see interaction</p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Package className="w-3 h-3 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Search & Sort</p>
                <p className="text-xs text-gray-600">Use search box and column headers</p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Calendar className="w-3 h-3 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Scroll Gradients</p>
                <p className="text-xs text-gray-600">Gradient overlays indicate more content</p>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Table */}
        <AnimatedDataTable
          data={sampleData}
          columns={columns}
          searchable={true}
          pagination={true}
          pageSize={10}
          paginationLabel="menu items"
          enableAnimations={animationsEnabled}
          enableKeyboardNavigation={keyboardNavEnabled}
          animationDelay={animationSpeed}
          staggerDelay={0.1}
          showGradients={gradientsEnabled}
          emptyState={{
            title: 'No menu items found',
            description: 'Try adjusting your search criteria.',
            icon: Package,
          }}
          onRowClick={(item) => {
            alert(`Clicked on: ${item.name}\nPrice: ₹${item.price}\nRating: ${item.rating}⭐`);
          }}
          actions={{
            view: (item) => alert(`Viewing details for: ${item.name}`),
            edit: (item) => alert(`Editing: ${item.name}`),
            delete: (item) => alert(`Deleting: ${item.name}`)
          }}
        />

        {/* Instructions */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
          <h3 className="font-semibold text-gray-900 mb-2">🎮 Keyboard Controls:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div><kbd className="px-2 py-1 bg-white rounded border">↑↓</kbd> Navigate rows</div>
            <div><kbd className="px-2 py-1 bg-white rounded border">Tab</kbd> Next row</div>
            <div><kbd className="px-2 py-1 bg-white rounded border">Shift+Tab</kbd> Previous row</div>
            <div><kbd className="px-2 py-1 bg-white rounded border">Enter</kbd> Select row</div>
          </div>
        </div>
      </div>
    </div>
  );
} 