'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  Leaf, 
  Heart,
  Save,
  X,
  Check
} from 'lucide-react';

interface MealCategory {
  id: string;
  name: string;
  description?: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isHalal: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    mealPlans: number;
  };
}

interface CategoryFormData {
  name: string;
  description: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isHalal: boolean;
}

export default function MealCategoriesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<MealCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MealCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    isVegetarian: false,
    isVegan: false,
    isHalal: false,
  });
  const [submitting, setSubmitting] = useState(false);

  // Redirect if not authenticated or not manager/admin
  useEffect(() => {
    if (session && session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [session, router]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/meal-planning/categories');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch categories');
      }

      setCategories(data.categories);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchCategories();
    }
  }, [session]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const url = editingCategory 
        ? `/api/meal-planning/categories/${editingCategory.id}`
        : '/api/meal-planning/categories';
      
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save category');
      }

      // Refresh categories
      await fetchCategories();
      
      // Reset form
      setShowForm(false);
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        isVegetarian: false,
        isVegan: false,
        isHalal: false,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (category: MealCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      isVegetarian: category.isVegetarian,
      isVegan: category.isVegan,
      isHalal: category.isHalal,
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (category: MealCategory) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/meal-planning/categories/${category.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete category');
      }

      // Refresh categories
      await fetchCategories();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Cancel form
  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      isVegetarian: false,
      isVegan: false,
      isHalal: false,
    });
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading meal categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/manager/meal-planning"
                  className="flex items-center text-teal-600 hover:text-teal-700"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Meal Categories</h1>
                  <p className="mt-2 text-gray-600">
                    Manage meal categories like South Indian Veg, North Indian Non Veg, etc.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Category</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="e.g., South Indian Veg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    rows={2}
                    placeholder="Brief description of the category"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Category Properties
                  </label>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isVegetarian"
                      checked={formData.isVegetarian}
                      onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <label htmlFor="isVegetarian" className="text-sm text-gray-700 flex items-center">
                      <Leaf className="w-4 h-4 text-green-500 mr-1" />
                      Vegetarian
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isVegan"
                      checked={formData.isVegan}
                      onChange={(e) => setFormData({ ...formData, isVegan: e.target.checked })}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <label htmlFor="isVegan" className="text-sm text-gray-700 flex items-center">
                      <Heart className="w-4 h-4 text-green-600 mr-1" />
                      Vegan
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isHalal"
                      checked={formData.isHalal}
                      onChange={(e) => setFormData({ ...formData, isHalal: e.target.checked })}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <label htmlFor="isHalal" className="text-sm text-gray-700">
                      Halal
                    </label>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{submitting ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Categories List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-gray-600">{category.description}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {category.isVegetarian && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Leaf className="w-3 h-3 mr-1" />
                    Vegetarian
                  </span>
                )}
                {category.isVegan && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Heart className="w-3 h-3 mr-1" />
                    Vegan
                  </span>
                )}
                {category.isHalal && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Halal
                  </span>
                )}
                {category.isActive && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                    <Check className="w-3 h-3 mr-1" />
                    Active
                  </span>
                )}
              </div>

              <div className="text-sm text-gray-500">
                <p>Created: {new Date(category.createdAt).toLocaleDateString()}</p>
                {category._count && (
                  <p>Meal Plans: {category._count.mealPlans}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Plus className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first meal category to get started with meal planning.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Add First Category
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 