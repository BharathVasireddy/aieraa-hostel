#!/bin/bash
set -e

# Configuration
DB_HOST="${DB_HOST:-postgres}"
DB_NAME="${POSTGRES_DB:-aieraa_hostel_prod}"
DB_USER="${POSTGRES_USER:-aieraa_user}"
BACKUP_FILE=$1

# Function to show usage
show_usage() {
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 /backups/backup_20231201_120000.sql.gz"
    echo ""
    echo "Available backups:"
    ls -la /backups/backup_*.sql.gz 2>/dev/null || echo "No backups found"
}

# Check if backup file is provided
if [ -z "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not specified"
    show_usage
    exit 1
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file '$BACKUP_FILE' not found"
    show_usage
    exit 1
fi

echo "Starting database restore process at $(date)"
echo "Backup file: $BACKUP_FILE"
echo "Target database: $DB_NAME"

# Confirmation prompt
read -p "This will OVERWRITE the current database. Are you sure? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled"
    exit 0
fi

# Create a backup of current database before restore
echo "Creating backup of current database before restore..."
CURRENT_BACKUP="/backups/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql"
PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $CURRENT_BACKUP
gzip $CURRENT_BACKUP
echo "Current database backed up to: ${CURRENT_BACKUP}.gz"

# Stop application (if running in Docker Compose)
echo "Stopping application..."
docker-compose -f docker-compose.prod.yml stop app || echo "Application not running or not in Docker Compose mode"

# Wait for connections to close
echo "Waiting for connections to close..."
sleep 5

# Terminate existing connections to the database
echo "Terminating existing database connections..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -U $DB_USER -d postgres -c "
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"

# Drop and recreate database
echo "Recreating database..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"

# Restore database
echo "Restoring database from backup..."
if [[ $BACKUP_FILE == *.gz ]]; then
    # Compressed backup
    gunzip -c $BACKUP_FILE | PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME
else
    # Uncompressed backup
    PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME < $BACKUP_FILE
fi

if [ $? -eq 0 ]; then
    echo "Database restored successfully"
else
    echo "ERROR: Database restore failed!"
    echo "Attempting to restore from pre-restore backup..."
    gunzip -c ${CURRENT_BACKUP}.gz | PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME
    exit 1
fi

# Run migrations if needed
echo "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T app npx prisma migrate deploy || echo "Migration failed or container not running"

# Start application
echo "Starting application..."
docker-compose -f docker-compose.prod.yml start app || echo "Failed to start application via Docker Compose"

# Verify database integrity
echo "Verifying database integrity..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) as user_count FROM users;"
PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) as order_count FROM orders;"

# Log restore operation
echo "$(date): Database restored from $BACKUP_FILE" >> /backups/restore.log

echo "Database restore completed successfully at $(date)"
echo "Pre-restore backup available at: ${CURRENT_BACKUP}.gz" 