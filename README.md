# Aieraa Hostel Student Food Ordering System

A modern, high-performance food pre-ordering system for hostel students built with Next.js 15, TypeScript, and Tailwind CSS. Students can order their hostel meals in advance and collect them at meal times, skipping the queue.

## 🌟 Features

### For Hostel Students
- **Pre-Order System**: Order hostel meals up to a week in advance
- **Date Selection**: Choose specific dates for meal collection
- **Menu Browsing**: View available hostel dishes with prices and descriptions
- **Real-time Cart**: Track selected items and total cost
- **Order History**: View past and upcoming meal orders
- **Payment Integration**: Secure payments through Razorpay
- **Skip the Queue**: Collect pre-ordered meals directly from the counter

### For Hostel Admins
- **Order Management**: Approve/reject student meal orders
- **Menu Control**: Add, edit, and manage hostel menu items
- **Availability Management**: Enable/disable items based on kitchen capacity
- **Cutoff Time Settings**: Set daily ordering deadlines
- **Revenue Tracking**: Monitor daily sales and statistics
- **Bulk Operations**: Manage multiple orders efficiently

### System Features
- **Role-based Access**: Separate interfaces for students and admins
- **Responsive Design**: Works on all devices and mobile
- **Real-time Updates**: Live order status updates
- **QR Code Support**: Optional meal collection scanning system
- **Notification System**: Email/SMS alerts for orders

## 🚀 Tech Stack

- **Frontend & Backend**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + ShadCN/UI
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: Razorpay Integration
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Razorpay account (for payments)

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/BharathVasireddy/aieraa-hostel.git
   cd aieraa-hostel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/aieraa_hostel"
   
   # NextAuth
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Razorpay
   RAZORPAY_KEY_ID="your-razorpay-key-id"
   RAZORPAY_KEY_SECRET="your-razorpay-secret"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma db push
   
   # Seed initial data (optional)
   npx prisma db seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Access the Application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Student Portal: [http://localhost:3000/student](http://localhost:3000/student)
   - Admin Portal: [http://localhost:3000/admin](http://localhost:3000/admin)

## 📁 Project Structure

```
aieraa-hostel/
├── src/
│   ├── app/
│   │   ├── admin/          # Admin dashboard and pages
│   │   ├── student/        # Student interface
│   │   ├── api/           # API routes
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Landing page
│   ├── components/        # Reusable UI components
│   ├── lib/              # Utility functions and configurations
│   └── types/            # TypeScript type definitions
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
├── public/               # Static assets
├── tailwind.config.js    # Tailwind configuration
├── next.config.js        # Next.js configuration
└── package.json
```

## 🎯 Key Workflows

### Student Ordering Process
1. Student selects future date (up to 7 days ahead)
2. Browse available menu for selected date
3. Add items to cart
4. Review order and proceed to payment
5. Admin receives order for approval
6. Student gets notified of approval/rejection
7. Payment processing for approved orders

### Admin Management Process
1. Set daily cutoff times for orders
2. Manage menu items and availability
3. Review incoming orders
4. Approve/reject orders based on capacity
5. Monitor daily sales and statistics
6. Generate reports for food service team

## 🔐 Authentication & Authorization

- **Students**: Register with hostel ID and room number
- **Admins**: Pre-configured admin accounts
- **Role-based routing**: Automatic redirection based on user role
- **Session management**: Secure JWT-based sessions

## 💳 Payment Integration

- **Razorpay Gateway**: Secure payment processing
- **Multiple Payment Methods**: Cards, UPI, Net Banking
- **Order Confirmation**: Payment success triggers order confirmation
- **Refund Support**: Automatic refunds for rejected orders

## 📱 Mobile Optimization

- **Progressive Web App (PWA)**: Install on mobile devices
- **Touch-friendly Interface**: Optimized for mobile interaction
- **Responsive Design**: Consistent experience across devices

## 🚀 Deployment

### Free Hosting Setup (Vercel + Neon PostgreSQL)

This project can be deployed for **FREE** using:
- **Frontend**: Vercel (Free tier)
- **Database**: Neon PostgreSQL (Free tier)
- **Total Cost**: $0/month

Follow the detailed guide in `FREE_HOSTING_GUIDE.md` for step-by-step deployment instructions.

### Quick Deployment Steps

1. **Deploy to Vercel**:
   ```bash
   npm i -g vercel
   vercel --prod
   ```

2. **Database**: Create free PostgreSQL database at [Neon.tech](https://neon.tech)

3. **Environment Variables**: Add to Vercel dashboard:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

✅ **Build Status**: All TypeScript and linting errors resolved - Ready for deployment!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Email: support@aieraa-hostel.com

## 🗺️ Roadmap

- [ ] WhatsApp notification integration
- [ ] Inventory management system
- [ ] Nutritional information display
- [ ] Meal subscription plans
- [ ] Food waste tracking
- [ ] Multi-hostel support

---

**🚀 Ready for Production**: Build compiles successfully with zero errors. Deploy to Vercel + Neon for free hosting!

## 📚 Documentation

The project documentation is organized as follows:

### `/docs/reports/` - Project Reports
- `FINAL_COMPLETION_REPORT.md` - Complete project completion summary
- `COMPLETE_TODOS_FINAL_REPORT.md` - All completed tasks and features
- `BUSINESS_RULES_AUDIT.md` - Business logic and rules documentation
- `ROLE_ALIGNMENT_AUDIT.md` - User roles and permissions audit
- `UI_AUDIT_COMPREHENSIVE_REPORT.md` - UI/UX improvements and fixes

### `/docs/guides/` - Design & Development Guides  
- `DESIGN_SYSTEM_GUIDE.md` - Complete design system documentation
- `UI_UX_TRANSFORMATION_SUMMARY.md` - UI/UX transformation overview

### `/docs/fixes/` - Technical Fixes & Optimizations
- `LIGHTNING_PERFORMANCE_SUMMARY.md` - Performance optimization overview
- `LIGHTNING_PERFORMANCE_IMPLEMENTATION.md` - Detailed performance improvements
- `COMPLETE_PERFORMANCE_RESOLUTION.md` - Performance issues resolution
- `NEXTAUTH_JWT_FIX.md` - Authentication security fixes
- `PRISMA_PERFORMANCE_FIX.md` - Database optimization fixes
- `ADMIN_ORDERS_FIX_SUMMARY.md` - Admin orders functionality fixes

## 📝 Technical Specifications
