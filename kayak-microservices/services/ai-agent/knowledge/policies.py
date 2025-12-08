"""
Policy Knowledge Base for Travel Q&A
Contains templates for cancellation, baggage, refund, and other policies
"""

from typing import Dict, List, Optional

# General Travel Policies
GENERAL_POLICIES = {
    "cancellation": {
        "flights": """
        Flight Cancellation Policies:
        - Most airlines allow free cancellation within 24 hours of booking
        - Basic Economy tickets are typically non-refundable
        - Refundable tickets can be canceled anytime with full refund
        - Non-refundable tickets may offer credit for future travel (with change fees)
        - Premium cabins usually have more flexible cancellation terms
        """,
        "hotels": """
        Hotel Cancellation Policies:
        - Standard: Free cancellation up to 24-48 hours before check-in
        - Non-refundable rates: Cannot be canceled or changed
        - Luxury hotels: Often 72 hours or more notice required
        - Peak season: Stricter cancellation windows
        - No-show: Full charge if you don't cancel and don't arrive
        """,
        "cars": """
        Car Rental Cancellation Policies:
        - Most rentals: Free cancellation up to 24-48 hours before pickup
        - Prepaid rates: May be non-refundable or have cancellation fees
        - Premium vehicles: May require more notice
        - Airport locations: Often more flexible than off-airport
        """
    },
    "baggage": {
        "carry_on": """
        Carry-On Baggage Rules:
        - Size limit: Typically 22" x 14" x 9" (56cm x 36cm x 23cm)
        - Personal item: 1 additional small bag (purse, laptop bag)
        - Weight limit: Usually no weight limit for carry-on
        - Liquids: 3.4oz (100ml) containers in 1 quart bag
        - Basic Economy: May not include overhead bin access
        """,
        "checked": """
        Checked Baggage Policies:
        - Standard: 1-2 bags included on international flights
        - Domestic: Often $30-35 per bag for first checked bag
        - Weight limit: 50 lbs (23 kg) for standard, 70 lbs (32 kg) for premium
        - Size limit: 62 linear inches (length + width + height)
        - Overweight fees: $75-200 depending on excess weight
        - Premium cabins: Additional free checked bags
        """
    },
    "changes": {
        "flights": """
        Flight Change Policies:
        - Same-day change: Usually $75-100 fee
        - Advance change: $200-300 fee for domestic, $400+ international
        - Fare difference: Always applies when changing to higher fare
        - Premium tickets: Often no change fees
        - Basic Economy: Changes typically not allowed
        """,
        "hotels": """
        Hotel Modification Policies:
        - Date changes: Usually allowed with availability
        - Room type changes: Subject to availability and rate difference
        - Guest name changes: Often allowed without fee
        - Rate changes: New rate applies if changed after booking
        """
    },
    "refunds": {
        "process": """
        Refund Process:
        - Refundable tickets: 7-20 business days to original payment method
        - Credits: Issued immediately, valid 1 year from issue date
        - Hotel refunds: 5-10 business days
        - Car rental refunds: 5-14 business days
        - Disputed charges: 30-90 days investigation period
        """
    }
}

# Airline-Specific Policies
AIRLINE_POLICIES = {
    "Delta": {
        "baggage_fees": {
            "first_bag": 30,
            "second_bag": 40,
            "carry_on_included": True
        },
        "change_fee": 0,  # Delta eliminated change fees
        "cancellation": "Free cancellation for eCredits, 24hr refund window"
    },
    "United": {
        "baggage_fees": {
            "first_bag": 35,
            "second_bag": 45,
            "carry_on_included": True
        },
        "change_fee": 0,
        "cancellation": "eCredits issued for cancellations, 24hr refund window"
    },
    "American": {
        "baggage_fees": {
            "first_bag": 30,
            "second_bag": 40,
            "carry_on_included": True
        },
        "change_fee": 0,
        "cancellation": "Flight credits issued, 24hr refund window"
    },
    "Southwest": {
        "baggage_fees": {
            "first_bag": 0,
            "second_bag": 0,
            "carry_on_included": True
        },
        "change_fee": 0,
        "cancellation": "No change fees, reusable credits"
    },
    "Spirit": {
        "baggage_fees": {
            "first_bag": 41,
            "second_bag": 46,
            "carry_on_included": False,
            "carry_on_fee": 55
        },
        "change_fee": 90,
        "cancellation": "$90 cancel fee, credits issued"
    },
    "JetBlue": {
        "baggage_fees": {
            "first_bag": 35,
            "second_bag": 45,
            "carry_on_included": True
        },
        "change_fee": 0,
        "cancellation": "Credits issued, 24hr refund window"
    }
}

# Hotel Policy Templates
HOTEL_POLICIES = {
    "luxury": {
        "cancellation_hours": 72,
        "pet_policy": "Pets allowed with $150-250 fee",
        "parking": "$40-60 per night valet",
        "early_checkin": "Subject to availability, may incur fee",
        "late_checkout": "Subject to availability, $50-100 fee"
    },
    "mid_range": {
        "cancellation_hours": 48,
        "pet_policy": "Pets allowed with $75-100 fee",
        "parking": "$15-30 per night",
        "early_checkin": "Subject to availability",
        "late_checkout": "Subject to availability, may incur fee"
    },
    "budget": {
        "cancellation_hours": 24,
        "pet_policy": "Limited pet-friendly rooms, $50 fee",
        "parking": "Free parking",
        "early_checkin": "Subject to availability",
        "late_checkout": "Usually not available"
    }
}

# Car Rental Policies
CAR_RENTAL_POLICIES = {
    "age_requirements": """
    Minimum Age Requirements:
    - Standard: 25 years old
    - Young driver (21-24): Additional $25-35/day fee
    - Under 21: Not permitted for most rentals
    - Senior (65+): No additional fees
    """,
    "insurance": """
    Insurance Options:
    - CDW (Collision Damage Waiver): $15-30/day
    - LDW (Loss Damage Waiver): $20-40/day
    - SLI (Supplemental Liability): $10-15/day
    - PAI (Personal Accident Insurance): $5-10/day
    - Credit card coverage: Check with your card provider
    """,
    "fuel_policy": """
    Fuel Policies:
    - Full-to-Full: Return with same fuel level (most economical)
    - Prepaid Fuel: Pay upfront for full tank (usually expensive)
    - Fuel Service: Return empty, pay $8-10/gallon
    - Partial Refund: Rarely offered anymore
    """,
    "mileage": """
    Mileage Policies:
    - Unlimited mileage: Most common for daily/weekly rentals
    - Limited mileage: 150-200 miles/day, then $0.25-0.50/mile
    - One-way fees: $50-500 depending on distance
    """
}

# FAQ Templates
COMMON_QUESTIONS = {
    "baggage_fees": "Baggage fees vary by airline. Southwest allows 2 free checked bags. Most other airlines charge $30-35 for the first bag, $40-45 for the second. Budget airlines like Spirit charge for both carry-on ($55) and checked bags ($41+).",
    
    "24_hour_rule": "US regulations require airlines to allow free cancellation within 24 hours of booking if the flight is at least 7 days away. This applies to all tickets, including non-refundable fares.",
    
    "change_fees": "Most major airlines (Delta, United, American, Southwest, JetBlue) have eliminated change fees for domestic flights. You only pay the fare difference. Basic Economy tickets are usually non-changeable.",
    
    "tsa_precheck": "TSA PreCheck costs $78 for 5 years. Benefits include keeping shoes/belt on, laptops in bags, and access to faster security lanes. CLEAR ($189/year) is faster but more expensive.",
    
    "hotel_early_checkin": "Early check-in is subject to room availability. Luxury hotels may charge $50-100. Mid-range hotels often accommodate for free if rooms are ready. Call ahead to request.",
    
    "hotel_late_checkout": "Late checkout (usually 2-4 PM) is subject to availability. Some hotels offer it free to loyalty members. Others charge 50% of the nightly rate or $50-100.",
    
    "rental_car_insurance": "Your auto insurance and credit card may already cover rental cars. Check before purchasing expensive rental company insurance ($20-40/day). CDW/LDW covers vehicle damage, SLI covers liability.",
    
    "refund_timeline": "Refunds take 7-20 business days to process back to your original payment method. Travel credits are issued immediately and typically valid for 1 year."
}

def get_policy_answer(question: str) -> Optional[str]:
    """
    Match question to relevant policy information
    """
    question_lower = question.lower()
    
    # Baggage-related
    if any(word in question_lower for word in ['baggage', 'bag', 'luggage', 'carry', 'checked']):
        if 'fee' in question_lower or 'cost' in question_lower or 'how much' in question_lower:
            return COMMON_QUESTIONS['baggage_fees']
        if 'carry' in question_lower:
            return GENERAL_POLICIES['baggage']['carry_on']
        return GENERAL_POLICIES['baggage']['checked']
    
    # Cancellation-related
    if any(word in question_lower for word in ['cancel', 'cancellation']):
        if 'flight' in question_lower or 'airline' in question_lower:
            return GENERAL_POLICIES['cancellation']['flights']
        if 'hotel' in question_lower:
            return GENERAL_POLICIES['cancellation']['hotels']
        if 'car' in question_lower or 'rental' in question_lower:
            return GENERAL_POLICIES['cancellation']['cars']
        return GENERAL_POLICIES['cancellation']['flights']  # Default
    
    # Change/modification
    if any(word in question_lower for word in ['change', 'modify', 'modification']):
        if 'fee' in question_lower:
            return COMMON_QUESTIONS['change_fees']
        if 'hotel' in question_lower:
            return GENERAL_POLICIES['changes']['hotels']
        return GENERAL_POLICIES['changes']['flights']
    
    # Refund-related
    if any(word in question_lower for word in ['refund', 'money back']):
        return GENERAL_POLICIES['refunds']['process']
    
    # 24-hour rule
    if '24' in question_lower and any(word in question_lower for word in ['hour', 'cancel', 'free']):
        return COMMON_QUESTIONS['24_hour_rule']
    
    # Hotel-specific
    if 'check' in question_lower and 'early' in question_lower:
        return COMMON_QUESTIONS['hotel_early_checkin']
    if 'check' in question_lower and 'late' in question_lower:
        return COMMON_QUESTIONS['hotel_late_checkout']
    
    # Car rental
    if 'insurance' in question_lower and 'car' in question_lower:
        return COMMON_QUESTIONS['rental_car_insurance']
    if 'age' in question_lower and ('car' in question_lower or 'rental' in question_lower):
        return CAR_RENTAL_POLICIES['age_requirements']
    if 'fuel' in question_lower or 'gas' in question_lower:
        return CAR_RENTAL_POLICIES['fuel_policy']
    
    # TSA/Security
    if 'tsa' in question_lower or 'precheck' in question_lower or 'clear' in question_lower:
        return COMMON_QUESTIONS['tsa_precheck']
    
    return None

def get_airline_policy(airline: str, policy_type: str) -> Optional[str]:
    """
    Get specific airline policy information
    """
    airline_data = AIRLINE_POLICIES.get(airline)
    if not airline_data:
        return None
    
    if policy_type == 'baggage':
        fees = airline_data.get('baggage_fees', {})
        carry_on = "✓ Carry-on included" if fees.get('carry_on_included') else f"✗ Carry-on fee: ${fees.get('carry_on_fee', 'N/A')}"
        first = f"${fees.get('first_bag', 'N/A')}"
        second = f"${fees.get('second_bag', 'N/A')}"
        return f"{airline} Baggage Fees:\n{carry_on}\n1st checked bag: {first}\n2nd checked bag: {second}"
    
    if policy_type == 'change':
        fee = airline_data.get('change_fee', 'N/A')
        fee_text = f"${fee}" if fee > 0 else "No change fees"
        return f"{airline} Change Policy: {fee_text}"
    
    if policy_type == 'cancellation':
        return f"{airline} Cancellation: {airline_data.get('cancellation', 'N/A')}"
    
    return None
