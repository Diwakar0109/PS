import pandas as pd
import json

# Load single-sheet Excel
df = pd.read_excel("ds.xlsx")

result = []

# Group by question id
for q_id, group in df.groupby("id"):
    # Take first row for title & description
    first_row = group.iloc[0]
    
    test_cases = []
    for _, row in group.iterrows():
        test_cases.append({
            "input": str(row["input"]),
            "output": str(row["output"])
        })
    
    result.append({
        "id": first_row["id"],
        "title": first_row["title"],
        "description": first_row["description"],
        "test_cases": test_cases
    })

# Save JSON
with open("ds_1.json", "w") as f:
    json.dump(result, f, indent=2)

print("✅ JSON file created successfully!")
