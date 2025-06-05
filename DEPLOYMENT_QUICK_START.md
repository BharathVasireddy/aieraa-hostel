# 🚀 Aieraa Hostel - Corporate Deployment Quick Start

## 📋 Prerequisites

### 1. Server Requirements
- **Production**: 4 CPU cores, 8GB RAM, 100GB SSD
- **Staging**: 2 CPU cores, 4GB RAM, 50GB SSD
- **OS**: Ubuntu 20.04+ or RHEL 8+
- **Docker**: Latest version
- **Docker Compose**: v2.0+

### 2. Required Services
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Load Balancer**: Nginx
- **SSL Certificate**: Let's Encrypt or Commercial

## 🎯 Quick Production Deployment

### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin

# Create deployment user
sudo useradd -m -s /bin/bash aieraa
sudo usermod -aG docker aieraa
```

### Step 2: Application Setup
```bash
# Switch to deployment user
sudo su - aieraa

# Clone repository
git clone <your-repo-url> /opt/aieraa-hostel
cd /opt/aieraa-hostel

# Setup environment
cp env.production.template .env.production
# Edit .env.production with your values

# Make scripts executable
chmod +x scripts/*.sh
```

### Step 3: Deploy Application
```bash
# Run deployment script
./scripts/deploy.sh production

# Or manual deployment
docker-compose -f docker-compose.prod.yml up -d
```

## 🔄 Version Management Workflow

### Git Branching Strategy
```
main (production)
├── develop (staging)
├── feature/feature-name
├── hotfix/critical-fix
└── release/v1.x.x
```

### Deployment Process
1. **Development** → Push to `feature/` branch
2. **Testing** → Merge to `develop` (auto-deploy to staging)
3. **Production** → Merge to `main` (manual approval)

### Database Migrations
```bash
# Safe migration process
1. Create backup: ./scripts/backup-database.sh
2. Test migration: npx prisma migrate diff
3. Apply migration: npx prisma migrate deploy
4. Verify data integrity
```

## 🛡️ Zero-Downtime Deployment

### Blue-Green Deployment
```bash
# Automated via CI/CD
1. Deploy new version alongside current
2. Health check new version
3. Switch traffic to new version
4. Keep old version for rollback
```

### Rollback Procedure
```bash
# Automatic rollback on failure
./scripts/restore-database.sh /backups/backup_file.sql.gz

# Manual rollback
docker-compose restart app
```

## 📊 Monitoring & Maintenance

### Health Monitoring
- **Application**: `https://your-domain.com/api/health`
- **Database**: Automated backups every 24h
- **Logs**: Centralized logging with retention
- **Metrics**: Prometheus + Grafana dashboards

### Automated Backups
```bash
# Daily backups at 2 AM
0 2 * * * /opt/aieraa-hostel/scripts/backup-database.sh

# Weekly full system backup
0 3 * * 0 /opt/aieraa-hostel/scripts/full-backup.sh
```

## 🔐 Security & Compliance

### Production Checklist
- [ ] HTTPS with valid SSL certificate
- [ ] Database encryption at rest
- [ ] Regular security updates
- [ ] Access logs monitoring
- [ ] Rate limiting configured
- [ ] Backup encryption
- [ ] Environment variables secured

### Security Headers
- Automatically configured via Nginx
- HSTS, CSP, X-Frame-Options
- Rate limiting on API endpoints

## 📈 Scaling Strategy

### Horizontal Scaling
```yaml
# Add more app instances
services:
  app:
    deploy:
      replicas: 3
```

### Database Scaling
- Read replicas for reporting
- Connection pooling with PgBouncer
- Database partitioning for large datasets

## 🚨 Emergency Procedures

### Critical Issue Response
1. **Immediate**: Health check alerts
2. **Automatic**: Rollback on deployment failure
3. **Manual**: Emergency hotfix process

### Contact Information
- **Primary**: DevOps team
- **Secondary**: Database administrator
- **Emergency**: On-call engineer

## 💡 Best Practices

### Code Quality
- All tests must pass before deployment
- Code review required for production
- Automated security scanning
- Performance testing on staging

### Data Management
- Never delete data without backup
- Test migrations on staging first
- Monitor database performance
- Regular data integrity checks

### Documentation
- Keep deployment logs
- Document configuration changes
- Maintain incident reports
- Update runbooks regularly

## 🎯 Quick Commands Reference

```bash
# Deploy to production
./scripts/deploy.sh production

# Create backup
./scripts/backup-database.sh

# Restore from backup
./scripts/restore-database.sh /path/to/backup.sql.gz

# View logs
docker-compose logs -f app

# Scale application
docker-compose up -d --scale app=3

# Health check
curl https://your-domain.com/api/health

# Database console
docker-compose exec postgres psql -U aieraa_user -d aieraa_hostel_prod
```

---

## 📞 Support

- **Documentation**: [Full deployment guide](deploy.md)
- **Issues**: GitHub Issues
- **Emergency**: Contact DevOps team
- **Status**: https://status.your-domain.com

**🎉 Your Aieraa Hostel Food Ordering System is now enterprise-ready!**

# 🚀 DEPLOYMENT VERIFICATION

## ✅ **Redirect Loop Fixed!**

The "ERR_TOO_MANY_REDIRECTS" issue has been resolved by updating the middleware configuration.

## 🔄 **Auto-Deployment**

Your changes are automatically deploying to Vercel. Wait 2-3 minutes for deployment to complete.

## 🧪 **Test Your Fixed Site**

### Step 1: Test Basic Pages
Try these URLs in order:

1. **Homepage**: https://hostel.aieraa.com
   - Should show the landing page with sign-in/sign-up buttons
   - No redirect loops

2. **Sign In Page**: https://hostel.aieraa.com/auth/signin
   - Should show login form
   - No errors

### Step 2: Test Authentication
**Demo Accounts (if seeded):**
- **Admin**: admin@bmu.edu.vn / admin123
- **Student**: student@bmu.edu.vn / student123

### Step 3: Test Dashboards
After login:
- **Admin** → Should redirect to `/admin` dashboard
- **Student** → Should redirect to `/student` dashboard

## 🔧 **If Still Having Issues**

### Clear Browser Data:
1. **Chrome/Edge**: Ctrl+Shift+Delete → Clear cookies and cache
2. **Safari**: Safari → Clear History → All History
3. **Firefox**: Ctrl+Shift+Delete → Everything

### Environment Variables Check:
Ensure these are set in Vercel:
```
DATABASE_URL=postgresql://neondb_owner:npg_qKGr2mCjkH1f@ep-polished-wind-a1r7ql03-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
NEXTAUTH_SECRET=aieraa-hostel-production-secret-key-2024-very-secure-random-string
NEXTAUTH_URL=https://hostel.aieraa.com
```

## 🎯 **Expected Result**

✅ **Landing page loads** without redirect loops  
✅ **Sign-in page works** properly  
✅ **Authentication redirects** work correctly  
✅ **Admin/Student dashboards** accessible after login  

## 📞 **If Problems Persist**

1. Check Vercel function logs for errors
2. Verify environment variables are exactly as shown
3. Try incognito/private browsing mode
4. Wait for deployment to fully complete (3-5 minutes)

---

**🎉 Your Aieraa Hostel Food Ordering System should now be fully functional!** 