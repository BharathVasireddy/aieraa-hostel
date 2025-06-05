# 🚀 Aieraa Hostel - Corporate Deployment & Maintenance Guide

## 📋 Table of Contents
- [Environment Strategy](#environment-strategy)
- [Database Migration Strategy](#database-migration-strategy)
- [CI/CD Pipeline](#cicd-pipeline)
- [Production Deployment](#production-deployment)
- [Backup & Recovery](#backup--recovery)
- [Monitoring & Logging](#monitoring--logging)
- [Version Management](#version-management)
- [Security & Compliance](#security--compliance)
- [Maintenance Procedures](#maintenance-procedures)

---

## 🏗️ Environment Strategy

### Environment Hierarchy
```
Development → Staging → Production
```

### 1. **Development Environment**
- Local development with Docker containers
- Separate database per developer
- Hot reload and debugging enabled
- Mock payment gateways

### 2. **Staging Environment**
- Exact replica of production
- Real payment gateway (test mode)
- Performance testing
- User acceptance testing (UAT)

### 3. **Production Environment**
- High availability setup
- Load balancers
- CDN for static assets
- Real payment processing

---

## 🗄️ Database Migration Strategy

### Migration Workflow
```mermaid
graph LR
    A[Schema Changes] --> B[Migration Scripts]
    B --> C[Testing in Dev]
    C --> D[Staging Validation]
    D --> E[Production Deployment]
    E --> F[Rollback Plan]
```

### 1. **Migration Scripts Structure**
```bash
migrations/
├── 001_initial_schema.sql
├── 002_add_university_settings.sql
├── 003_menu_categories_update.sql
└── rollback/
    ├── 001_rollback_initial.sql
    ├── 002_rollback_university_settings.sql
    └── 003_rollback_menu_categories.sql
```

### 2. **Zero-Downtime Migration Strategy**
- **Blue-Green Deployment**: Two identical production environments
- **Rolling Updates**: Gradual server replacement
- **Feature Flags**: Toggle new features without deployment

---

## 🔄 CI/CD Pipeline

### Pipeline Stages
```yaml
# .github/workflows/deploy.yml
name: Aieraa Hostel CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
      
      - name: Run API tests
        run: node working-comprehensive-test.js
      
      - name: Check TypeScript
        run: npm run type-check
      
      - name: Lint code
        run: npm run lint

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run security audit
        run: npm audit --audit-level moderate
      
      - name: SAST scan
        uses: github/super-linter@v4
        env:
          DEFAULT_BRANCH: main
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  build:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build application
        run: |
          npm ci
          npm run build
      
      - name: Build Docker image
        run: |
          docker build -t aieraa-hostel:${{ github.sha }} .
          docker tag aieraa-hostel:${{ github.sha }} aieraa-hostel:latest

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: echo "Deploy to staging environment"

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: echo "Deploy to production environment"
```

---

## 🌐 Production Deployment

### 1. **Infrastructure Setup (AWS/Azure/GCP)**

#### Docker Configuration
```dockerfile
# Dockerfile.production
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM base AS runtime
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src/generated ./src/generated

EXPOSE 3000
CMD ["npm", "start"]
```

#### Docker Compose for Production
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: aieraa_hostel_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 2. **Load Balancer Configuration**
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
        # Add more servers for load balancing
        # server app2:3000;
        # server app3:3000;
    }

    server {
        listen 80;
        server_name aieraa-hostel.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name aieraa-hostel.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /_next/static {
            expires 1y;
            add_header Cache-Control "public, immutable";
            proxy_pass http://app;
        }
    }
}
```

---

## 💾 Backup & Recovery

### 1. **Database Backup Strategy**
```bash
#!/bin/bash
# scripts/backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="aieraa_hostel_prod"

# Create backup
pg_dump -h postgres -U $DB_USER -d $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Upload to cloud storage (AWS S3 example)
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://aieraa-backups/database/

# Keep only last 30 days of local backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

### 2. **Automated Backup Cron**
```bash
# Add to crontab
# Daily backup at 2 AM
0 2 * * * /app/scripts/backup-database.sh

# Weekly full backup on Sunday at 3 AM
0 3 * * 0 /app/scripts/full-backup.sh
```

### 3. **Recovery Procedures**
```bash
#!/bin/bash
# scripts/restore-database.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# Stop application
docker-compose stop app

# Restore database
gunzip -c $BACKUP_FILE | psql -h postgres -U $DB_USER -d $DB_NAME

# Run migrations if needed
npm run migrate

# Start application
docker-compose start app

echo "Database restored from $BACKUP_FILE"
```

---

## 📊 Monitoring & Logging

### 1. **Application Monitoring**
```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

  node-exporter:
    image: prom/node-exporter
    ports:
      - "9100:9100"

volumes:
  grafana_data:
```

### 2. **Application Health Check**
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@/src/generated/prisma'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Check critical services
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        redis: 'healthy', // Add Redis check
        storage: 'healthy' // Add storage check
      },
      version: process.env.APP_VERSION || 'unknown'
    }

    return NextResponse.json(healthStatus)
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
```

### 3. **Logging Configuration**
```typescript
// src/lib/logger.ts
import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'aieraa-hostel',
    version: process.env.APP_VERSION 
  },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})

export default logger
```

---

## 🏷️ Version Management

### 1. **Git Workflow (GitFlow)**
```
main (production)
├── develop (staging)
├── feature/new-payment-gateway
├── hotfix/critical-bug-fix
└── release/v1.2.0
```

### 2. **Semantic Versioning**
```json
{
  "version": "1.2.3",
  "scripts": {
    "version:patch": "npm version patch",
    "version:minor": "npm version minor", 
    "version:major": "npm version major",
    "release": "npm run build && npm run test && npm version patch && git push --tags"
  }
}
```

### 3. **Database Versioning**
```typescript
// prisma/migrations/track-versions.sql
CREATE TABLE IF NOT EXISTS migration_history (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50) NOT NULL,
  description TEXT,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  rollback_script TEXT
);
```

---

## 🔒 Security & Compliance

### 1. **Environment Variables Management**
```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_SECRET=your-super-secret-key
NEXTAUTH_URL=https://aieraa-hostel.com

# Payment Gateway
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@aieraa-hostel.com
SMTP_PASS=your-app-password

# Cloud Storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=aieraa-uploads
```

### 2. **Security Headers**
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```

---

## 🔧 Maintenance Procedures

### 1. **Deployment Checklist**
```markdown
## Pre-Deployment Checklist
- [ ] Code review completed
- [ ] All tests passing
- [ ] Security scan passed
- [ ] Database migrations tested
- [ ] Backup taken
- [ ] Rollback plan ready
- [ ] Team notified

## Deployment Steps
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Performance testing
- [ ] Deploy to production
- [ ] Monitor metrics
- [ ] Verify functionality

## Post-Deployment
- [ ] Monitor error rates
- [ ] Check database performance
- [ ] Verify critical features
- [ ] Update documentation
```

### 2. **Database Maintenance Scripts**
```bash
#!/bin/bash
# scripts/maintenance.sh

echo "Starting database maintenance..."

# Update statistics
psql -h postgres -U $DB_USER -d $DB_NAME -c "ANALYZE;"

# Vacuum database
psql -h postgres -U $DB_USER -d $DB_NAME -c "VACUUM;"

# Reindex if needed
psql -h postgres -U $DB_USER -d $DB_NAME -c "REINDEX DATABASE $DB_NAME;"

echo "Database maintenance completed."
```

### 3. **Performance Monitoring**
```typescript
// src/middleware/performance.ts
import { NextRequest, NextResponse } from 'next/server'
import logger from '@/src/lib/logger'

export function performanceMiddleware(request: NextRequest) {
  const start = Date.now()
  
  const response = NextResponse.next()
  
  response.headers.set('X-Response-Time', `${Date.now() - start}ms`)
  
  // Log slow requests
  const duration = Date.now() - start
  if (duration > 1000) {
    logger.warn('Slow request detected', {
      url: request.url,
      method: request.method,
      duration: `${duration}ms`
    })
  }
  
  return response
}
```

---

## 📈 Scaling Strategy

### 1. **Horizontal Scaling**
```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aieraa-hostel
spec:
  replicas: 3
  selector:
    matchLabels:
      app: aieraa-hostel
  template:
    metadata:
      labels:
        app: aieraa-hostel
    spec:
      containers:
      - name: app
        image: aieraa-hostel:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### 2. **Database Scaling**
```sql
-- Read replicas for better performance
-- Master-slave configuration
-- Connection pooling with PgBouncer
```

---

## 🚀 Quick Start Deployment

```bash
# 1. Clone and setup
git clone <repository>
cd aieraa-hostel

# 2. Environment setup
cp .env.example .env.production
# Edit .env.production with your values

# 3. Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# 4. Run migrations
docker-compose exec app npm run migrate

# 5. Setup monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

---

This comprehensive guide ensures enterprise-level deployment with zero data loss, proper versioning, and corporate maintenance standards. The system is designed for high availability, scalability, and maintainability. 