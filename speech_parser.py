import pandas as pd
import json

def excel_to_json(excel_file, output_json):
    # Load Excel
    df = pd.read_excel(excel_file)

    # Normalize column names (remove spaces, lowercase)
    df.columns = df.columns.str.strip().str.lower()

    tasks = []
    for _, row in df.iterrows():
        task = {
            "id": str(row["s.no"]),   # map S.no -> id
            "title": str(row["scenario"]),  # Scenario -> title
            "description": str(row["task"]),  # Task -> description
            "parts": [
                {
                    "part_id": "dataset_check",
                    "type": "csv_similarity",
                    "description": "Validates dataset paths",
                    "dataset": {
                        "train": str(row.get("train", "")),
                        "test": str(row.get("test", ""))
                    },
                    "similarity_threshold": 0.9
                }
            ]
        }
        tasks.append(task)

    # Save JSON
    with open(output_json, "w") as f:
        json.dump(tasks, f, indent=2)

    print(f"✅ JSON file created: {output_json}")


if __name__ == "__main__":
    excel_file = "Speech_Recognition.xlsx"  # update with your path
    output_json = "speech1.json"
    excel_to_json(excel_file, output_json)
