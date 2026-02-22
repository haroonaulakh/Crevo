import os
os.environ["NO_PROXY"] = "*"

from supabase import create_client

c = create_client(
    "https://xajhpumlcbcbhbbrwoui.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhamhwdW1sY2JjYmhiYnJ3b3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MDAzNjQs"
    "ImV4cCI6MjA4MjE3NjM2NH0.sbSQbZGdIIudziwYgWSmina0Y-vYpFb_jwP7Ian9zOY"
)

r = c.table("students").select("reg_no, gender").execute()
total = len(r.data)
genders = {}
for s in r.data:
    g = s.get("gender") or "(empty)"
    g = g.strip()
    genders[g] = genders.get(g, 0) + 1

print(f"Total students returned by API: {total}")
print(f"\nGender breakdown:")
for g, count in sorted(genders.items()):
    print(f"  '{g}' = {count}")
print(f"\nSum of all: {sum(genders.values())}")
