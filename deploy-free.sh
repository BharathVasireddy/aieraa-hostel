#!/bin/bash

# 🆓 FREE Deployment Helper for Aieraa Hostel
# This script helps you deploy to free hosting services

echo "🚀 Aieraa Hostel - FREE Deployment Helper"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from your project root directory"
    echo "   (The folder containing package.json)"
    exit 1
fi

echo "📋 Pre-deployment Checklist:"
echo ""

# Check if build works
echo "1️⃣ Testing build..."
if npm run build; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed! Please fix errors first."
    echo "   Common fixes:"
    echo "   - Run: npm install"
    echo "   - Run: npm run type-check"
    echo "   - Fix any TypeScript errors"
    exit 1
fi

echo ""
echo "2️⃣ Checking Git setup..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "   Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Ready for deployment"
    echo "✅ Git repository created!"
else
    echo "✅ Git repository exists!"
fi

echo ""
echo "3️⃣ Preparing for deployment..."

# Create Vercel configuration
cat > vercel.json << EOF
{
  "version": 2,
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
EOF

echo "✅ Vercel configuration created!"

# Update package.json with required scripts
echo ""
echo "4️⃣ Checking required scripts..."

# Check if package.json has all required scripts
if grep -q '"build"' package.json && grep -q '"start"' package.json; then
    echo "✅ Required scripts found!"
else
    echo "⚠️  Adding missing scripts to package.json..."
    # This would require more complex JSON manipulation
    echo "   Please ensure your package.json has:"
    echo '   "scripts": {'
    echo '     "build": "next build",'
    echo '     "start": "next start",'
    echo '     "dev": "next dev"'
    echo '   }'
fi

echo ""
echo "🎯 NEXT STEPS:"
echo "============="
echo ""
echo "🔗 1. PUSH TO GITHUB:"
echo "   - Go to github.com and create a new repository named 'aieraa-hostel'"
echo "   - Make it PUBLIC (required for free Vercel)"
echo "   - Then run:"
echo "     git remote add origin https://github.com/YOUR_USERNAME/aieraa-hostel.git"
echo "     git branch -M main"
echo "     git push -u origin main"
echo ""

echo "🗄️ 2. SETUP DATABASE (FREE):"
echo "   - Go to neon.tech"
echo "   - Sign up with GitHub"
echo "   - Create new project: 'aieraa-hostel'"
echo "   - Copy your connection string"
echo ""

echo "🌐 3. DEPLOY TO VERCEL (FREE):"
echo "   - Go to vercel.com"
echo "   - Sign up with GitHub"
echo "   - Import your 'aieraa-hostel' repository"
echo "   - Add environment variables:"
echo "     * DATABASE_URL=your_neon_connection_string"
echo "     * NEXTAUTH_SECRET=any_random_32_character_string"
echo "     * NEXTAUTH_URL=https://your-app-name.vercel.app"
echo "   - Click Deploy!"
echo ""

echo "✨ 4. SETUP DATA:"
echo "   - After deployment, visit: https://your-app-name.vercel.app/api/seed-demo-user"
echo "   - This creates your database tables and demo accounts"
echo ""

echo "🎉 5. TEST YOUR APP:"
echo "   - Visit your Vercel URL"
echo "   - Login with: admin@bmu.edu.vn / admin123"
echo "   - Your food ordering system is LIVE!"
echo ""

echo "💡 Need help? Check the FREE_HOSTING_GUIDE.md file!"
echo ""
echo "🚀 Your app is ready for FREE deployment!"

# Create a helpful README for deployment
cat > DEPLOYMENT_STEPS.md << EOF
# 🚀 Quick Deployment Steps

## Current Status: ✅ Ready for Deployment

Your app has been prepared for free hosting. Follow these steps:

### 1. GitHub (Code Storage)
\`\`\`bash
# Create repository at github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/aieraa-hostel.git
git branch -M main
git push -u origin main
\`\`\`

### 2. Neon (Free Database)
- Visit: [neon.tech](https://neon.tech)
- Create account → New Project → Copy connection string

### 3. Vercel (Free Hosting)
- Visit: [vercel.com](https://vercel.com)
- Import GitHub repo → Add environment variables → Deploy

### 4. Environment Variables for Vercel
\`\`\`
DATABASE_URL=your_neon_connection_string_here
NEXTAUTH_SECRET=create_a_random_32_character_string
NEXTAUTH_URL=https://your-app-name.vercel.app
\`\`\`

### 5. Initialize Database
Visit: \`https://your-app-name.vercel.app/api/seed-demo-user\`

## Demo Accounts
- **Admin**: admin@bmu.edu.vn / admin123
- **Student**: student@bmu.edu.vn / student123

**Total Cost: $0/month** ✨
EOF

echo "📋 Created DEPLOYMENT_STEPS.md with detailed instructions!"
echo ""
echo "🎯 Ready to deploy! Follow the steps above or check DEPLOYMENT_STEPS.md" 