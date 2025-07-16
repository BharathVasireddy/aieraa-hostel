# Coding Standards & Best Practices

## Overview
This document outlines the coding standards and best practices for the Aieraa Hostel Food Ordering System. Following these guidelines helps maintain code quality, prevents bugs, and ensures consistent development practices across the team.

## Table of Contents
1. [Project Structure](#project-structure)
2. [TypeScript Standards](#typescript-standards)
3. [React & Next.js Guidelines](#react--nextjs-guidelines)
4. [Database & API Standards](#database--api-standards)
5. [Error Handling](#error-handling)
6. [Security Guidelines](#security-guidelines)
7. [Performance Best Practices](#performance-best-practices)
8. [Testing Standards](#testing-standards)
9. [Code Review Checklist](#code-review-checklist)
10. [Common Anti-patterns](#common-anti-patterns)

## Project Structure

### Directory Organization
```
aieraa-hostel/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── admin/          # Admin dashboard pages
│   │   ├── student/        # Student portal pages
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Landing page
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # Base UI components
│   │   └── ...             # Feature-specific components
│   ├── lib/                # Utility functions and configurations
│   ├── types/              # TypeScript type definitions
│   └── middleware.ts       # Next.js middleware
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts            # Database seeding
├── .cursorrules           # Cursor AI rules
├── .cursor/               # Modern Cursor rules directory
│   ├── index.mdc          # Main rules file
│   └── rules/             # Context-specific rules
└── docs/                  # Documentation
    └── CODING_STANDARDS.md # This file
```

### File Naming Conventions
- Use **kebab-case** for directories and files
- Use **PascalCase** for React components
- Use **camelCase** for variables and functions
- Use **UPPER_SNAKE_CASE** for constants and environment variables

Examples:
```
components/student-dashboard.tsx     ✅ Good
components/StudentDashboard.tsx      ❌ Bad
components/student_dashboard.tsx     ❌ Bad

const userName = 'john'              ✅ Good
const user_name = 'john'             ❌ Bad
const UserName = 'john'              ❌ Bad

const API_BASE_URL = 'https://...'   ✅ Good
const apiBaseUrl = 'https://...'     ❌ Bad
```

## TypeScript Standards

### Strict Type Safety
- **Always use strict TypeScript configuration**
- **Never use `any` type** - use proper types or `unknown`
- **Define interfaces for all props and API responses**
- **Use proper return types for all functions**

#### Good Examples:
```typescript
// Interface definitions
interface StudentOrderProps {
  orderId: string;
  studentName: string;
  totalAmount: number;
  orderDate: Date;
  status: OrderStatus;
}

// Proper function typing
async function processOrder(order: StudentOrderProps): Promise<OrderResult> {
  // Implementation
}

// Union types for limited values
type OrderStatus = 'pending' | 'approved' | 'preparing' | 'ready' | 'served' | 'cancelled';

// Error handling types
type OrderResult = 
  | { success: true; data: Order }
  | { success: false; error: string };
```

#### Bad Examples:
```typescript
// Using any type
function processOrder(order: any): any {  // ❌ Bad
  // Implementation
}

// Missing return type
function calculateTotal(items) {  // ❌ Bad
  // Implementation
}

// Loose typing
interface Props {
  data: object;  // ❌ Bad - too generic
  callback: Function;  // ❌ Bad - use proper function signature
}
```

### Type Organization
- Keep types close to where they're used
- Use generic types for reusable components
- Create shared type definitions in `/types`
- Use Prisma generated types for database operations

## React & Next.js Guidelines

### Component Structure
```typescript
// Good: Functional component with proper typing
interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (itemId: string) => void;
  isInCart?: boolean;
  quantity?: number;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onAddToCart,
  isInCart = false,
  quantity = 0
}) => {
  // Component implementation
};

export default MenuItemCard;
```

### Server vs Client Components
- **Prefer Server Components** for data fetching and static content
- **Use Client Components** only for interactivity
- **Follow the pattern**: Fetch in Server Component, pass to Client Component

```typescript
// Server Component - Data fetching
async function OrdersPage() {
  const orders = await getOrders();
  
  return (
    <div>
      <OrdersList orders={orders} />
    </div>
  );
}

// Client Component - Interactivity
"use client";

interface OrdersListProps {
  orders: Order[];
}

const OrdersList: React.FC<OrdersListProps> = ({ orders }) => {
  const [filter, setFilter] = useState('all');
  
  return (
    // Interactive component implementation
  );
};
```

### Hook Usage Best Practices
- **Use hooks at the top level** of components
- **Use useCallback** for event handlers to prevent unnecessary re-renders
- **Use useMemo** for expensive calculations
- **Use useEffect sparingly** - prefer event handlers

```typescript
// Good: Proper hook usage
const MenuPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const handleAddToCart = useCallback((item: MenuItem) => {
    setCart(prev => [...prev, { ...item, quantity: 1 }]);
  }, []);
  
  const filteredItems = useMemo(() => {
    return items.filter(item => 
      selectedCategory === 'all' || item.category === selectedCategory
    );
  }, [items, selectedCategory]);
  
  return (
    // Component JSX
  );
};
```

## Database & API Standards

### Prisma Best Practices
- **Use Prisma generated types** for all database operations
- **Use transactions** for multi-step operations
- **Implement proper error handling** for database operations
- **Use proper indexing** for performance

```typescript
// Good: Prisma transaction
async function createOrderWithItems(orderData: CreateOrderData): Promise<Order> {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId: orderData.userId,
        totalAmount: orderData.totalAmount,
        orderDate: orderData.orderDate,
      },
    });

    await tx.orderItem.createMany({
      data: orderData.items.map(item => ({
        orderId: order.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
      })),
    });

    return order;
  });
}
```

### API Route Standards
- **Use proper HTTP status codes**
- **Implement consistent error responses**
- **Validate all inputs** before processing
- **Use proper authentication** for protected routes

```typescript
// Good: API route with proper error handling
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = OrderSchema.parse(body);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Process request
    const order = await createOrder(validatedData);
    
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }
    
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Error Handling

### Error Handling Principles
1. **Handle errors at the beginning** of functions
2. **Use early returns** for error conditions
3. **Provide meaningful error messages** to users
4. **Log errors with context** for debugging
5. **Use proper error types** for different scenarios

```typescript
// Good: Proper error handling
async function getOrderDetails(orderId: string): Promise<OrderResult> {
  // Validate input early
  if (!orderId) {
    return { success: false, error: 'Order ID is required' };
  }
  
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
    });
    
    // Handle not found case
    if (!order) {
      return { success: false, error: 'Order not found' };
    }
    
    return { success: true, data: order };
  } catch (error) {
    console.error('Error fetching order details:', error);
    return { success: false, error: 'Failed to fetch order details' };
  }
}
```

### Error Boundaries
- **Implement error boundaries** for unexpected errors
- **Use error.tsx files** for route-level error handling
- **Provide fallback UI** for error states

```typescript
// Good: Error boundary component
interface ErrorBoundaryProps {
  error: Error;
  reset: () => void;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ error, reset }) => {
  return (
    <div className="error-boundary">
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
};
```

## Security Guidelines

### Input Validation
- **Validate all user inputs** on both client and server
- **Use schema validation** (Zod) for API requests
- **Sanitize user-generated content** before display
- **Use parameterized queries** (Prisma handles this)

### Authentication & Authorization
- **Implement proper session management**
- **Use role-based access control**
- **Validate permissions** on every protected route
- **Use CSRF protection** for forms

```typescript
// Good: Role-based access control
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Admin-only logic here
}
```

### Data Protection
- **Use HTTPS** in production
- **Encrypt sensitive data** at rest
- **Don't expose sensitive information** in logs
- **Use environment variables** for secrets

## Performance Best Practices

### React Performance
- **Use React.memo** for expensive components
- **Implement lazy loading** for non-critical components
- **Use code splitting** for large bundles
- **Optimize images** with Next.js Image component

```typescript
// Good: Memoized component
const MenuItemCard = React.memo<MenuItemCardProps>(({ item, onAddToCart }) => {
  return (
    <div className="menu-item-card">
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <button onClick={() => onAddToCart(item)}>
        Add to Cart
      </button>
    </div>
  );
});
```

### Database Performance
- **Use proper indexing** for frequently queried fields
- **Implement pagination** for large datasets
- **Use select queries** to limit data transfer
- **Use database-level constraints** for data integrity

### Caching Strategies
- **Use Next.js caching** for static content
- **Implement server-side caching** for API responses
- **Use client-side caching** for user data
- **Cache expensive computations** with useMemo

## Testing Standards

### Unit Testing
- **Test utility functions** with Jest
- **Test components** with React Testing Library
- **Test API endpoints** with proper mocking
- **Test error scenarios** and edge cases

### Integration Testing
- **Test user flows** end-to-end
- **Test database operations** with test database
- **Test authentication flows** with mock sessions
- **Test API integrations** with mock services

### Testing Best Practices
- **Write descriptive test names**
- **Test behavior, not implementation**
- **Use proper test data** and fixtures
- **Mock external dependencies**

## Code Review Checklist

### Before Submitting PR
- [ ] Code follows TypeScript standards
- [ ] All ESLint warnings are resolved
- [ ] Build passes without errors
- [ ] Tests pass and coverage is adequate
- [ ] Documentation is updated if necessary
- [ ] Security considerations are addressed
- [ ] Performance impact is considered

### During Code Review
- [ ] Code is readable and maintainable
- [ ] Error handling is implemented properly
- [ ] Security best practices are followed
- [ ] Performance is optimized
- [ ] Tests cover new functionality
- [ ] Documentation is clear and accurate

## Common Anti-patterns

### TypeScript Anti-patterns
❌ **Don't use `any` type**
```typescript
function processData(data: any): any {  // Bad
  // Implementation
}
```

✅ **Use proper types**
```typescript
function processData(data: OrderData): OrderResult {  // Good
  // Implementation
}
```

### React Anti-patterns
❌ **Don't use useEffect for data fetching in Server Components**
```typescript
// Bad - Server Component
function OrdersPage() {
  const [orders, setOrders] = useState([]);
  
  useEffect(() => {
    fetchOrders().then(setOrders);
  }, []);
  
  return <div>{/* ... */}</div>;
}
```

✅ **Use Server Components for data fetching**
```typescript
// Good - Server Component
async function OrdersPage() {
  const orders = await getOrders();
  
  return <div>{/* ... */}</div>;
}
```

### Database Anti-patterns
❌ **Don't use string concatenation for queries**
```typescript
// Bad - SQL injection risk
const query = `SELECT * FROM orders WHERE id = ${orderId}`;
```

✅ **Use parameterized queries (Prisma)**
```typescript
// Good - Safe parameterized query
const order = await prisma.order.findUnique({
  where: { id: orderId },
});
```

### Error Handling Anti-patterns
❌ **Don't ignore errors**
```typescript
// Bad - Silent failure
try {
  await createOrder(orderData);
} catch (error) {
  // Ignored
}
```

✅ **Handle errors properly**
```typescript
// Good - Proper error handling
try {
  await createOrder(orderData);
} catch (error) {
  console.error('Order creation failed:', error);
  throw new Error('Failed to create order');
}
```

## Development Workflow

### Pre-commit Checklist
1. Run `npm run lint` to check for linting errors
2. Run `npm run build` to check for build errors
3. Run tests to ensure functionality works
4. Review your changes for security and performance
5. Write clear commit messages

### Commit Message Format
Use conventional commits format:
```
feat: add order status tracking
fix: resolve payment processing bug
docs: update API documentation
style: fix linting issues
refactor: improve error handling
test: add unit tests for order service
```

### Branch Naming
- `feature/description` for new features
- `bugfix/description` for bug fixes
- `hotfix/description` for urgent fixes
- `docs/description` for documentation updates

## Conclusion

Following these coding standards helps ensure:
- **Code quality** and maintainability
- **Security** and performance
- **Consistency** across the codebase
- **Easier debugging** and troubleshooting
- **Better collaboration** among team members

Remember: These standards are living guidelines that should evolve with the project and team needs. Regular review and updates are encouraged to maintain effectiveness.

---

**Last Updated**: January 2025
**Version**: 1.0
**Next Review**: March 2025 