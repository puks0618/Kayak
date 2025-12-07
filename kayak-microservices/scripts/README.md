# Kayak Scripts Directory

## ✅ Active Scripts (USE THESE)

### Database Setup
- **`setup-database.sh`** - Complete database setup for new team members
  - Creates `kayak_listings` database
  - Creates `flights` table with indexes
  - Runs `generate_complete_flights.py` automatically
  - Usage: `./setup-database.sh`

### Local Development
- **`setup-local.sh`** - Set up local development environment
- **`health-check.sh`** - Check if all services are running
- **`get-db-credentials.sh`** - Get database connection details

### Data Generation
- **Main script**: `../../generate_complete_flights.py` (in project root)
  - Generates 373,481 flight records
  - 16 airports, 8 airlines, 4 cabin classes
  - 90 days of data (Dec 2025 - Feb 2026)
  - Usage: `python3 ../../generate_complete_flights.py`

- **Test data**: `generate-test-data.py` - Small dataset for testing

---

## 🗑️ Deprecated Scripts (DO NOT USE)

The following have been **replaced** and should not be used:

- ❌ `DEPRECATED_load-flight-data.py.old` - Old CSV import (3.6M records)
- ❌ `DEPRECATED_setup-flight-data.sh.old` - Old manual setup
- 📄 `DEPRECATED_OLD_SCRIPTS.md` - Migration guide

**Why deprecated?**
- Generated too many records (3.6M → slow performance)
- Required manual CSV file downloads
- Inconsistent with current architecture

---

## Quick Start for New Team Members

```bash
# 1. Start Docker services
cd ../infrastructure/docker
docker compose up -d

# 2. Run database setup (one-time)
cd ../../scripts
./setup-database.sh

# 3. Verify
docker exec kayak-mysql mysql -uroot -p'Somalwar1!' kayak_listings -e "SELECT COUNT(*) FROM flights;"
# Should show: 373,481
```

---

## Regenerating Flight Data

If you need to reset the database:

```bash
# Clear existing data
docker exec kayak-mysql mysql -uroot -p'Somalwar1!' kayak_listings -e "TRUNCATE flights;"

# Generate fresh data
cd /path/to/Kayak
python3 generate_complete_flights.py
```

---

## Script Comparison

| Feature | Old (DEPRECATED) | New (CURRENT) |
|---------|------------------|---------------|
| **Script** | load-flight-data.py | generate_complete_flights.py |
| **Records** | 3.6 million | 373,481 |
| **Setup** | Manual CSV downloads | Fully automated |
| **Performance** | Slow (2-3 min queries) | Fast (<100ms queries) |
| **Airports** | 12 | 16 |
| **Airlines** | Limited | 8 major carriers |
| **Routes** | 16 fixed | 240 combinations |

---

## Need Help?

- 📖 See `../../DATABASE_SETUP_GUIDE.md` for detailed instructions
- 🐛 Check `DEPRECATED_OLD_SCRIPTS.md` for migration info
- 💬 Ask in team Slack/Discord

**Last Updated**: November 29, 2025
