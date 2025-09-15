import pandas as pd
import json

def parse_standard_excel(excel_path, output_path):
    """
    Reads a standardized Excel file, processes questions and parts,
    and generates a questions.json file.
    """
    try:
        df = pd.read_excel(excel_path)
        df = df.fillna("")
    except FileNotFoundError:
        print(f"Error: The input file '{excel_path}' was not found.")
        return

    tasks = []
    # Group by the main question 'id'
    for qid, group in df.groupby("id"):
        group = group.reset_index(drop=True)

        # Get the main description and title from the first row of the group
        description = group["description"].iloc[0]
        title = group["title"].iloc[0]

        # Collect all parts for this question
        parts = []
        for _, row in group.iterrows():
            if not row["part_id"]:
                continue

            part = {
                "part_id": row["part_id"],
                "type": row["part_type"],
                "description": row["part_description"],
            }
            # Add optional fields only if they have a value
            if row["expected_text"]: part["expected_text"] = row["expected_text"]
            if row["similarity_threshold"]: part["similarity_threshold"] = float(row["similarity_threshold"])
            if row["train_file"]: part["train_file"] = row["train_file"]
            if row["test_file"]: part["test_file"] = row["test_file"]
            if row["student_file"]: part["student_file"] = row["student_file"]
            if row["placeholder_filename"]: part["placeholder_filename"] = row["placeholder_filename"]
            if row["solution_file"]: part["solution_file"] = row["solution_file"]
            if row["key_columns"]: part["key_columns"] = [k.strip() for k in row["key_columns"].split("|")]
            
            parts.append(part)

        task = {
            "id": qid,
            "title": title,
            "description": description,
        }

        if parts:
            task["parts"] = parts

        tasks.append(task)

    with open(output_path, "w") as f:
        json.dump(tasks, f, indent=2)

    print(f"✅ Standardized JSON saved to {output_path}")

# This part is for running the script directly; it won't be used by the web server
# if __name__ == '__main__':
#     # You can keep this for your own testing if you like
#     parse_standard_excel("standardized_questions_filled.xlsx", "questions.json")