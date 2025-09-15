import pandas as pd
import json

def excel_to_json(excel_path, output_path):
    df = pd.read_excel(excel_path)
    df = df.fillna("")

    tasks = []

    for qid, group in df.groupby("id"):
        group = group.reset_index(drop=True)

        # Always take the longest description (so full markdown is preserved)
        descriptions = [d for d in group["description"] if d]
        description = max(descriptions, key=len) if descriptions else ""

        # Same for title
        titles = [t for t in group["title"] if t]
        title = titles[0] if titles else ""

        # Collect parts
        parts = []
        for _, row in group.iterrows():
            if not row["part_id"]:
                continue

            part = {
                "part_id": row["part_id"],
                "type": row["part_type"],
                "description": row["part_description"],
            }
            if row["expected_text"]: part["expected_text"] = row["expected_text"]
            if row["similarity_threshold"]: part["similarity_threshold"] = float(row["similarity_threshold"])
            if row["train_file"]: part["train_file"] = row["train_file"]
            if row["test_file"]: part["test_file"] = row["test_file"]
            if row["student_file"]: part["student_file"] = row["student_file"]
            if row["placeholder_filename"]: part["placeholder_filename"] = row["placeholder_filename"]
            if row["solution_file"]: part["solution_file"] = row["solution_file"]
            if row["key_columns"]: part["key_columns"] = row["key_columns"].split("|")

            parts.append(part)

        task = {
            "id": qid,
            "title": title,
            "description": description,
        }

        if parts:   # ✅ only add if not empty
            task["parts"] = parts

        tasks.append(task)

    with open(output_path, "w") as f:
        json.dump(tasks, f, indent=2)

    print(f"✅ JSON saved to {output_path}")

excel_to_json("standardized_questions_filled.xlsx", "questions.json")