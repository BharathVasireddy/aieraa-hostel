# 🚀 Quick Deployment Steps

## Current Status: ✅ Ready for Deployment

Your app has been prepared for free hosting. Follow these steps:

### 1. GitHub (Code Storage)
```bash
# Create repository at github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/aieraa-hostel.git
git branch -M main
git push -u origin main
```

### 2. Neon (Free Database)
- Visit: [neon.tech](https://neon.tech)
- Create account → New Project → Copy connection string

### 3. Vercel (Free Hosting)
- Visit: [vercel.com](https://vercel.com)
- Import GitHub repo → Add environment variables → Deploy

### 4. Environment Variables for Vercel
```
DATABASE_URL=your_neon_connection_string_here
NEXTAUTH_SECRET=create_a_random_32_character_string
NEXTAUTH_URL=https://your-app-name.vercel.app
```

### 5. Initialize Database
Visit: `https://your-app-name.vercel.app/api/seed-demo-user`

## Demo Accounts
- **Admin**: admin@bmu.edu.vn / admin123
- **Student**: student@bmu.edu.vn / student123

**Total Cost: ./deploy-free.sh/month** ✨
