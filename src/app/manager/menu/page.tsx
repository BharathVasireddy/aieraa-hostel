'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/components/UserProvider';
import { useRouter } from 'next/navigation';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  UtensilsCrossed,
  Plus,
  Eye,
  Edit,
  ToggleLeft,
  ToggleRight,
  Search,
  Filter,
  Star,
  Leaf,
  AlertCircle,
  Package,
  DollarSign,
  Clock,
  RefreshCw,
  Image as ImageIcon,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import AvailabilityModal from '@/components/manager/AvailabilityModal';

interface MenuItemVariant {
  id: string;
  name: string;
  price: number;
  isDefault: boolean;
  isActive: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  offerPrice?: number;
  categories: string[];
  image?: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isFeatured: boolean;
  allergens: string[];
  isActive: boolean;
  variants: MenuItemVariant[];
  createdAt: string;
  updatedAt: string;
}

interface MenuResponse {
  menuItems: MenuItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    total: number;
    active: number;
    inactive: number;
    featured: number;
    vegetarian: number;
    vegan: number;
  };
}

export default function ManagerMenuPage() {
  const { user } = useUser();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(
    null
  );
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    featured: 0,
    vegetarian: 0,
    vegan: 0,
  });

  const categories = [
    'ALL',
    'BREAKFAST',
    'LUNCH',
    'DINNER',
    'SNACKS',
    'BEVERAGES',
  ];
  const filters = [
    'ALL',
    'ACTIVE',
    'INACTIVE',
    'FEATURED',
    'VEGETARIAN',
    'VEGAN',
  ];

  const fetchMenuItems = useCallback(async () => {
    if (!user?.universityId) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '50',
      });

      if (selectedCategory !== 'ALL') {
        params.append('category', selectedCategory);
      }

      if (selectedFilter !== 'ALL') {
        params.append('filter', selectedFilter.toLowerCase());
      }

      const response = await fetch(`/api/manager/menu?${params}`);

      if (response.ok) {
        const data: MenuResponse = await response.json();
        setMenuItems(data.menuItems || []);
        setSummary(
          data.summary || {
            total: 0,
            active: 0,
            inactive: 0,
            featured: 0,
            vegetarian: 0,
            vegan: 0,
          }
        );
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.universityId, selectedCategory, selectedFilter]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const toggleItemStatus = async (itemId: string, currentStatus: boolean) => {
    try {
      setUpdating(itemId);

      const response = await fetch(`/api/manager/menu/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        await fetchMenuItems();
      }
    } catch (error) {
      console.error('Failed to toggle item status:', error);
    } finally {
      setUpdating(null);
    }
  };

  const toggleFeatured = async (itemId: string, currentFeatured: boolean) => {
    try {
      setUpdating(itemId);

      const response = await fetch(`/api/manager/menu/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !currentFeatured }),
      });

      if (response.ok) {
        await fetchMenuItems();
      }
    } catch (error) {
      console.error('Failed to toggle featured status:', error);
    } finally {
      setUpdating(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      BREAKFAST: 'bg-orange-100 text-orange-800',
      LUNCH: 'bg-green-100 text-green-800',
      DINNER: 'bg-blue-100 text-blue-800',
      SNACKS: 'bg-purple-100 text-purple-800',
      BEVERAGES: 'bg-pink-100 text-pink-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const columns: Column<MenuItem>[] = [
    {
      id: 'image',
      header: 'Image',
      accessor: 'image',
      width: '8%',
      render: (value, row) => (
        <div className='w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center'>
          {value ? (
            <img
              src={value}
              alt={row.name}
              className='w-full h-full object-cover'
            />
          ) : (
            <ImageIcon className='w-6 h-6 text-gray-400' />
          )}
        </div>
      ),
    },
    {
      id: 'name',
      header: 'Menu Item',
      accessor: 'name',
      width: '25%',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className='flex items-center space-x-2'>
            <p className='font-semibold text-gray-900'>{value}</p>
            {row.isFeatured && (
              <Star className='w-4 h-4 text-yellow-500 fill-current' />
            )}
            {row.isVegetarian && <Leaf className='w-4 h-4 text-green-500' />}
            {row.isVegan && (
              <div className='w-4 h-4 bg-green-600 rounded-full flex items-center justify-center'>
                <span className='text-xs text-white font-bold'>V</span>
              </div>
            )}
          </div>
          {row.description && (
            <p className='text-xs text-gray-600 mt-1 line-clamp-2'>
              {row.description}
            </p>
          )}
          <div className='flex flex-wrap gap-1 mt-2'>
            {row.categories.map((category, index) => (
              <span
                key={index}
                className={`text-xs px-2 py-1 rounded ${getCategoryBadgeColor(category)}`}
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'pricing',
      header: 'Pricing',
      accessor: 'basePrice',
      width: '15%',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className='flex items-center space-x-2'>
            {row.offerPrice ? (
              <>
                <span className='text-sm font-semibold text-green-600'>
                  {formatCurrency(row.offerPrice)}
                </span>
                <span className='text-xs text-gray-500 line-through'>
                  {formatCurrency(value)}
                </span>
              </>
            ) : (
              <span className='text-sm font-semibold text-gray-900'>
                {formatCurrency(value)}
              </span>
            )}
          </div>
          {row.variants.length > 0 && (
            <p className='text-xs text-gray-500 mt-1'>
              {row.variants.length} variant{row.variants.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      ),
    },

    {
      id: 'status',
      header: 'Status',
      accessor: 'isActive',
      width: '12%',
      sortable: true,
      render: value => (
        <StatusBadge status={value ? 'ACTIVE' : 'INACTIVE'} size='sm' />
      ),
    },
    {
      id: 'allergens',
      header: 'Allergens',
      accessor: 'allergens',
      width: '15%',
      render: value => (
        <div>
          {value && value.length > 0 ? (
            <div className='flex flex-wrap gap-1'>
              {value.slice(0, 3).map((allergen: string, index: number) => (
                <span
                  key={index}
                  className='text-xs bg-red-100 text-red-800 px-2 py-1 rounded'
                >
                  {allergen}
                </span>
              ))}
              {value.length > 3 && (
                <span className='text-xs text-gray-500'>
                  +{value.length - 3}
                </span>
              )}
            </div>
          ) : (
            <span className='text-xs text-gray-400'>None</span>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      accessor: 'id',
      width: '20%',
      render: (value, row) => (
        <div className='flex items-center space-x-1'>
          <Link href={`/manager/menu/${value}`}>
            <button
              className='p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors'
              title='View Details'
            >
              <Eye className='w-3.5 h-3.5' />
            </button>
          </Link>

          <Link href={`/manager/menu/${value}/edit`}>
            <button
              className='p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors'
              title='Edit Item'
            >
              <Edit className='w-3.5 h-3.5' />
            </button>
          </Link>

          <button
            onClick={() => toggleFeatured(value, row.isFeatured)}
            disabled={updating === value}
            className={`p-1.5 rounded transition-colors ${
              row.isFeatured
                ? 'text-yellow-600 hover:bg-yellow-50'
                : 'text-gray-400 hover:bg-gray-50'
            }`}
            title={row.isFeatured ? 'Remove from Featured' : 'Mark as Featured'}
          >
            {updating === value ? (
              <RefreshCw className='w-3.5 h-3.5 animate-spin' />
            ) : (
              <Star
                className={`w-3.5 h-3.5 ${row.isFeatured ? 'fill-current' : ''}`}
              />
            )}
          </button>

          <button
            onClick={() => {
              setSelectedMenuItem(row);
              setShowAvailabilityModal(true);
            }}
            className='p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors'
            title='Set Availability'
          >
            <Calendar className='w-3.5 h-3.5' />
          </button>

          <button
            onClick={() => toggleItemStatus(value, row.isActive)}
            disabled={updating === value}
            className={`p-1.5 rounded transition-colors ${
              row.isActive
                ? 'text-green-600 hover:bg-green-50'
                : 'text-red-600 hover:bg-red-50'
            }`}
            title={row.isActive ? 'Deactivate Item' : 'Activate Item'}
          >
            {updating === value ? (
              <RefreshCw className='w-3.5 h-3.5 animate-spin' />
            ) : row.isActive ? (
              <ToggleRight className='w-4 h-4' />
            ) : (
              <ToggleLeft className='w-4 h-4' />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Menu Management</h1>
          <p className='text-gray-600'>
            Manage menu items for {user?.university?.name || 'your university'}
          </p>
        </div>
        <div className='flex items-center space-x-3'>
          <button
            onClick={() => fetchMenuItems()}
            className='flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
          >
            <RefreshCw className='w-4 h-4' />
            <span>Refresh</span>
          </button>
          <Link href='/manager/menu/new'>
            <button className='flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'>
              <Plus className='w-4 h-4' />
              <span>Add Menu Item</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
        <div className='bg-white rounded-lg border border-gray-200 p-4'>
          <div className='flex items-center'>
            <UtensilsCrossed className='w-8 h-8 text-blue-600' />
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-600'>Total Items</p>
              <p className='text-2xl font-bold text-blue-600'>
                {summary.total}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 p-4'>
          <div className='flex items-center'>
            <ToggleRight className='w-8 h-8 text-green-600' />
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-600'>Active</p>
              <p className='text-2xl font-bold text-green-600'>
                {summary.active}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 p-4'>
          <div className='flex items-center'>
            <ToggleLeft className='w-8 h-8 text-red-600' />
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-600'>Inactive</p>
              <p className='text-2xl font-bold text-red-600'>
                {summary.inactive}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 p-4'>
          <div className='flex items-center'>
            <Star className='w-8 h-8 text-yellow-600' />
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-600'>Featured</p>
              <p className='text-2xl font-bold text-yellow-600'>
                {summary.featured}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 p-4'>
          <div className='flex items-center'>
            <Leaf className='w-8 h-8 text-green-600' />
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-600'>Vegetarian</p>
              <p className='text-2xl font-bold text-green-600'>
                {summary.vegetarian}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg border border-gray-200 p-4'>
          <div className='flex items-center'>
            <div className='w-8 h-8 bg-green-600 rounded-full flex items-center justify-center'>
              <span className='text-white font-bold'>V</span>
            </div>
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-600'>Vegan</p>
              <p className='text-2xl font-bold text-green-600'>
                {summary.vegan}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className='bg-white rounded-lg border border-gray-200 p-4'>
        <div className='space-y-4'>
          {/* Categories */}
          <div>
            <label className='text-sm font-medium text-gray-700 mb-2 block'>
              Filter by Category:
            </label>
            <div className='flex flex-wrap gap-2'>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-green-100 text-green-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {category.charAt(0) + category.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filters */}
          <div>
            <label className='text-sm font-medium text-gray-700 mb-2 block'>
              Filter by Status:
            </label>
            <div className='flex flex-wrap gap-2'>
              {filters.map(filter => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedFilter === filter
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {filter.charAt(0) + filter.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items Table */}
      <DataTable
        data={menuItems}
        columns={columns}
        loading={loading}
        searchable={true}
        pagination={true}
        pageSize={15}
        paginationLabel='menu items'
        emptyState={{
          title: 'No menu items found',
          description: 'Start by adding your first menu item.',
          icon: UtensilsCrossed,
        }}
      />

      {/* Availability Management Modal */}
      {showAvailabilityModal && selectedMenuItem && (
        <AvailabilityModal
          menuItem={selectedMenuItem}
          onClose={() => {
            setShowAvailabilityModal(false);
            setSelectedMenuItem(null);
          }}
          onSave={() => {
            fetchMenuItems(); // Refresh the list
            setShowAvailabilityModal(false);
            setSelectedMenuItem(null);
          }}
        />
      )}
    </div>
  );
}
