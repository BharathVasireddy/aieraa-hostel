# 🔧 Vercel Environment Variables Setup

## 🚨 **CRITICAL**: Add These Environment Variables to Fix HTTP 405 Error

### Step 1: Go to Vercel Dashboard
1. Open: https://vercel.com/dashboard
2. Find project: **aieraa-hostel**
3. Click on your project

### Step 2: Add Environment Variables
1. Click **Settings** (in top menu)
2. Click **Environment Variables** (in left sidebar)
3. Click **Add New** button

### Step 3: Add These 3 Variables (Copy Exact Values)

**Variable 1:**
```
Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_qKGr2mCjkH1f@ep-polished-wind-a1r7ql03-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

**Variable 2:**
```
Name: NEXTAUTH_SECRET
Value: aieraa-hostel-production-secret-key-2024-very-secure-random-string
```

**Variable 3:**
```
Name: NEXTAUTH_URL
Value: https://hostel.aieraa.com
```

### Step 4: Redeploy
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Wait for deployment to complete

### Step 5: Test Your Site
- **Homepage**: https://hostel.aieraa.com
- **Admin Login**: https://hostel.aieraa.com/admin
- **Student Login**: https://hostel.aieraa.com/student

### Demo Accounts
- **Admin**: admin@bmu.edu.vn / admin123  
- **Student**: student@bmu.edu.vn / student123

---

## ✅ **After Adding Environment Variables:**
- ✅ HTTP 405 error will be fixed
- ✅ Database will connect properly  
- ✅ Authentication will work
- ✅ All features will be functional

## 🎯 **Expected Result:**
Your Aieraa Hostel Food Ordering System will be **100% functional** at https://hostel.aieraa.com

---

**⏱️ Total Time**: 2-3 minutes to add environment variables
**💰 Total Cost**: $0/month (Free hosting) 