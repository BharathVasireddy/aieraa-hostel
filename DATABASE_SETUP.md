# Database Setup Guide

## Quick Setup Options

### Option 1: Local PostgreSQL (Recommended for Development)

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # macOS with Homebrew
   brew install postgresql
   brew services start postgresql
   
   # Create database
   createdb aieraa_hostel
   ```

2. **Set DATABASE_URL** in your `.env` file:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/aieraa_hostel?schema=public"
   ```

3. **Generate Prisma Client and Push Schema**:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

### Option 2: Supabase (Cloud PostgreSQL - Free Tier)

1. **Go to [supabase.com](https://supabase.com)** and create a free account
2. **Create a new project**
3. **Get your database URL** from Settings > Database > Connection string
4. **Set DATABASE_URL** in your `.env` file with the Supabase URL
5. **Run the setup commands**:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

### Option 3: Railway (Cloud PostgreSQL)

1. **Go to [railway.app](https://railway.app)** and create account
2. **Create new project** > Add PostgreSQL
3. **Get connection URL** from the database service
4. **Set DATABASE_URL** and run setup commands

## Environment Variables

Create a `.env` file in your project root:

```env
# Database
DATABASE_URL="your_database_url_here"

# NextAuth.js
NEXTAUTH_SECRET="generate-a-random-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Razorpay (optional for now)
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
```

## Database Commands

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Create and run migrations (for production)
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Open Prisma Studio (database browser)
npm run db:studio
```

## Sample Data

After running `npm run db:seed`, you'll have:

### Demo Users:
- **Admin**: admin@demo.edu / admin123
- **Student**: student@demo.edu / student123

### Universities:
- Demo University (DEMO)
- MIT (MIT)

### Sample Menu Items:
- Breakfast: Masala Dosa, Poha
- Lunch: Dal Rice, Chicken Biryani
- Dinner: Roti with Curry
- Beverages: Masala Chai

## Database Schema Overview

- **Universities**: Multi-university support
- **Users**: Students, Admins, Caterers with approval system
- **Menu Items**: With availability, pricing, nutritional info
- **Orders**: With approval workflow and payment tracking
- **Settings**: University-specific configuration

## Troubleshooting

### Common Issues:

1. **Connection refused**: Make sure PostgreSQL is running
2. **Database doesn't exist**: Create it manually with `createdb aieraa_hostel`
3. **Permission denied**: Check your PostgreSQL user permissions
4. **Schema out of sync**: Run `npm run db:push` to sync

### Reset Database:
```bash
npx prisma db push --force-reset
npm run db:seed
```

## Next Steps

Once database is set up:
1. Start development server: `npm run dev`
2. Test login with demo credentials
3. Explore admin panel and student interface
4. Start adding real data through the admin interface 