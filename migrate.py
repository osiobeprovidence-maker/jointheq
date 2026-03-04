import sqlite3
import json
import os

def migrate():
    db = sqlite3.connect('q_platform.db')
    db.row_factory = sqlite3.Row
    cursor = db.cursor()

    tables = [
        'users', 'devices', 'campaigns', 'boot_transactions', 
        'subscriptions', 'slot_types', 'groups', 'slots', 
        'messages', 'lunar_memories', 'lunar_subscriptions', 'transactions'
    ]

    if not os.path.exists('migration_data'):
        os.makedirs('migration_data')

    for table in tables:
        try:
            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()
            
            data = []
            for row in rows:
                item = dict(row)
                # Handle ID conversion from SQLite (INT) to Convex (which uses its own IDs)
                # We'll keep the old ID as 'old_id' if helpful, but Convex import usually takes a clean JSON.
                # Actually, Convex import doesn't automatically map old integer PKs to Convex IDs. 
                # For a clean migration, it's better to just import the data.
                data.append(item)
            
            with open(f'migration_data/{table}.jsonl', 'w') as f:
                for item in data:
                    f.write(json.dumps(item) + '\n')
            
            print(f"Exported {len(data)} rows from {table}")
        except Exception as e:
            print(f"Error exporting {table}: {e}")

    db.close()

if __name__ == "__main__":
    migrate()
