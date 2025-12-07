# ⚠️ DEPRECATED SCRIPTS

The following scripts are **NO LONGER USED** and have been replaced.

## Deprecated (DO NOT USE):

### 1. `load-flight-data.py` (OLD)
- **Purpose**: Generated 3.6 million flight records from CSV files
- **Issues**: 
  - Too many records (slow queries, large database)
  - Required manual CSV file downloads
  - Limited to 16 routes
  - Inconsistent data quality
- **Replaced by**: `../../generate_complete_flights.py`

### 2. `setup-flight-data.sh` (OLD)
- **Purpose**: Created flight-data directory for CSV imports
- **Issues**: Manual CSV file management
- **Replaced by**: `setup-database.sh`

---

## ✅ Current Scripts (USE THESE):

### 1. `../../generate_complete_flights.py` (CURRENT)
```bash
# Location: Kayak/generate_complete_flights.py
python3 generate_complete_flights.py
```
- **Generates**: 373,481 optimized flight records
- **Coverage**: 16 airports, 8 airlines, 4 cabin classes, 90 days
- **Performance**: Fast, efficient, no external files needed

### 2. `setup-database.sh` (NEW)
```bash
# Automated database setup
./setup-database.sh
```
- Creates database schema
- Runs generate_complete_flights.py automatically
- Verifies data integrity

---

## Migration Guide

If you previously used the old scripts:

```bash
# 1. Clear old data
docker exec kayak-mysql mysql -uroot -p'Somalwar1!' kayak_listings -e "TRUNCATE flights;"

# 2. Generate new optimized data
cd /path/to/Kayak
python3 generate_complete_flights.py

# 3. Verify
docker exec kayak-mysql mysql -uroot -p'Somalwar1!' kayak_listings -e "SELECT COUNT(*) FROM flights;"
# Should show: 373,481
```

---

## Why We Changed

| Aspect | Old (load-flight-data.py) | New (generate_complete_flights.py) |
|--------|---------------------------|-------------------------------------|
| Records | 3.6 million | 373,481 |
| Setup | Manual CSV downloads | Fully automated |
| Routes | 16 | All combinations (240 routes) |
| Airlines | Limited | 8 major airlines |
| Performance | Slow queries | Optimized |
| Maintenance | Complex | Simple |

---

**Last Updated**: November 29, 2025  
**Team Decision**: Reduce dataset size for faster development while maintaining realistic data coverage.
