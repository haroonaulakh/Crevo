import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from src.app.api.v1.routes.students import get_all_students

async def test_get():
    try:
        result = await get_all_students()
        print(f"Successfully fetched {len(result)} students.")
        if result:
            print("First student:", result[0])
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_get())
