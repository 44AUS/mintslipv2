#!/usr/bin/env python3
"""
Script to fix purchase quantities based on payment amounts.

Usage:
  python fix_purchase_quantities.py --preview    # Show what would be updated (default)
  python fix_purchase_quantities.py --apply      # Actually apply the updates

Price reference:
  - Paystub: $9.99 per document
  - Canadian Paystub: $9.99 per document
"""

import asyncio
import argparse
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'mintslip_db')

# Price per document type
PRICES = {
    'paystub': 9.99,
    'canadian-paystub': 9.99,
}

async def fix_quantities(apply_changes=False):
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Get all purchases for document types that support quantities
    purchases = await db.purchases.find({
        'documentType': {'$in': list(PRICES.keys())}
    }).to_list(10000)
    
    print(f'Found {len(purchases)} purchases to analyze\n')
    print(f'{"ID":<40} {"Type":<20} {"Amount":>10} {"Discount":>10} {"Current":>8} {"Calculated":>10} {"Status"}')
    print('=' * 120)
    
    updates_needed = []
    total_updated = 0
    
    for p in purchases:
        doc_type = p.get('documentType', 'unknown')
        amount = p.get('amount', 0) or 0
        discount = p.get('discountAmount', 0) or 0
        current_qty = p.get('quantity', 1) or 1
        
        # Get price per unit for this document type
        price_per_unit = PRICES.get(doc_type, 9.99)
        
        # Calculate original amount before discount
        original_amount = amount + discount
        
        # Calculate quantity
        calculated_qty = round(original_amount / price_per_unit)
        if calculated_qty < 1:
            calculated_qty = 1
            
        needs_update = current_qty != calculated_qty
        status = 'NEEDS UPDATE' if needs_update else 'OK'
        
        print(f'{p.get("id", "N/A"):<40} {doc_type:<20} ${amount:>9.2f} ${discount:>9.2f} {current_qty:>8} {calculated_qty:>10} {status}')
        
        if needs_update:
            updates_needed.append({
                'id': p.get('id'),
                'doc_type': doc_type,
                'old_qty': current_qty,
                'new_qty': calculated_qty,
                'amount': amount,
                'discount': discount
            })
    
    print('=' * 120)
    print(f'\nSummary: {len(updates_needed)} of {len(purchases)} records need updating\n')
    
    if updates_needed:
        print('Records to update:')
        for u in updates_needed:
            print(f'  - {u["id"]}: {u["doc_type"]} qty {u["old_qty"]} -> {u["new_qty"]} (${u["amount"]:.2f} + ${u["discount"]:.2f} discount)')
        
        if apply_changes:
            print('\nApplying updates...')
            for u in updates_needed:
                result = await db.purchases.update_one(
                    {'id': u['id']},
                    {'$set': {'quantity': u['new_qty']}}
                )
                if result.modified_count > 0:
                    total_updated += 1
                    print(f'  ✓ Updated {u["id"]}')
                else:
                    print(f'  ✗ Failed to update {u["id"]}')
            
            print(f'\nDone! Updated {total_updated} records.')
        else:
            print('\n*** PREVIEW MODE - No changes made ***')
            print('Run with --apply to actually update the records')
    else:
        print('All records have correct quantities. No updates needed.')
    
    await client.close()

def main():
    parser = argparse.ArgumentParser(description='Fix purchase quantities based on payment amounts')
    parser.add_argument('--preview', action='store_true', default=True, help='Preview changes without applying (default)')
    parser.add_argument('--apply', action='store_true', help='Actually apply the updates')
    args = parser.parse_args()
    
    apply_changes = args.apply
    
    if apply_changes:
        print('=' * 60)
        print('WARNING: This will modify database records!')
        print('=' * 60)
        confirm = input('Type "yes" to continue: ')
        if confirm.lower() != 'yes':
            print('Aborted.')
            return
    
    asyncio.run(fix_quantities(apply_changes=apply_changes))

if __name__ == '__main__':
    main()
