import traceback

try:
    import supabase
    print("supabase imported ok")
except Exception as e:
    with open('import_error.txt', 'w') as f:
        f.write(traceback.format_exc())
