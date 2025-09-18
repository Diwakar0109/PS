import pandas as pd
import json

def excel_to_json(input_file, output_file):
    # Read file (CSV or Excel)
    if input_file.endswith(".csv"):
        try:
            df = pd.read_csv(input_file)
        except Exception as e:
            print(f"⚠️ CSV parsing failed ({e}), retrying with on_bad_lines='skip'")
            df = pd.read_csv(input_file, on_bad_lines="skip")
    else:
        df = pd.read_excel(input_file)

    tasks = {}

    for _, row in df.iterrows():
        task_id = str(row.get("id", "")).strip()
        if not task_id:
            continue

        # Create new task if not already present
        if task_id not in tasks:
            tasks[task_id] = {
                "id": task_id,
                "title": str(row.get("title", "")).strip(),
                "description": str(row.get("description", "")).strip(),
                "datasets": {},
                "parts": []
            }

        # --- Add datasets (fixed to match your Excel columns) ---
        if pd.notna(row.get("train_dataset")):
            tasks[task_id]["datasets"]["train"] = str(row.get("train_dataset")).strip()
        if pd.notna(row.get("test_dataset")):
            tasks[task_id]["datasets"]["test"] = str(row.get("test_dataset")).strip()

        # --- Add parts ---
        part_id = str(row.get("part_id", "")).strip()
        if part_id:
            part = {
                "part_id": part_id,
                "type": str(row.get("type", "")).strip(),
                "description": str(row.get("part_description", "")).strip()
            }

            # optional fields
            if pd.notna(row.get("expected_text")):
                part["expected_text"] = str(row.get("expected_text")).strip()

            if pd.notna(row.get("expected_value")):
                try:
                    part["expected_value"] = float(row.get("expected_value"))
                except ValueError:
                    part["expected_value"] = str(row.get("expected_value")).strip()

            if pd.notna(row.get("evaluation_label")):
                part["evaluation_label"] = str(row.get("evaluation_label")).strip()

            if pd.notna(row.get("placeholder_filename")):
                part["placeholder_filename"] = str(row.get("placeholder_filename")).strip()

            if pd.notna(row.get("solution_file")):
                part["solution_file"] = str(row.get("solution_file")).strip()

            if pd.notna(row.get("key_columns")):
                part["key_columns"] = [c.strip() for c in str(row.get("key_columns")).split(",") if c.strip()]

            if pd.notna(row.get("similarity_threshold")):
                try:
                    part["similarity_threshold"] = float(row.get("similarity_threshold"))
                except ValueError:
                    pass

            if pd.notna(row.get("tolerance")):
                try:
                    part["tolerance"] = float(row.get("tolerance"))
                except ValueError:
                    pass

            tasks[task_id]["parts"].append(part)

    # Convert dict → list
    result = list(tasks.values())

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"✅ Converted {input_file} → {output_file}")


# Example usage
if __name__ == "__main__":
    excel_to_json("ml_questions.xlsx", "ml_1.json")
