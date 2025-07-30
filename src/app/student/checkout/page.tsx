'use client';

import {
  AlertCircle,
  ArrowLeft,
  CreditCard,
  Edit3,
  Info,
  Minus,
  Package,
  Plus,
  Shield,
  Trash2,
  User,
  Calendar,
} from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays, startOfToday } from 'date-fns';
import StudentLayout from '@/components/StudentLayout';
import { getVietnamTime, getOrderingCountdown } from '@/lib/timezone';
import { useUser } from '@/components/UserProvider';
import { useCart } from '@/components/CartProvider';
import Script from 'next/script';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea, FormField } from '@/components/ui/Input';

// Declare confetti as a global function
declare global {
  interface Window {
    confetti: (options?: any) => void;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useUser();
  const {
    items: cartItems,
    updateQuantity,
    removeItem,
    getTotalItems,
    getTotalPrice,
    clearCart,
    isLoading: cartLoading,
  } = useCart();
  
  const [loading, setLoading] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [cutoffHours, setCutoffHours] = useState<number | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());

  // Get selected date from localStorage
  const [selectedDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved =
        localStorage.getItem('checkoutDate') ||
        localStorage.getItem('selectedOrderDate');
      if (saved) {return saved;}
    }
    const tomorrow = addDays(startOfToday(), 1);
    return format(tomorrow, 'yyyy-MM-dd');
  });

  // Fetch cutoff time from API
  useEffect(() => {
    const fetchCutoffTime = async () => {
      try {
        const response = await fetch('/api/student/cutoff-info');
        if (response.ok) {
          const data = await response.json();
          if (data.success && typeof data.cutoffHours === 'number') {
            setCutoffHours(data.cutoffHours);
          }
        } else {
          console.warn('Checkout cutoff API error:', response.status, 'Using default 22 hours');
          setCutoffHours(22);
        }
      } catch (error) {
        console.error('Failed to fetch cutoff time:', error);
        setCutoffHours(22);
      }
    };

    void fetchCutoffTime();
  }, []);

  // Get countdown for selected date
  const countdown = useMemo(() => {
    return cutoffHours !== null
      ? getOrderingCountdown(selectedDate, cutoffHours)
      : null;
  }, [selectedDate, cutoffHours]);

  // Check if cart is empty and redirect to menu
  useEffect(() => {
    if (cartItems.length === 0 && !orderPlaced && !loading) {
      const timer = setTimeout(() => {
        router.push('/student/menu');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cartItems.length, router, orderPlaced, loading]);

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = getTotalPrice();
    const deliveryFee = 0; // Free delivery for hostel
    const tax = Math.round(subtotal * 0.05); // 5% tax
    const total = subtotal + deliveryFee + tax;

    return {
      subtotal,
      deliveryFee,
      tax,
      total,
      itemCount: getTotalItems(),
    };
  }, [getTotalPrice, getTotalItems]);

  // Create unique cart item key
  const getCartItemKey = (itemId: string, variantId?: string) => {
    return `${itemId}${variantId ? `-${variantId}` : ''}`;
  };

  // Enhanced cart management functions
  const handleUpdateQuantity = useCallback(
    async (itemId: string, newQuantity: number, variantId?: string) => {
      try {
        console.log('Updating quantity:', { itemId, newQuantity, variantId });
        
        if (newQuantity <= 0) {
          // Don't call handleRemoveItem here - just return early
          // The separate delete button should handle removal
          return;
        } else {
          await updateQuantity(itemId, newQuantity, variantId);
        }
      } catch (error) {
        console.error('Failed to update quantity:', error);
      }
    },
    [updateQuantity]
  );

  const handleRemoveItem = useCallback(
    async (itemId: string, variantId?: string) => {
      const itemKey = getCartItemKey(itemId, variantId);
      
      try {
        console.log('Removing item:', { itemId, variantId, itemKey });
        
        // Add to deleting state to show loading
        setDeletingItems(prev => new Set(prev).add(itemKey));
        
        // Call remove with exact same parameters as cart item
        await removeItem(itemId, variantId);
        
        console.log('Item removed successfully');
      } catch (error) {
        console.error('Failed to remove item:', error);
      } finally {
        // Remove from deleting state
        setDeletingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemKey);
          return newSet;
        });
      }
    },
    [removeItem]
  );

  // Validation
  const isValidForm = useMemo(() => {
    return cartItems.length > 0 && (countdown ? !countdown.isPastCutoff : true);
  }, [cartItems, countdown]);

  const handlePlaceOrder = useCallback(async () => {
    if (!isValidForm || loading) {return;}

    setLoading(true);
    try {
      const orderData = {
        items: cartItems.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity,
          variantId: item.variantId,
        })),
        orderDate: selectedDate,
        specialInstructions: specialInstructions || undefined,
        paymentMethod: 'cash',
      };

      console.log('Placing order with data:', orderData);

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Order placed successfully:', result);

        if (!result.order?.id || !result.order?.orderNumber) {
          throw new Error('Order was placed but missing details for confirmation');
        }

        setOrderPlaced(true);

        // Launch confetti celebration
        if (typeof window !== 'undefined' && window.confetti) {
          window.confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#22C55E', '#4ADE80', '#BBF7D0', '#F1F5F9', '#10B981', '#3B82F6', '#60A5FA'],
          });
        }

        // Clear cart
        try {
          await clearCart();
          localStorage.removeItem('checkoutDate');
        } catch (cartError) {
          console.warn('Failed to clear cart:', cartError);
        }

        await new Promise(resolve => setTimeout(resolve, 300));

        const successUrl = `/student/order-success?orderId=${result.order.id}&orderNumber=${result.order.orderNumber}`;
        router.push(successUrl);
      } else {
        const error = await response.json();
        console.error('Order API error:', error);

        if (error.cutoffPassed) {
          alert('Order deadline has passed. Please select a different date.');
          return;
        }

        if (error.invalidDate) {
          alert('Invalid order date. Please select a future date.');
          return;
        }

        throw new Error(error.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order placement failed:', error);

      let errorMessage = 'Failed to place order. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('cutoff') || error.message.includes('deadline')) {
          errorMessage = 'Order deadline has passed. Please select a different date.';
        } else {
          errorMessage = `Failed to place order: ${error.message}`;
        }
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isValidForm, loading, cartItems, selectedDate, specialInstructions, router, clearCart]);

  // Loading state
  if (!user) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-body-sm">Loading...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // Empty cart state
  if (cartItems.length === 0 && !loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-body-sm">Loading your cart...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/tsparticles-confetti@2.12.0/tsparticles.confetti.bundle.min.js"
        strategy="lazyOnload"
      />
      <StudentLayout>
        {/* Header */}
        <div className="bg-white border-b border-neutral-200 px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="p-2 -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-heading-2">Checkout</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Calendar className="w-4 h-4 text-neutral-500" />
                <p className="text-body-sm text-neutral-600">
                  {format(new Date(selectedDate), 'EEEE, MMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="page-section pb-32">
          {/* Order Cutoff Warning */}
          {countdown && countdown.isPastCutoff && (
            <Card className="bg-error-50 border-error-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-error-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-heading-4 text-error-800 mb-1">
                      Ordering Deadline Passed
                    </h3>
                    <p className="text-body-sm text-error-700">
                      Orders must be placed before the daily cutoff time the day before. 
                      Please select a different date to place your order.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cart Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Order</CardTitle>
                <span className="text-body-sm text-neutral-600">
                  {totals.itemCount} item{totals.itemCount > 1 ? 's' : ''}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartItems.map(item => {
                  const itemKey = getCartItemKey(item.id, item.variantId);
                  const isDeleting = deletingItems.has(itemKey);
                  
                  return (
                    <div
                      key={itemKey}
                      className={`card-interactive p-4 transition-all duration-200 ${
                        isDeleting ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        {/* Image */}
                        <div className="w-16 h-16 bg-neutral-100 rounded-xl flex-shrink-0 overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-neutral-400" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-heading-4 truncate">{item.name}</h3>
                          {item.variantName && (
                            <p className="text-body-sm text-neutral-600 mt-0.5">
                              Size: {item.variantName}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-1">
                            {item.isVegetarian && (
                              <div className="veg-indicator">
                                <div className="veg-indicator-dot"></div>
                              </div>
                            )}
                            <span className="price-display">₹{item.price}</span>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2">
                          <div className="quantity-controls">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.variantId)}
                              disabled={cartLoading || isDeleting}
                              className="quantity-btn"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="quantity-display">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.variantId)}
                              disabled={cartLoading || isDeleting}
                              className="quantity-btn"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id, item.variantId)}
                            disabled={cartLoading || isDeleting}
                            className="p-2 text-error-600 hover:bg-error-50"
                          >
                            {isDeleting ? (
                              <div className="spinner w-4 h-4" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Student Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="icon-container-primary">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <CardTitle>Student Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-caption">Name</label>
                  <div className="text-body font-medium">{user.name}</div>
                </div>
                <div>
                  <label className="text-caption">Student ID</label>
                  <div className="text-body font-medium">{user.studentId}</div>
                </div>
                <div>
                  <label className="text-caption">Room Number</label>
                  <div className="text-body font-medium">{user.roomNumber}</div>
                </div>
                <div>
                  <label className="text-caption">Phone Number</label>
                  <div className="text-body font-medium">{user.phone}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Special Instructions */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="icon-container">
                  <Edit3 className="w-5 h-5 text-neutral-600" />
                </div>
                <CardTitle>Special Instructions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <FormField
                help="Any special instructions for your order (optional)"
              >
                <Textarea
                  value={specialInstructions}
                  onChange={e => setSpecialInstructions(e.target.value)}
                  placeholder="e.g., Extra spicy, no onions, deliver to room entrance..."
                  rows={3}
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-body">Subtotal</span>
                  <span className="text-body font-medium">₹{totals.subtotal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-body">Delivery Fee</span>
                  <span className="text-body font-medium text-success-600">Free</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-body">Tax (5%)</span>
                  <span className="text-body font-medium">₹{totals.tax}</span>
                </div>
                <div className="border-t border-neutral-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-heading-3">Total</span>
                    <span className="text-heading-2 text-primary-600">₹{totals.total}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card className="bg-info-50 border-info-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-info-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-heading-4 text-info-800 mb-2">
                    Delivery Information
                  </h3>
                  <ul className="text-body-sm text-info-700 space-y-1">
                    <li>• Food will be delivered to your room: {user.roomNumber}</li>
                    <li>• Delivery time: 12:00 PM - 2:00 PM on {format(new Date(selectedDate), 'MMM d, yyyy')}</li>
                    <li>• Payment: Cash on delivery</li>
                    <li>• Please be available during delivery hours</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className="bg-success-50 border-success-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-success-600" />
                <span className="text-body-sm text-success-700">
                  🔒 Your order is secured with university authentication
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 z-10 safe-area-pb">
          <Button
            onClick={() => void handlePlaceOrder()}
            disabled={!isValidForm || loading}
            loading={loading}
            size="lg"
            className="w-full"
          >
            <CreditCard className="w-5 h-5" />
            Place Order • ₹{totals.total}
          </Button>

          {!isValidForm && cartItems.length > 0 && countdown && countdown.isPastCutoff && (
            <p className="text-center text-body-sm text-error-600 mt-2">
              Ordering deadline has passed for this date
            </p>
          )}

          {cartItems.length === 0 && (
            <p className="text-center text-body-sm text-neutral-600 mt-2">
              Your cart is empty
            </p>
          )}
        </div>
      </StudentLayout>
    </>
  );
}
