'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useUser } from '@/components/UserProvider';
import { ArrowLeft, Plus, Trash2, Save, Upload, X } from 'lucide-react';
import { ButtonPress } from '@/components/PageTransition';
import { cachedFetch } from '@/lib/cache';

interface MenuItemVariant {
  id: string;
  name: string;
  price: number;
  description: string;
  isDefault: boolean;
}

interface MenuItemFormData {
  name: string;
  description: string;
  category: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isAvailable: boolean;
  imageUrl: string;
  universityId: string;
  variants: MenuItemVariant[];
}

interface University {
  id: string;
  name: string;
  code: string;
}

const categories = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
  'Beverages',
  'Desserts',
];

export default function NewMenuItemPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { user: currentUserData } = useUser();

  const [formData, setFormData] = useState<MenuItemFormData>({
    name: '',
    description: '',
    category: categories[0],
    isVegetarian: false,
    isVegan: false,
    isAvailable: true,
    imageUrl: '',
    universityId: '',
    variants: [
      {
        id: '1',
        name: 'Regular',
        price: 0,
        description: 'Regular portion',
        isDefault: true,
      },
    ],
  });

  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (currentUserData) {
      if (currentUserData.role === 'ADMIN') {
        void fetchUniversities();
      } else if (
        currentUserData.role === 'MANAGER' &&
        currentUserData.university?.id
      ) {
        setFormData(prev => ({
          ...prev,
          universityId: currentUserData.university?.id ?? '',
        }));
      }
    }
  }, [currentUserData]);

  const fetchUniversities = async () => {
    try {
      const data = await cachedFetch('/api/admin/universities');
      setUniversities(data.universities ?? []);

      // Auto-select first university for admin
      if (data.universities && data.universities.length > 0) {
        const firstUniversity = data.universities[0];
        setFormData(prev => ({
          ...prev,
          universityId: firstUniversity.id,
        }));
      }
    } catch {
      setError('Failed to fetch universities');
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {return;}

    setUploadingImage(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, imageUrl: data.imageUrl }));
        setSuccess('Image uploaded successfully');
      } else {
        throw new Error('Upload failed');
      }
    } catch {
      setError('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const addVariant = () => {
    const newVariant: MenuItemVariant = {
      id: Date.now().toString(),
      name: '',
      price: 0,
      description: '',
      isDefault: false,
    };

    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant],
    }));
  };

  const removeVariant = (variantId: string) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter(v => v.id !== variantId),
    }));
  };

  const updateVariant = (
    variantId: string,
    updates: Partial<MenuItemVariant>
  ) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(v =>
        v.id === variantId ? { ...v, ...updates } : v
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate form data
      const validCategories = [
        'Breakfast',
        'Lunch',
        'Dinner',
        'Snacks',
        'Beverages',
        'Desserts',
      ];
      if (!validCategories.includes(formData.category)) {
        throw new Error('Invalid category selected');
      }

      if (formData.variants.length === 0) {
        throw new Error('At least one variant is required');
      }

      // Ensure we have exactly one default variant
      const defaultVariants = formData.variants.filter(v => v.isDefault);
      if (defaultVariants.length !== 1) {
        throw new Error('Exactly one variant must be marked as default');
      }

      // Validate that all variants have names and prices
      const invalidVariants = formData.variants.filter(
        v => !v.name.trim() || v.price <= 0
      );
      if (invalidVariants.length > 0) {
        throw new Error(
          'All variants must have a name and price greater than 0'
        );
      }

      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        isVegetarian: formData.isVegetarian,
        isVegan: formData.isVegan,
        isAvailable: formData.isAvailable,
        imageUrl: formData.imageUrl,
        universityId: formData.universityId,
        variants: formData.variants.map(v => ({
          name: v.name.trim(),
          price: v.price,
          description: v.description.trim(),
          isDefault: v.isDefault,
        })),
      };

      const response = await fetch('/api/admin/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Menu item created successfully!');
        setTimeout(() => {
          router.push('/admin/menu');
        }, 1500);
      } else {
        setError(data.error ?? 'Failed to create menu item');
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-gray-600'>Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-4xl mx-auto p-4'>
        {/* Header */}
        <div className='mb-6'>
          <div className='flex items-center gap-4 mb-4'>
            <ButtonPress
              onClick={() => router.push('/admin/menu')}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <ArrowLeft className='w-5 h-5' />
            </ButtonPress>
            <h1 className='text-2xl font-bold text-gray-900'>
              Add New Menu Item
            </h1>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className='mb-6 p-4 bg-green-100 border border-green-300 rounded-lg'>
            <p className='text-green-700'>{success}</p>
          </div>
        )}

        {error && (
          <div className='mb-6 p-4 bg-red-100 border border-red-300 rounded-lg'>
            <p className='text-red-700'>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Basic Information */}
          <div className='bg-white rounded-lg shadow-sm p-6 border border-gray-200'>
            <h2 className='text-xl font-semibold mb-4'>Basic Information</h2>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Item Name *
                </label>
                <input
                  type='text'
                  required
                  value={formData.name}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter item name'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, category: e.target.value }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* University Selection (Admin only) */}
              {currentUserData?.role === 'ADMIN' && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    University *
                  </label>
                  <select
                    required
                    value={formData.universityId}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        universityId: e.target.value,
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value=''>Select University</option>
                    {universities.map(university => (
                      <option key={university.id} value={university.id}>
                        {university.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className='mt-4'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Enter item description'
              />
            </div>

            {/* Image Upload */}
            <div className='mt-4'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Item Image
              </label>
              <div className='flex items-center gap-4'>
                <input
                  type='file'
                  accept='image/*'
                  onChange={handleImageUpload}
                  className='hidden'
                  id='image-upload'
                />
                <label
                  htmlFor='image-upload'
                  className='flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors'
                >
                  <Upload className='w-4 h-4' />
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                </label>
                {formData.imageUrl && (
                  <div className='flex items-center gap-2'>
                    <Image
                      src={formData.imageUrl}
                      alt='Preview'
                      className='w-16 h-16 object-cover rounded'
                      width={64}
                      height={64}
                    />
                    <button
                      type='button'
                      onClick={() =>
                        setFormData(prev => ({ ...prev, imageUrl: '' }))
                      }
                      className='p-1 text-red-500 hover:bg-red-50 rounded'
                    >
                      <X className='w-4 h-4' />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Checkboxes */}
            <div className='mt-4 space-y-2'>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={formData.isVegetarian}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      isVegetarian: e.target.checked,
                    }))
                  }
                  className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                />
                <span className='text-sm text-gray-700'>Vegetarian</span>
              </label>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={formData.isVegan}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      isVegan: e.target.checked,
                    }))
                  }
                  className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                />
                <span className='text-sm text-gray-700'>Vegan</span>
              </label>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={formData.isAvailable}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      isAvailable: e.target.checked,
                    }))
                  }
                  className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                />
                <span className='text-sm text-gray-700'>Available</span>
              </label>
            </div>
          </div>

          {/* Variants */}
          <div className='bg-white rounded-lg shadow-sm p-6 border border-gray-200'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-semibold'>Variants</h2>
              <button
                type='button'
                onClick={addVariant}
                className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
              >
                <Plus className='w-4 h-4' />
                Add Variant
              </button>
            </div>

            <div className='space-y-4'>
              {formData.variants.map((variant, index) => (
                <div
                  key={variant.id}
                  className='p-4 border border-gray-200 rounded-lg'
                >
                  <div className='flex items-center justify-between mb-3'>
                    <h3 className='font-medium'>Variant {index + 1}</h3>
                    {formData.variants.length > 1 && (
                      <button
                        type='button'
                        onClick={() => removeVariant(variant.id)}
                        className='p-1 text-red-500 hover:bg-red-50 rounded'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    )}
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Name *
                      </label>
                      <input
                        type='text'
                        required
                        value={variant.name}
                        onChange={e =>
                          updateVariant(variant.id, { name: e.target.value })
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        placeholder='Variant name'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Price (₹) *
                      </label>
                      <input
                        type='number'
                        required
                        min='0'
                        step='0.01'
                        value={variant.price}
                        onChange={e =>
                          updateVariant(variant.id, {
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        placeholder='0.00'
                      />
                    </div>
                  </div>

                  <div className='mt-3'>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Description
                    </label>
                    <input
                      type='text'
                      value={variant.description}
                      onChange={e =>
                        updateVariant(variant.id, {
                          description: e.target.value,
                        })
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='Variant description'
                    />
                  </div>

                  <div className='mt-3'>
                    <label className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        checked={variant.isDefault}
                        onChange={e => {
                          // When setting a variant as default, unset all others
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              variants: prev.variants.map(v => ({
                                ...v,
                                isDefault: v.id === variant.id,
                              })),
                            }));
                          }
                        }}
                        className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                      />
                      <span className='text-sm text-gray-700'>
                        Default variant
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className='flex justify-end'>
            <button
              type='submit'
              disabled={loading || uploadingImage}
              className='flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              <Save className='w-4 h-4' />
              {loading ? 'Creating...' : 'Create Menu Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
