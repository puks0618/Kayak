"""Test entity extraction from user message"""
import re

message = "san jose to LA on december 23rd to 25th for 1000 dollars for 1 person"
message_lower = message.lower()
entities = {}

# Extract origin and destination
from_to_pattern = r'(?:from\s+)?([a-z\s]+?)\s+to\s+([a-z\s]+?)(?:\s+on|\s+for|\s+december|\s+dec|\s*$)'
match = re.search(from_to_pattern, message_lower)
print(f"Pattern: {from_to_pattern}")
print(f"Message: {message_lower}")
print(f"Match: {match}")

if match:
    origin = match.group(1).strip().replace(' ', '')
    destination = match.group(2).strip()
    print(f"\nRaw match:")
    print(f"  Group 1 (origin): '{match.group(1)}'")
    print(f"  Group 2 (destination): '{match.group(2)}'")
    print(f"\nProcessed:")
    print(f"  Origin (no spaces): '{origin}'")
    print(f"  Destination: '{destination}'")
    
    # City mapping
    city_map = {
        'san jose': 'SJC', 'sanjose': 'SJC',
        'la': 'LAX', 'los angeles': 'LAX', 'losangeles': 'LAX',
    }
    entities['origin'] = city_map.get(origin.lower(), origin.upper())
    entities['destination'] = city_map.get(destination.lower(), destination.upper())
    
    print(f"\nFinal entities:")
    print(f"  origin: {entities.get('origin')}")
    print(f"  destination: {entities.get('destination')}")
else:
    print("\n❌ No match found!")

# Extract dates
date_pattern = r'(?:december|dec)\s+(\d{1,2})(?:st|nd|rd|th)?'
date_matches = re.findall(date_pattern, message_lower)
print(f"\n📅 Date matches: {date_matches}")
if len(date_matches) >= 1:
    entities['start_date'] = f"2025-12-{date_matches[0].zfill(2)}"
if len(date_matches) >= 2:
    entities['end_date'] = f"2025-12-{date_matches[1].zfill(2)}"

# Extract budget
budget_match = re.search(r'(?:budget\s+(?:of\s+)?|for\s+)\$?(\d+)\s*(?:dollars?|usd)?', message_lower)
print(f"💰 Budget match: {budget_match}")
if budget_match:
    entities['budget'] = float(budget_match.group(1))

# Extract party size
party_match = re.search(r'(\d+)\s+(?:people|person|passenger|guest)', message_lower)
print(f"👥 Party match: {party_match}")
if party_match:
    entities['party_size'] = int(party_match.group(1))

print(f"\n✅ Final entities dict: {entities}")
