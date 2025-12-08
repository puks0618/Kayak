#!/bin/bash
# Setup script for flight data

echo "Setting up flight data folder..."

# Create flight-data directory
mkdir -p "$(dirname "$0")/flight-data"

echo "✓ Created flight-data directory"
echo ""
echo "Now run these commands to sample and copy the data:"
echo ""
echo "# Sample first 100K rows from itineraries (includes header)"
echo "head -n 100001 '/Users/keith/Downloads/itineraries 2.csv' > '$(dirname "$0")/flight-data/itineraries.csv'"
echo ""
echo "# Copy airports file"
echo "cp '/Users/keith/Downloads/airports.csv' '$(dirname "$0")/flight-data/airports.csv'"
echo ""
echo "After running those commands, you can run:"
echo "python3 load-flight-data.py"


