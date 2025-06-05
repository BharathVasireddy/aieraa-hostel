# 🚀 Complete Setup Guide - Step by Step

## **What You Need to Do Right Now**

### **Step 1: Set Up Your Database (5 minutes)**

#### **Option A: Supabase (Recommended)**

1. **Open [supabase.com](https://supabase.com) in your browser**

2. **Click "Start your project"** (green button)

3. **Sign up with your preferred method:**
   - GitHub (fastest)
   - Google
   - Email

4. **Create new project:**
   - **Name**: `aieraa-hostel` 
   - **Database Password**: Create a strong password like `MySecret123!` 
   - **Region**: Choose closest to your location
   - **Click "Create new project"**

5. **Wait 2-3 minutes** for setup to complete

6. **Get your connection string:**
   - Click **Settings** (gear icon in sidebar)
   - Click **Database** 
   - Scroll to **"Connection string"**
   - Copy the **"URI"** (not "Session mode")
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.abcdefgh.supabase.co:5432/postgres`

---

### **Step 2: Configure Your App (2 minutes)**

1. **Open your `.env` file** (in your project folder)

2. **Paste this template and replace the values:**

```env
# Database - REPLACE with your Supabase URL
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"

# NextAuth.js - REPLACE with a random secret
NEXTAUTH_SECRET="my-super-secret-app-key-12345"
NEXTAUTH_URL="http://localhost:3000"

# Razorpay (leave as is for now)
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
```

3. **Important replacements:**
   - Replace `[YOUR-PASSWORD]` with your Supabase password
   - Replace `[YOUR-PROJECT]` with your Supabase project ID
   - Replace the `NEXTAUTH_SECRET` with any random string (like `random-secret-key-abc123`)

**Example of a completed .env:**
```env
DATABASE_URL="postgresql://postgres:MySecret123!@db.abcdefgh.supabase.co:5432/postgres"
NEXTAUTH_SECRET="my-random-secret-key-for-auth-xyz789"
NEXTAUTH_URL="http://localhost:3000"
```

---

### **Step 3: Set Up Database Tables (1 minute)**

**Run these commands one by one in your terminal:**

```bash
# 1. Generate database client
npm run db:generate

# 2. Create all tables in your database
npm run db:push

# 3. Add sample data (admin user, student user, menu items)
npm run db:seed
```

**What each command does:**
- `db:generate`: Creates TypeScript code to talk to your database
- `db:push`: Creates all the tables (users, orders, menu items, etc.)
- `db:seed`: Adds demo data so you can test immediately

---

### **Step 4: Test Everything Works**

```bash
# Start your app
npm run dev
```

**Open [http://localhost:3000](http://localhost:3000)**

You should see your homepage! 🎉

---

## **Step 5: Test Login (Test Your Setup)**

### **Demo Accounts Created for You:**

1. **Admin Account:**
   - Email: `admin@demo.edu`
   - Password: `admin123`

2. **Student Account:**
   - Email: `student@demo.edu` 
   - Password: `student123`

### **Where to Test:**
- Go to `/student` - you'll see the student dashboard
- Go to `/admin` - you'll see the admin dashboard

---

## **What You'll See After Setup:**

### **For Students:**
- ✅ Browse menu items
- ✅ See empty cart (ready to add items)
- ✅ View order history (empty for now)
- ✅ Profile page

### **For Admins:**
- ✅ Manage menu items
- ✅ View and approve orders
- ✅ See analytics dashboard
- ✅ Manage settings

---

## **Troubleshooting**

### **Common Issues:**

#### **"Connection refused" or database errors:**
1. Check your `.env` file has the correct DATABASE_URL
2. Make sure you copied the full Supabase URL
3. Verify your Supabase project is running (check supabase.com dashboard)

#### **"Module not found" errors:**
```bash
npm install
npm run db:generate
```

#### **"Schema is empty" or no tables:**
```bash
npm run db:push
npm run db:seed
```

#### **Want to start fresh?**
```bash
# Reset everything and start over
npx prisma db push --force-reset
npm run db:seed
```

---

## **Next Steps After Setup**

Once everything is working:

1. **Week 1**: We'll add real authentication pages
2. **Week 2**: Build the ordering system with date picker
3. **Week 3**: Add payment integration
4. **Week 4**: Polish and add PWA features

---

## **Need Help?**

If you get stuck:
1. Share the exact error message
2. Tell me which step you're on
3. I'll help you fix it immediately!

**Your database will have:**
- ✅ 2 Universities (Demo University, MIT)
- ✅ 2 Admin users 
- ✅ 1 Student user
- ✅ 6 Sample menu items
- ✅ 7 days of menu availability
- ✅ All tables and relationships ready 