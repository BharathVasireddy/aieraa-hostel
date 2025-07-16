# 🍔 Aieraa Food Ordering Design System Guide
*Swiggy/Zomato-Inspired Mobile-First Design System*

## 🎨 Overview

This design system provides a comprehensive foundation for building modern, mobile-first food ordering experiences. Inspired by leading food delivery apps like Swiggy and Zomato, it focuses on food discovery, visual hierarchy, and thumb-friendly interactions.

---

## 🎯 Design Principles

### 1. **Food-First Visual Hierarchy**
- Food imagery is the primary focus
- Clear pricing and availability information
- Prominent veg/non-veg indicators
- Appetite-appealing color schemes

### 2. **Mobile-First Interactions**
- Thumb-friendly touch targets (44px minimum)
- Smooth animations and micro-interactions
- Intuitive cart management
- One-handed navigation patterns

### 3. **Performance-Optimized**
- Lazy loading images
- Skeleton states for perceived performance
- Optimized animations
- Efficient component patterns

---

## 🎨 Design Tokens

### Color Palette

#### Primary Colors (Green Theme)
```css
primary-50: #f0fdf4   /* Lightest green for backgrounds */
primary-100: #dcfce7  /* Light green for hover states */
primary-200: #bbf7d0  /* Soft green for cards */
primary-500: #22c55e  /* Primary brand color */
primary-600: #16a34a  /* Dark green for buttons */
primary-900: #14532d  /* Darkest green for headings */
```

#### Food-Specific Colors
```css
/* Veg/Non-veg Indicators */
food-veg: #22c55e
food-non-veg: #ef4444

/* Rating & Reviews */
food-rating: #fbbf24        /* Golden yellow for stars */
food-rating-bg: #fef3c7     /* Light yellow background */

/* Offers & Discounts */
food-offer: #dc2626         /* Red for discount badges */
food-offer-bg: #fee2e2      /* Light red background */

/* Category Colors */
food-breakfast: #f59e0b     /* Orange */
food-lunch: #3b82f6         /* Blue */
food-dinner: #8b5cf6        /* Purple */
food-snacks: #ec4899        /* Pink */
food-beverages: #06b6d4     /* Cyan */
```

#### Status Colors
```css
/* Order Status */
food-pending: #f59e0b       /* Amber */
food-confirmed: #3b82f6     /* Blue */
food-preparing: #8b5cf6     /* Purple */
food-ready: #22c55e         /* Green */
food-served: #059669        /* Emerald */
food-cancelled: #ef4444     /* Red */
```

### Typography

#### Font Sizes
```css
/* Food-specific typography */
text-price: 18px, line-height 1.4, font-weight 600
text-rating: 14px, line-height 1.25, font-weight 500
text-badge: 12px, line-height 1, font-weight 600
text-card-title: 16px, line-height 1.5, font-weight 600
text-card-subtitle: 14px, line-height 1.25, font-weight 400
```

### Spacing & Layout

#### Border Radius
```css
rounded-card: 12px        /* For food cards */
rounded-button: 10px      /* For buttons */
rounded-image: 8px        /* For food images */
rounded-badge: 16px       /* For badges */
```

#### Shadows
```css
shadow-card: Subtle card elevation
shadow-card-hover: Enhanced hover state
shadow-floating: For floating elements
shadow-modal: For modals and overlays
```

---

## 🧩 Core Components

### 1. FoodCard Component

The primary component for displaying food items with multiple variants.

#### Basic Usage
```tsx
import FoodCard from '@/components/ui/FoodCard'

<FoodCard
  id="item-1"
  name="Butter Chicken"
  description="Creamy tomato curry with tender chicken pieces"
  price={180}
  offerPrice={150}
  image="/images/butter-chicken.jpg"
  isVegetarian={false}
  category="lunch"
  rating={4.5}
  reviewCount={142}
  preparationTime="25-30 min"
  isPopular={true}
  discount={17}
  quantity={0}
  onAddToCart={(id) => addToCart(id)}
  onRemoveFromCart={(id) => removeFromCart(id)}
  variant="horizontal"
/>
```

#### Variants

**Horizontal Card (Default)**
- Best for menu listings
- Shows image, content, and actions side by side
- Optimized for mobile scrolling

**Vertical Card**
- Perfect for popular items showcase
- Image on top, content below
- Great for grid layouts

**Compact Card**
- For carousels and horizontal scrolling
- Minimal space, maximum impact
- Quick discovery experience

**Detailed Card**
- Comprehensive nutrition information
- Category badges
- Enhanced metadata display

#### Props Reference
```tsx
interface FoodCardProps {
  id: string                           // Unique identifier
  name: string                         // Food item name
  description?: string                 // Short description
  price: number                        // Original price
  offerPrice?: number                  // Discounted price
  image?: string                       // Food image URL
  isVegetarian: boolean               // Veg/non-veg indicator
  category: string                    // Food category
  rating?: number                     // Star rating (0-5)
  reviewCount?: number                // Number of reviews
  preparationTime?: string            // Cooking time
  isPopular?: boolean                 // Popular badge
  isBestseller?: boolean             // Bestseller badge
  discount?: number                   // Discount percentage
  calories?: number                   // Nutritional info
  protein?: number
  carbs?: number
  fat?: number
  spiceLevel?: 'mild' | 'medium' | 'hot'
  quantity?: number                   // Current cart quantity
  maxQuantity?: number               // Stock limit
  isAvailable?: boolean              // Availability status
  onAddToCart?: (id: string) => void
  onRemoveFromCart?: (id: string) => void
  onToggleFavorite?: (id: string) => void
  isFavorite?: boolean
  variant?: 'horizontal' | 'vertical' | 'compact' | 'detailed'
  className?: string
}
```

### 2. FloatingCart Component

Modern cart interface inspired by food delivery apps.

#### Basic Usage
```tsx
import FloatingCart from '@/components/ui/FloatingCart'

<FloatingCart
  items={cartItems}
  onCheckout={() => router.push('/checkout')}
  onToggleCart={() => setCartExpanded(!cartExpanded)}
  isExpanded={cartExpanded}
  isOrderingClosed={false}
  closingTime="10:00 PM"
/>
```

#### Features
- **Compact View**: Shows item count, total, and quick checkout
- **Expanded View**: Full cart breakdown with individual items
- **Veg/Non-veg Indicators**: Visual breakdown of cart contents
- **Ordering Status**: Shows when ordering is closed
- **Smooth Animations**: Slide-up entrance and gentle bounces

### 3. Component Presets

#### Quick Implementation
```tsx
// Preset variants for common use cases
import { 
  CompactFoodCard, 
  VerticalFoodCard, 
  DetailedFoodCard 
} from '@/components/ui/FoodCard'

import { 
  CompactFloatingCart, 
  ExpandedFloatingCart 
} from '@/components/ui/FloatingCart'

// Loading states
import { FoodCardSkeleton } from '@/components/ui/FoodCard'

<FoodCardSkeleton variant="horizontal" />
<FoodCardSkeleton variant="vertical" />
```

---

## 🎭 Utility Classes

### Button System
```css
/* Core button classes */
.btn                    /* Base button with focus states */
.btn-primary           /* Primary action button */
.btn-secondary         /* Secondary outline button */
.btn-outline           /* Neutral outline button */
.btn-ghost             /* Minimal text button */

/* Sizes */
.btn-small             /* Compact button */
.btn-large             /* Prominent button */
.btn-icon              /* Square icon button */

/* Food-specific buttons */
.btn-add-to-cart       /* Add to cart action */
.btn-quantity-add      /* Quantity increase */
.btn-quantity-remove   /* Quantity decrease */
```

### Food-Specific Classes
```css
/* Food Cards */
.food-card                    /* Base food card */
.food-card-horizontal        /* Side-by-side layout */
.food-card-vertical          /* Stacked layout */
.food-card-compact           /* Carousel-friendly */

/* Food Images */
.food-image                  /* Image container */
.food-image-overlay          /* Hover overlay */
.food-image-badge            /* Image badges */

/* Indicators */
.food-veg-indicator          /* Veg indicator with dot */
.food-non-veg-indicator      /* Non-veg indicator */

/* Pricing */
.price-display               /* Price container */
.price-current              /* Current price */
.price-original             /* Strikethrough price */
.price-offer                /* Discounted price */
.discount-badge             /* Discount percentage */

/* Rating System */
.rating-display             /* Rating container */
.rating-star                /* Star icon */
.rating-text                /* Rating number */
.rating-badge               /* Rating badge */

/* Status Badges */
.status-pending             /* Order pending */
.status-confirmed           /* Order confirmed */
.status-preparing           /* Being prepared */
.status-ready               /* Ready for pickup */
.status-served              /* Order served */
.status-cancelled           /* Order cancelled */

/* Category Badges */
.category-breakfast         /* Breakfast category */
.category-lunch             /* Lunch category */
.category-dinner            /* Dinner category */
.category-snacks            /* Snacks category */
.category-beverages         /* Beverages category */
```

### Layout Helpers
```css
/* Containers */
.container-mobile           /* Mobile-optimized container */
.container-food             /* Food app container */

/* Spacing */
.section-padding            /* Standard section padding */
.section-spacing            /* Standard section spacing */

/* Floating Elements */
.floating-cart              /* Cart positioning */
.floating-action            /* FAB positioning */
```

### Animation Classes
```css
/* Entrance Animations */
.animate-fade-in            /* Fade in effect */
.animate-slide-up           /* Slide up from bottom */
.animate-scale-in           /* Scale in effect */
.animate-bounce-gentle      /* Gentle bounce */

/* Interaction Animations */
.hover:scale-[1.02]         /* Slight scale on hover */
.active:scale-[0.98]        /* Press down effect */
```

---

## 📱 Mobile-First Patterns

### Touch Targets
- **Minimum Size**: 44px × 44px for all interactive elements
- **Comfortable Spacing**: 8px minimum between touch targets
- **Thumb Zones**: Primary actions in easy-to-reach areas

### Navigation Patterns
```tsx
// Bottom navigation (thumb-friendly)
<BottomNavigation />

// Floating cart (accessible position)
<FloatingCart />

// Sticky headers (important info always visible)
<StudentHeader />
```

### Responsive Breakpoints
```css
/* Mobile First (default) */
320px - 768px

/* Tablet */
768px - 1024px

/* Desktop */
1024px+
```

---

## 🔧 Implementation Guidelines

### 1. **Component Composition**
```tsx
// Build pages using composition
<StudentLayout>
  <section className="section-padding section-spacing">
    <h2>Popular This Week</h2>
    <div className="grid grid-cols-2 gap-4">
      {popularItems.map(item => (
        <CompactFoodCard key={item.id} {...item} />
      ))}
    </div>
  </section>
  
  <FloatingCart items={cartItems} />
</StudentLayout>
```

### 2. **Performance Optimization**
```tsx
// Use skeleton states for loading
{loading ? (
  <FoodCardSkeleton variant="horizontal" />
) : (
  <FoodCard {...itemProps} />
)}

// Lazy load images
<Image
  src={item.image}
  alt={item.name}
  loading="lazy"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### 3. **Accessibility**
```tsx
// Proper ARIA labels
<button
  aria-label={`Add ${item.name} to cart`}
  className="btn-add-to-cart"
>
  <Plus className="w-4 h-4" />
  Add
</button>

// Focus management
<div className="focus-ring">
  {/* Content */}
</div>
```

---

## 🚀 Migration Guide

### From Current Components

#### Food Cards
```tsx
// Before (old food card)
<div className="bg-white rounded-xl p-4">
  <img src={image} alt={name} />
  <h3>{name}</h3>
  <p>₹{price}</p>
  <button onClick={() => addToCart(id)}>Add</button>
</div>

// After (new design system)
<FoodCard
  id={id}
  name={name}
  price={price}
  image={image}
  isVegetarian={isVeg}
  category={category}
  onAddToCart={addToCart}
  variant="horizontal"
/>
```

#### Button Updates
```tsx
// Before
<button className="bg-green-600 text-white px-6 py-3 rounded-xl">
  Primary Action
</button>

// After
<button className="btn-primary">
  Primary Action
</button>
```

---

## 📊 Performance Metrics

### Target Performance
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### Optimization Features
- **Image Optimization**: Next.js Image component with WebP
- **Component Lazy Loading**: React.lazy for non-critical components
- **Animation Performance**: Hardware-accelerated transforms
- **Bundle Optimization**: Tree-shaking and code splitting

---

## 🎨 Design Resources

### Figma Design Tokens
```
Primary Green: #22C55E
Secondary Colors: Amber, Blue, Purple, Pink, Cyan
Typography: Plus Jakarta Sans
Spacing: 4px base unit (4, 8, 12, 16, 24, 32, 48, 64)
Border Radius: 8px, 12px, 16px
```

### Icon Library
- **Lucide React**: Primary icon library
- **Food Emojis**: For category representations
- **Custom Icons**: For veg/non-veg indicators

---

## 🔄 Future Enhancements

### Planned Components
1. **SearchBar**: Advanced food search with filters
2. **CategoryFilter**: Horizontal category selection
3. **OrderCard**: Order history and tracking
4. **ReviewCard**: Rating and review display
5. **OfferCard**: Promotional banners
6. **StoryCard**: Instagram-style food stories

### Design System Evolution
- **Dark Mode**: Complete dark theme support
- **Accessibility**: WCAG 2.1 AA compliance
- **Internationalization**: Multi-language support
- **Custom Theming**: University-specific branding

---

## 📞 Support & Contribution

### Getting Help
- **Component Issues**: Check prop types and console errors
- **Styling Issues**: Verify Tailwind classes are properly imported
- **Performance Issues**: Use React DevTools Profiler

### Contributing
1. Follow component naming conventions
2. Include TypeScript types for all props
3. Add accessibility attributes
4. Test on mobile devices
5. Document usage examples

---

*Design System v1.0 - Built for Mobile-First Food Discovery* 