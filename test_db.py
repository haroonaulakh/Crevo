import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))


# Have to remove the BOM error by setting URL
from dotenv import load_dotenv
load_dotenv('backend/.env')
# We know SUPABASE_URL might be None, but database.py falls back
from src.app.db.database import get_supabase_client

try:
    print("Testing Supabase connection...")
    client = get_supabase_client()
    print("Fetching one student to get columns...")
    response = client.table("students").select("*").limit(1).execute()
    if response.data:
        print("Columns:", list(response.data[0].keys()))
    else:
        print("Table is empty, no columns dynamically retrieved.")
except Exception as e:
    import traceback
    traceback.print_exc()

    print("Fetching students...")
    response = client.table("students").select("*").limit(1).execute()
    print(f"Response: {response}")
    print("Success!")
except Exception as e:
    import traceback
    traceback.print_exc()
