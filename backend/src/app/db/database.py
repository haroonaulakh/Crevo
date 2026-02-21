import os

from dotenv import load_dotenv
from supabase import Client, create_client

# Load environment variables from backend/.env (if present)
load_dotenv()

# Prefer values from .env, but fall back to known Supabase project config
SUPABASE_URL = os.getenv("SUPABASE_URL") or "https://xajhpumlcbcbhbbrwoui.supabase.co"
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY") or (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhamhwdW1sY2JjYmhiYnJ3b3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MDAzNjQs"
    "ImV4cCI6MjA4MjE3NjM2NH0.sbSQbZGdIIudziwYgWSmina0Y-vYpFb_jwP7Ian9zOY"
)
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

_supabase_client: Client | None = None


def get_supabase_client() -> Client:
    """
    Return a singleton Supabase client.

    - Prefers SERVICE_ROLE key if available (bypasses RLS; safe on backend).
    - Falls back to ANON key if service role is not configured.
    """

    global _supabase_client

    if _supabase_client is not None:
        return _supabase_client

    # Bypass local proxies (like 127.0.0.1:14266) to avoid [SSL: WRONG_VERSION_NUMBER]
    # because httpx used by supabase-py picks up windows system proxies automatically.
    os.environ["NO_PROXY"] = "*"

    api_key = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY

    try:
        key_type = "SERVICE_ROLE" if SUPABASE_SERVICE_ROLE_KEY else "ANON"
        print(f"Creating Supabase client with {key_type} key")
        _supabase_client = create_client(SUPABASE_URL, api_key)
        return _supabase_client
    except Exception as exc:  # pragma: no cover - runtime configuration error
        print(f"Error creating Supabase client: {exc}")
        raise


