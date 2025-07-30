'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/components/UserProvider';
import {
  ArrowLeft,
  Save,
  Star,
  Leaf,
  AlertTriangle,
  UtensilsCrossed,
  DollarSign,
  Package,
  Plus,
  Minus,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

interface MenuItemVariant {
  id?: string;
  name: string;
  price: number;
  isDefault: boolean;
}

interface FormData {
  name: string;
  description: string;
  basePrice: number;
  offerPrice: number | null;
  categories: string[];
  image: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isFeatured: boolean;
  isActive: boolean;
  allergens: string[];
  variants: MenuItemVariant[];
}

const CATEGORIES = [
  {
    value: 'BREAKFAST',
    label: 'Breakfast',
    color: 'bg-orange-100 text-orange-800',
  },
  { value: 'LUNCH', label: 'Lunch', color: 'bg-green-100 text-green-800' },
  { value: 'DINNER', label: 'Dinner', color: 'bg-blue-100 text-blue-800' },
  { value: 'SNACKS', label: 'Snacks', color: 'bg-purple-100 text-purple-800' },
  {
    value: 'BEVERAGES',
    label: 'Beverages',
    color: 'bg-pink-100 text-pink-800',
  },
];

const COMMON_ALLERGENS = [
  'Nuts',
  'Dairy',
  'Gluten',
  'Eggs',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame',
];

export default function EditMenuItemPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const menuItemId = params?.id as string;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    basePrice: 0,
    offerPrice: null,
    categories: [],
    image: '',
    isVegetarian: false,
    isVegan: false,
    isFeatured: false,
    isActive: true,
    allergens: [],
    variants: [],
  });

  const [newAllergen, setNewAllergen] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (file: File) => {
    if (!file) {return;}

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { url } = await response.json();
        handleInputChange('image', url);
        setImageFile(file);
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    if (menuItemId) {
      fetchMenuItemDetails();
    }
  }, [menuItemId]);

  const fetchMenuItemDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/manager/menu/${menuItemId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch menu item details');
      }

      const data = await response.json();

      // Map the API response to form data
      setFormData({
        name: data.name || '',
        description: data.description || '',
        basePrice: data.basePrice || 0,
        offerPrice: data.offerPrice || null,
        categories: data.categories || [],
        image: data.image || '',
        isVegetarian: data.isVegetarian || false,
        isVegan: data.isVegan || false,
        isFeatured: data.isFeatured || false,
        isActive: data.isActive !== undefined ? data.isActive : true,
        allergens: data.allergens || [],
        variants:
          data.variants?.map((v: any) => ({
            id: v.id,
            name: v.name,
            price: v.price,
            isDefault: v.isDefault,
          })) || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu item');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleAllergenToggle = (allergen: string) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen],
    }));
  };

  const addCustomAllergen = () => {
    if (
      newAllergen.trim() &&
      !formData.allergens.includes(newAllergen.trim())
    ) {
      setFormData(prev => ({
        ...prev,
        allergens: [...prev.allergens, newAllergen.trim()],
      }));
      setNewAllergen('');
    }
  };

  const removeAllergen = (allergen: string) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.filter(a => a !== allergen),
    }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          name: '',
          price: 0,
          isDefault: prev.variants.length === 0,
        },
      ],
    }));
  };

  const updateVariant = (
    index: number,
    field: keyof MenuItemVariant,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant
      ),
    }));
  };

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const setDefaultVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => ({
        ...variant,
        isDefault: i === index,
      })),
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {return 'Name is required';}
    if (formData.basePrice <= 0) {return 'Base price must be greater than 0';}
    if (formData.categories.length === 0)
      {return 'At least one category is required';}
    if (formData.offerPrice && formData.offerPrice >= formData.basePrice) {
      return 'Offer price must be less than base price';
    }

    for (let i = 0; i < formData.variants.length; i++) {
      const variant = formData.variants[i];
      if (!variant.name.trim()) {return `Variant ${i + 1} name is required`;}
      if (variant.price <= 0)
        {return `Variant ${i + 1} price must be greater than 0`;}
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const submitData = {
        ...formData,
        offerPrice: formData.offerPrice || undefined,
      };

      const response = await fetch(`/api/manager/menu/${menuItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (response.ok) {
        router.push(`/manager/menu/${menuItemId}`);
      } else {
        setError(result.error || 'Failed to update menu item');
      }
    } catch (err) {
      setError('Failed to update menu item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-300 rounded w-1/3 mb-4'></div>
          <div className='h-64 bg-gray-300 rounded mb-6'></div>
          <div className='h-32 bg-gray-300 rounded'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Link
            href={`/manager/menu/${menuItemId}`}
            className='flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors'
          >
            <ArrowLeft className='w-4 h-4' />
            <span>Back to Item</span>
          </Link>
          <div className='h-6 w-px bg-gray-300'></div>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Edit Menu Item</h1>
            <p className='text-gray-600'>
              Update menu item for {user?.university?.name || 'your university'}
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <div className='flex items-center space-x-2'>
            <AlertTriangle className='w-5 h-5 text-red-500' />
            <p className='text-red-700'>{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className='space-y-8'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Left Column */}
          <div className='space-y-6'>
            {/* Basic Information */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                Basic Information
              </h2>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Item Name *
                  </label>
                  <input
                    type='text'
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e =>
                      handleInputChange('description', e.target.value)
                    }
                    rows={3}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Image URL
                  </label>
                  <input
                    type='url'
                    value={formData.image}
                    onChange={e => handleInputChange('image', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500'
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                <DollarSign className='w-5 h-5 mr-2' />
                Pricing
              </h2>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Base Price (INR) *
                  </label>
                  <input
                    type='number'
                    value={formData.basePrice}
                    onChange={e =>
                      handleInputChange('basePrice', Number(e.target.value))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500'
                    min='0'
                    step='1'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Offer Price (INR)
                  </label>
                  <input
                    type='number'
                    value={formData.offerPrice || ''}
                    onChange={e =>
                      handleInputChange(
                        'offerPrice',
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500'
                    min='0'
                    step='1'
                    placeholder='Optional'
                  />
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                Categories *
              </h2>

              <div className='grid grid-cols-2 gap-3'>
                {CATEGORIES.map(category => (
                  <button
                    key={category.value}
                    type='button'
                    onClick={() => handleCategoryToggle(category.value)}
                    className={`p-3 rounded-lg border-2 transition-colors text-sm font-medium ${
                      formData.categories.includes(category.value)
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className='space-y-6'>
            {/* Item Properties */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                Item Properties
              </h2>

              <div className='space-y-4'>
                <label className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    checked={formData.isActive}
                    onChange={e =>
                      handleInputChange('isActive', e.target.checked)
                    }
                    className='w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500'
                  />
                  <span className='text-sm font-medium text-gray-700'>
                    Active
                  </span>
                </label>

                <label className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    checked={formData.isVegetarian}
                    onChange={e =>
                      handleInputChange('isVegetarian', e.target.checked)
                    }
                    className='w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500'
                  />
                  <Leaf className='w-4 h-4 text-green-500' />
                  <span className='text-sm font-medium text-gray-700'>
                    Vegetarian
                  </span>
                </label>

                <label className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    checked={formData.isVegan}
                    onChange={e =>
                      handleInputChange('isVegan', e.target.checked)
                    }
                    className='w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500'
                  />
                  <div className='w-4 h-4 bg-green-600 rounded-full flex items-center justify-center'>
                    <span className='text-xs text-white font-bold'>V</span>
                  </div>
                  <span className='text-sm font-medium text-gray-700'>
                    Vegan
                  </span>
                </label>

                <label className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    checked={formData.isFeatured}
                    onChange={e =>
                      handleInputChange('isFeatured', e.target.checked)
                    }
                    className='w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500'
                  />
                  <Star className='w-4 h-4 text-yellow-500' />
                  <span className='text-sm font-medium text-gray-700'>
                    Featured Item
                  </span>
                </label>
              </div>
            </div>

            {/* Allergens */}
            <div className='bg-white rounded-lg border border-gray-200 p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                Allergens
              </h2>

              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-2'>
                  {COMMON_ALLERGENS.map(allergen => (
                    <label
                      key={allergen}
                      className='flex items-center space-x-2'
                    >
                      <input
                        type='checkbox'
                        checked={formData.allergens.includes(allergen)}
                        onChange={() => handleAllergenToggle(allergen)}
                        className='w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500'
                      />
                      <span className='text-sm text-gray-700'>{allergen}</span>
                    </label>
                  ))}
                </div>

                <div className='flex space-x-2'>
                  <input
                    type='text'
                    value={newAllergen}
                    onChange={e => setNewAllergen(e.target.value)}
                    placeholder='Add custom allergen'
                    className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm'
                    onKeyPress={e =>
                      e.key === 'Enter' &&
                      (e.preventDefault(), addCustomAllergen())
                    }
                  />
                  <button
                    type='button'
                    onClick={addCustomAllergen}
                    className='px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm'
                  >
                    Add
                  </button>
                </div>

                {formData.allergens.length > 0 && (
                  <div className='flex flex-wrap gap-2 mt-3'>
                    {formData.allergens.map(allergen => (
                      <span
                        key={allergen}
                        className='inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-lg'
                      >
                        {allergen}
                        <button
                          type='button'
                          onClick={() => removeAllergen(allergen)}
                          className='ml-1 text-red-600 hover:text-red-800'
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Note about availability */}
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <div className='flex items-start space-x-3'>
                <Calendar className='w-5 h-5 text-blue-600 mt-0.5' />
                <div>
                  <h3 className='font-medium text-blue-900'>
                    Availability Management
                  </h3>
                  <p className='text-sm text-blue-700 mt-1'>
                    Use the calendar icon in the menu management table or the
                    item details page to set availability schedule for this
                    item.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className='flex items-center justify-end space-x-4 pt-6 border-t border-gray-200'>
          <Link
            href={`/manager/menu/${menuItemId}`}
            className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
          >
            Cancel
          </Link>
          <button
            type='submit'
            disabled={saving}
            className='flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50'
          >
            {saving ? (
              <>
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className='w-4 h-4' />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
