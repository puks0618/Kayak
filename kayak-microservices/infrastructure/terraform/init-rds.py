#!/usr/bin/env python3
"""
Initialize RDS MySQL database with all required tables
"""

import mysql.connector
import sys
import os
import glob
from pathlib import Path

# Database configuration
RDS_HOST = "kayak-mysql-db.c078kkiggn44.us-east-1.rds.amazonaws.com"
DB_USER = "admin"
DB_PASSWORD = "Somalwar1!"
DB_PORT = 3306

def execute_sql_file(cursor, filepath):
    """Execute SQL commands from a file"""
    print(f"Running: {os.path.basename(filepath)}")
    
    with open(filepath, 'r') as f:
        sql_content = f.read()
    
    # Split by semicolon and execute each statement
    statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
    
    for statement in statements:
        if statement:
            try:
                cursor.execute(statement)
            except mysql.connector.Error as err:
                # Ignore "database exists" errors
                if "already exists" not in str(err).lower():
                    print(f"Warning: {err}")
    
    print(f"✓ {os.path.basename(filepath)} executed successfully")

def main():
    print("=" * 50)
    print("Initializing RDS MySQL Database")
    print("=" * 50)
    print(f"Host: {RDS_HOST}")
    print()
    
    try:
        # Connect to MySQL
        print("Connecting to RDS...")
        connection = mysql.connector.connect(
            host=RDS_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )
        cursor = connection.cursor()
        print("✓ Connection successful")
        print()
        
        # Get SQL init files
        script_dir = Path(__file__).parent
        sql_dir = script_dir.parent / "databases" / "mysql" / "init"
        sql_files = sorted(glob.glob(str(sql_dir / "*.sql")))
        
        if not sql_files:
            print(f"Error: No SQL files found in {sql_dir}")
            return 1
        
        print(f"Found {len(sql_files)} SQL files to execute")
        print()
        
        # Execute each SQL file
        for sql_file in sql_files:
            execute_sql_file(cursor, sql_file)
            connection.commit()
        
        # Verify databases were created
        cursor.execute("SHOW DATABASES;")
        databases = [db[0] for db in cursor.fetchall()]
        
        print()
        print("=" * 50)
        print("Database initialization complete!")
        print("=" * 50)
        print()
        print("Created databases:")
        for db in databases:
            if db.startswith('kayak_'):
                print(f"  - {db}")
        
        print()
        print("Connection details:")
        print(f"  Host: {RDS_HOST}")
        print(f"  Port: {DB_PORT}")
        print(f"  User: {DB_USER}")
        print()
        
        cursor.close()
        connection.close()
        
        return 0
        
    except mysql.connector.Error as err:
        print(f"✗ Database error: {err}")
        return 1
    except Exception as e:
        print(f"✗ Error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
