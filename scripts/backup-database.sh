#!/bin/bash
set -e

# Configuration
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_HOST="${DB_HOST:-postgres}"
DB_NAME="${POSTGRES_DB:-aieraa_hostel_prod}"
DB_USER="${POSTGRES_USER:-aieraa_user}"
BACKUP_RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "Starting backup process at $(date)"

# Create database backup
echo "Creating database backup..."
PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

if [ $? -eq 0 ]; then
    echo "Database backup created successfully: backup_$DATE.sql"
else
    echo "ERROR: Database backup failed!"
    exit 1
fi

# Compress backup
echo "Compressing backup..."
gzip $BACKUP_DIR/backup_$DATE.sql

if [ $? -eq 0 ]; then
    echo "Backup compressed successfully: backup_$DATE.sql.gz"
else
    echo "ERROR: Backup compression failed!"
    exit 1
fi

# Upload to cloud storage (uncomment and configure as needed)
# if [ ! -z "$AWS_ACCESS_KEY_ID" ]; then
#     echo "Uploading to AWS S3..."
#     aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://$AWS_S3_BUCKET/database/
#     if [ $? -eq 0 ]; then
#         echo "Backup uploaded to S3 successfully"
#     else
#         echo "WARNING: S3 upload failed"
#     fi
# fi

# Clean up old backups (keep only last 30 days)
echo "Cleaning up old backups..."
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$BACKUP_RETENTION_DAYS -delete
echo "Old backups cleaned up (kept last $BACKUP_RETENTION_DAYS days)"

# Calculate backup size
BACKUP_SIZE=$(du -h $BACKUP_DIR/backup_$DATE.sql.gz | cut -f1)
echo "Backup size: $BACKUP_SIZE"

# Create backup log entry
echo "$(date): Backup completed successfully - backup_$DATE.sql.gz ($BACKUP_SIZE)" >> $BACKUP_DIR/backup.log

echo "Backup process completed successfully at $(date)" 