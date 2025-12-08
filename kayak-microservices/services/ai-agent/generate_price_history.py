"""
Generate realistic price history for deals
Simulates 60 days of price fluctuations
"""

import sqlite3
import random
from datetime import datetime, timedelta
from typing import List, Tuple


DB_PATH = "./data/kayak_ai.db"


def generate_price_history(
    deal_id: str,
    current_price: float,
    days: int = 60
) -> List[Tuple[str, str, float, datetime]]:
    """
    Generate realistic price history with trends
    
    Simulates different patterns:
    - Seasonal trends
    - Weekend spikes
    - Flash sales
    - Gradual price increases
    """
    history = []
    base_price = current_price
    
    # Determine price pattern
    pattern = random.choice(['stable', 'falling', 'rising', 'volatile'])
    
    for day in range(days, 0, -1):
        date = datetime.utcnow() - timedelta(days=day)
        
        # Calculate price based on pattern
        if pattern == 'stable':
            # Stable with small fluctuations (±5%)
            price = base_price * random.uniform(0.95, 1.05)
        
        elif pattern == 'falling':
            # Gradual decrease over time
            progress = (days - day) / days  # 0 to 1
            trend_factor = 1.3 - (progress * 0.3)  # 1.3 to 1.0
            price = base_price * trend_factor * random.uniform(0.95, 1.05)
        
        elif pattern == 'rising':
            # Gradual increase over time
            progress = (days - day) / days
            trend_factor = 0.85 + (progress * 0.15)  # 0.85 to 1.0
            price = base_price * trend_factor * random.uniform(0.95, 1.05)
        
        else:  # volatile
            # High variance
            price = base_price * random.uniform(0.80, 1.25)
        
        # Weekend spikes (for flights/hotels)
        if date.weekday() >= 5:  # Saturday, Sunday
            price *= random.uniform(1.05, 1.15)
        
        # Random flash sales (10% chance)
        if random.random() < 0.1:
            price *= random.uniform(0.75, 0.90)
        
        history.append((
            deal_id,
            date.isoformat(),
            round(price, 2),
            None  # available_inventory - not tracked for now
        ))
    
    return history


def populate_price_history():
    """Populate price history for existing deals"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create price_history table if not exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            deal_id TEXT NOT NULL,
            price REAL NOT NULL,
            available_inventory INTEGER,
            recorded_at TEXT NOT NULL,
            FOREIGN KEY (deal_id) REFERENCES deals(deal_id)
        )
    """)
    
    # Get all active deals
    cursor.execute("""
        SELECT deal_id, price, type
        FROM deals
        WHERE active = 1
        LIMIT 1000
    """)
    
    deals = cursor.fetchall()
    print(f"Found {len(deals)} active deals")
    
    total_records = 0
    
    for i, (deal_id, current_price, deal_type) in enumerate(deals):
        # Generate history
        history = generate_price_history(deal_id, current_price, days=60)
        
        # Insert history records
        cursor.executemany("""
            INSERT INTO price_history (deal_id, price, available_inventory, recorded_at)
            VALUES (?, ?, ?, ?)
        """, [(h[0], h[2], h[3], h[1]) for h in history])
        
        total_records += len(history)
        
        if (i + 1) % 100 == 0:
            print(f"Processed {i + 1}/{len(deals)} deals ({total_records} price records)")
            conn.commit()
    
    # Create index for faster queries
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_price_history_deal_date
        ON price_history(deal_id, recorded_at DESC)
    """)
    
    conn.commit()
    conn.close()
    
    print(f"\n✅ Generated {total_records} price history records for {len(deals)} deals")
    return total_records


if __name__ == "__main__":
    print("="*60)
    print("PRICE HISTORY GENERATION")
    print("="*60)
    
    total = populate_price_history()
    
    print("\n" + "="*60)
    print(f"COMPLETE: {total} records generated")
    print("="*60)
