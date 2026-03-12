import sys
sys.path.append('src')
from app.db.database import get_supabase_client

try:
    print("Initializing client...")
    client = get_supabase_client()
    print("Client initialized successfully.")
except Exception as e:
    import traceback
    traceback.print_exc()
