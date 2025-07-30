'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/UserProvider';
import {
  ArrowLeft,
  Save,
  Upload,
  Plus,
  Minus,
  Star,
  Leaf,
  AlertTriangle,
  UtensilsCrossed,
  DollarSign,
  Package,
  Info,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

interface MenuItemVariant {
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

export default function AddMenuItemPage() {
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    allergens: [],
    variants: [],
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [newAllergen, setNewAllergen] = useState('');

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
          isDefault: prev.variants.length === 0, // First variant is default
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

    // Validate variants
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
      setLoading(true);
      setError(null);

      const submitData = {
        ...formData,
        offerPrice: formData.offerPrice || undefined,
      };

      const response = await fetch('/api/manager/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (response.ok) {
        router.push('/manager/menu');
      } else {
        setError(result.error || 'Failed to create menu item');
      }
    } catch (err) {
      setError('Failed to create menu item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Link
            href='/manager/menu'
            className='flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors'
          >
            <ArrowLeft className='w-4 h-4' />
            <span>Back to Menu</span>
          </Link>
          <div className='h-6 w-px bg-gray-300'></div>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>
              Add New Menu Item
            </h1>
            <p className='text-gray-600'>
              Create a new menu item for{' '}
              {user?.university?.name || 'your university'}
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
                    placeholder='e.g., Chicken Biryani'
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
                    placeholder='Describe the item, ingredients, preparation method...'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Item Image
                  </label>
                  <div className='space-y-3'>
                    {/* File Upload */}
                    <div>
                      <input
                        type='file'
                        accept='image/*'
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {handleImageUpload(file);}
                        }}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100'
                        disabled={uploadingImage}
                      />
                      {uploadingImage && (
                        <div className='flex items-center space-x-2 mt-2 text-sm text-gray-600'>
                          <div className='w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin'></div>
                          <span>Uploading image...</span>
                        </div>
                      )}
                    </div>

                    {/* OR separator */}
                    <div className='flex items-center'>
                      <hr className='flex-1 border-gray-300' />
                      <span className='px-3 text-sm text-gray-500'>OR</span>
                      <hr className='flex-1 border-gray-300' />
                    </div>

                    {/* URL Input */}
                    <input
                      type='url'
                      value={formData.image}
                      onChange={e => handleInputChange('image', e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500'
                      placeholder='https://example.com/image.jpg'
                    />

                    {/* Image Preview */}
                    {formData.image && (
                      <div className='mt-3'>
                        <img
                          src={formData.image}
                          alt='Preview'
                          className='w-24 h-24 object-cover rounded-lg border border-gray-200'
                          onError={e => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
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
                    After creating this item, you can set its availability
                    schedule using the calendar icon in the menu management
                    table.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Variants Section */}
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold text-gray-900 flex items-center'>
              <Package className='w-5 h-5 mr-2' />
              Product Variants (Optional)
            </h2>
            <button
              type='button'
              onClick={addVariant}
              className='flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm'
            >
              <Plus className='w-4 h-4' />
              <span>Add Variant</span>
            </button>
          </div>

          {formData.variants.length > 0 && (
            <div className='space-y-4'>
              {formData.variants.map((variant, index) => (
                <div
                  key={index}
                  className='border border-gray-200 rounded-lg p-4'
                >
                  <div className='flex items-center justify-between mb-3'>
                    <h3 className='font-medium text-gray-900'>
                      Variant {index + 1}
                    </h3>
                    <button
                      type='button'
                      onClick={() => removeVariant(index)}
                      className='text-red-600 hover:text-red-800'
                    >
                      <Minus className='w-4 h-4' />
                    </button>
                  </div>

                  <div className='grid grid-cols-3 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Name *
                      </label>
                      <input
                        type='text'
                        value={variant.name}
                        onChange={e =>
                          updateVariant(index, 'name', e.target.value)
                        }
                        placeholder='e.g., Regular, Large, 250g'
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Price (INR) *
                      </label>
                      <input
                        type='number'
                        value={variant.price}
                        onChange={e =>
                          updateVariant(index, 'price', Number(e.target.value))
                        }
                        min='0'
                        step='1'
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm'
                      />
                    </div>

                    <div className='flex items-center'>
                      <label className='flex items-center space-x-2'>
                        <input
                          type='radio'
                          name='defaultVariant'
                          checked={variant.isDefault}
                          onChange={() => setDefaultVariant(index)}
                          className='w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500'
                        />
                        <span className='text-sm font-medium text-gray-700'>
                          Default
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className='flex items-center justify-end space-x-4 pt-6 border-t border-gray-200'>
          <Link
            href='/manager/menu'
            className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
          >
            Cancel
          </Link>
          <button
            type='submit'
            disabled={loading}
            className='flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50'
          >
            {loading ? (
              <>
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Save className='w-4 h-4' />
                <span>Create Menu Item</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
