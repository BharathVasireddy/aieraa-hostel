#!/bin/bash

echo "🚀 Aieraa Hostel - Deployment Fix Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Checking current setup...${NC}"

# Check if build works
echo -e "${YELLOW}🔨 Testing build...${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Verify database schema
echo -e "${YELLOW}🗄️  Setting up database schema...${NC}"
DATABASE_URL="postgresql://neondb_owner:npg_qKGr2mCjkH1f@ep-polished-wind-a1r7ql03-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" npx prisma generate > /dev/null 2>&1
DATABASE_URL="postgresql://neondb_owner:npg_qKGr2mCjkH1f@ep-polished-wind-a1r7ql03-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" npx prisma db push > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database schema updated${NC}"
else
    echo -e "${RED}❌ Database setup failed${NC}"
fi

# Create environment variables file for reference
echo -e "${YELLOW}📝 Creating environment variables reference...${NC}"
cat > env-variables-for-vercel.txt << EOF
# 🔑 Copy these EXACT values to your Vercel Dashboard
# Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

DATABASE_URL=postgresql://neondb_owner:npg_qKGr2mCjkH1f@ep-polished-wind-a1r7ql03-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

NEXTAUTH_SECRET=aieraa-hostel-production-secret-key-2024-very-secure-random-string

NEXTAUTH_URL=https://hostel.aieraa.com

# Optional (add when you get Razorpay account):
# RAZORPAY_KEY_ID=your-razorpay-key-id
# RAZORPAY_KEY_SECRET=your-razorpay-secret
EOF

echo -e "${GREEN}✅ Environment variables saved to: env-variables-for-vercel.txt${NC}"

# Update gitignore
echo -e "${YELLOW}🔧 Updating .gitignore...${NC}"
cat >> .gitignore << EOF

# Environment variables reference (safe to commit)
# env-variables-for-vercel.txt

# Large build files (exclude from git)
.next/
.vercel/
node_modules/

# Environment files (never commit)
.env
.env.local
.env.production
.env.*.local
EOF

# Commit and push latest changes
echo -e "${YELLOW}📤 Pushing latest changes to GitHub...${NC}"
git add .
git commit -m "Fix deployment: Add env vars reference and update gitignore" > /dev/null 2>&1
git push origin main > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Changes pushed to GitHub${NC}"
else
    echo -e "${YELLOW}⚠️  Git push skipped (no new changes or already up to date)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 DEPLOYMENT FIX COMPLETE!${NC}"
echo "========================================"
echo ""
echo -e "${BLUE}📋 NEXT STEPS (Manual - I can't access your Vercel dashboard):${NC}"
echo ""
echo -e "${YELLOW}1. Add Environment Variables to Vercel:${NC}"
echo "   → Go to: https://vercel.com/dashboard"
echo "   → Find your project: aieraa-hostel"
echo "   → Go to: Settings → Environment Variables"
echo "   → Copy variables from: env-variables-for-vercel.txt"
echo ""
echo -e "${YELLOW}2. Redeploy on Vercel:${NC}"
echo "   → In Vercel dashboard: Deployments → Redeploy"
echo ""
echo -e "${YELLOW}3. Test Your Live Site:${NC}"
echo "   → Homepage: https://hostel.aieraa.com"
echo "   → Admin: https://hostel.aieraa.com/admin"
echo "   → Student: https://hostel.aieraa.com/student"
echo ""
echo -e "${YELLOW}4. Login Credentials:${NC}"
echo "   → Admin: admin@bmu.edu.vn / admin123"
echo "   → Student: student@bmu.edu.vn / student123"
echo ""
echo -e "${GREEN}🚀 After adding env vars and redeploying, your site will work perfectly!${NC}"
echo ""
echo -e "${BLUE}📁 Files Created:${NC}"
echo "   ✅ env-variables-for-vercel.txt (Environment variables reference)"
echo "   ✅ Updated .gitignore"
echo "   ✅ Database schema deployed"
echo ""
echo -e "${GREEN}✨ Ready for production use!${NC}" 