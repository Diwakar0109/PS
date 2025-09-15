import json
from pathlib import Path
from flask import Blueprint, request, jsonify
import bcrypt
import io
import csv
import pandas as pd
import tempfile

# --- Flask Blueprint Setup ---
admin_bp = Blueprint('admin_api', __name__)

# --- Configuration ---
BASE_DIR = Path(__file__).parent.parent
USERS_FILE_PATH = BASE_DIR / "data" / "users.json"
QUESTIONS_BASE_PATH = BASE_DIR / "data" / "questions"
COURSE_CONFIG_PATH = BASE_DIR / "data" / "course_config.json"

# --- PARSER LOGIC (MOVED DIRECTLY INTO THIS FILE) ---

def process_regression_data(input_file, output_file):
    """
    (Your custom ML parser). Reads a 'Regression.xlsx' file, processes questions and parts,
    and generates a 'final_tasks.json' file.
    """
    try:
        df = pd.read_excel(input_file, header=None, dtype=object)
    except FileNotFoundError:
        print(f"Error: The input file '{input_file}' was not found.")
        raise
    
    questions_headers = [
        "Qno", "Project ID", "Title", "Description", "Dataset Paths",
        "Parts", "Expected Outputs", "Validation Method", "Solution File"
    ]
    extracted_questions = []
    qno = 1
    for i in range(len(df)):
        if str(df.iloc[i, 0]).strip() == "Project ID":
            j = i + 1
            while j < len(df) and pd.notna(df.iloc[j, 0]) and str(df.iloc[j, 0]).strip() != "":
                cleaned_row = [str(cell).strip() if pd.notna(cell) else "" for cell in df.iloc[j].tolist()]
                extracted_questions.append([qno] + cleaned_row)
                j += 1
            qno += 1
    if not extracted_questions:
        raise ValueError("No questions found with 'Project ID' headers.")
    questions_df = pd.DataFrame(extracted_questions, columns=questions_headers[:len(extracted_questions[0])])

    parts_headers = [
        "Qno", "Part ID", "Title", "Task Description", "Expected Output",
        "Validation Method", "Similarity Threshold", "Dataset Reference"
    ]
    extracted_parts = []
    qno = 1
    for i in range(len(df)):
        if str(df.iloc[i, 0]).strip() == "Part ID":
            j = i + 1
            while j < len(df) and pd.notna(df.iloc[j, 0]) and str(df.iloc[j, 0]).strip() != "":
                cleaned_row = [str(cell).strip() if pd.notna(cell) else "" for cell in df.iloc[j].tolist()]
                while len(cleaned_row) < len(parts_headers) - 1: cleaned_row.append("")
                extracted_parts.append([qno] + cleaned_row[:len(parts_headers) - 1])
                j += 1
            qno += 1
    if not extracted_parts:
        raise ValueError("No parts found with 'Part ID' headers.")
    parts_df = pd.DataFrame(extracted_parts, columns=parts_headers)
    
    validation_map = {"Text similarity": "text_similarity", "Code execution": "code_execution", "CSV similarity": "csv_similarity", "Regression evaluation": "regression_evaluation", "Numerical prediction": "numerical_prediction"}
    output_json = []
    for _, qrow in questions_df.iterrows():
        qno, project_id, title, description, dataset_url, solution_file = \
            qrow["Qno"], qrow["Project ID"], qrow["Title"], qrow["Description"], \
            qrow["Dataset Paths"], qrow["Solution File"]
        
        dataset_filename = Path(dataset_url).name.split('?')[0] if dataset_url and 'http' in dataset_url else ""
        final_dataset_path = f"data/datasets/ml/{dataset_filename}" if dataset_filename else ""

        parts_subset = parts_df[parts_df["Qno"] == qno]
        parts_list = []
        for _, prow in parts_subset.iterrows():
            part_id = prow["Part ID"].lower().replace(" ", "_").replace("&", "and")
            try:
                similarity_threshold = float(prow["Similarity Threshold"])
            except (ValueError, TypeError):
                similarity_threshold = 0.9
            
            vtype = validation_map.get(prow["Validation Method"], "text_similarity")
            part_entry = {"part_id": part_id, "type": vtype, "description": prow["Task Description"]}
            
            if vtype == "csv_similarity":
                part_entry.update({
                    "student_file": "submission.csv", "placeholder_filename": "submission.csv",
                    "solution_file": solution_file, "test_file": final_dataset_path, 
                    "key_columns": ["Id", "SalePrice"], "similarity_threshold": similarity_threshold
                })
            else:
                part_entry["expected_text"] = prow["Expected Output"]
                part_entry["similarity_threshold"] = similarity_threshold
            parts_list.append(part_entry)

        project_entry = {
            "id": f"{project_id.lower().replace(' ', '_')}_full_task_v1", "title": f"Linear Regression: {title}",
            "description": description, "dataset_source_url": dataset_url,
            "dataset_path": final_dataset_path, "parts": parts_list
        }
        output_json.append(project_entry)

    with open(output_file, "w") as f:
        json.dump(output_json, f, indent=2)
    print(f"✅ JSON file created with corrected dataset paths: {output_file}")


def parse_standard_excel(excel_path, output_path):
    """
    (Your standard parser). Reads a standardized Excel file, processes questions and parts,
    and generates a questions.json file.
    """
    try:
        df = pd.read_excel(excel_path)
        df = df.fillna("")
    except FileNotFoundError:
        raise ValueError(f"Error: The input file '{excel_path}' was not found.")
    
    tasks = []
    for qid, group in df.groupby("id"):
        group = group.reset_index(drop=True)
        description = group["description"].iloc[0]
        title = group["title"].iloc[0]
        parts = []
        for _, row in group.iterrows():
            if not row["part_id"]: continue
            part = { "part_id": row["part_id"], "type": row["part_type"], "description": row["part_description"] }
            if row["expected_text"]: part["expected_text"] = row["expected_text"]
            if row["similarity_threshold"]: part["similarity_threshold"] = float(row["similarity_threshold"])
            if row["train_file"]: part["train_file"] = row["train_file"]
            if row["test_file"]: part["test_file"] = row["test_file"]
            if row["student_file"]: part["student_file"] = row["student_file"]
            if row["placeholder_filename"]: part["placeholder_filename"] = row["placeholder_filename"]
            if row["solution_file"]: part["solution_file"] = row["solution_file"]
            if row["key_columns"]: part["key_columns"] = [k.strip() for k in row["key_columns"].split("|")]
            parts.append(part)
        task = { "id": qid, "title": title, "description": description }
        if parts: task["parts"] = parts
        tasks.append(task)
    
    with open(output_path, "w") as f:
        json.dump(tasks, f, indent=2)
    print(f"✅ Standardized JSON saved to {output_path}")


# --- Other helper functions ---
def _build_initial_progress():
    progress = {}
    if not QUESTIONS_BASE_PATH.exists(): return progress
    for subject_path in QUESTIONS_BASE_PATH.iterdir():
        if subject_path.is_dir():
            subject_name = subject_path.name
            levels = [p.name for p in subject_path.iterdir() if p.is_dir() and p.name.startswith('level')]
            if levels:
                progress[subject_name] = {}
                levels.sort(key=lambda name: int(name.replace('level', '')))
                for i, level_name in enumerate(levels):
                    progress[subject_name][level_name] = "unlocked" if i == 0 else "locked"
    return progress

def _update_all_users_with_new_subject(subject_name, num_levels):
    try:
        with open(USERS_FILE_PATH, 'r+', encoding='utf-8') as f:
            users_data = json.load(f)
            users_list = users_data.get("users", [])
            for user in users_list:
                if 'progress' not in user: user['progress'] = {}
                if subject_name not in user['progress']:
                    user['progress'][subject_name] = { f"level{i}": "unlocked" if i == 1 else "locked" for i in range(1, num_levels + 1) }
            f.seek(0)
            json.dump(users_data, f, indent=2)
            f.truncate()
        return True
    except Exception as e:
        print(f"Error updating users with new subject: {e}")
        return False

# --- Admin Routes ---
@admin_bp.route('/upload-questions', methods=['POST'])
def upload_questions_excel():
    if 'file' not in request.files: return jsonify({"message": "No file part"}), 400
    file, subject, level = request.files['file'], request.form.get('subject'), request.form.get('level')
    if not all([file, subject, level]) or file.filename == '':
        return jsonify({"message": "File, subject, and level are required."}), 400

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        input_excel_file, output_json_file = temp_path / file.filename, temp_path / "processed_questions.json"
        
        try:
            file.save(input_excel_file)
            
            if subject == 'ml':
                print(f"Processing Excel file with CUSTOM ML parser...")
                process_regression_data(str(input_excel_file), str(output_json_file))
            else:
                print(f"Processing Excel file with STANDARD parser...")
                parse_standard_excel(str(input_excel_file), str(output_json_file))

            with open(output_json_file, 'r', encoding='utf-8') as f:
                new_questions = json.load(f)
            
            level_dir_name = f"level{level}"
            q_file_path = QUESTIONS_BASE_PATH / subject / level_dir_name / "questions.json"
            q_file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(q_file_path, 'w', encoding='utf-8') as f:
                json.dump(new_questions, f, indent=2)

            return jsonify({"message": f"Successfully processed and uploaded {len(new_questions)} questions to {subject}/{level_dir_name}."}), 201

        except Exception as e:
            print(f"Error processing Excel file with script: {e}")
            return jsonify({"message": f"An error occurred during question upload: {str(e)}"}), 500


# Other routes (create-subject, add-level, upload-users) are unchanged
@admin_bp.route('/create-subject', methods=['POST'])
def create_subject():
    data = request.get_json()
    subject_name, num_levels = data.get('subjectName'), data.get('numLevels', 0)
    if not subject_name or not isinstance(num_levels, int) or num_levels < 1:
        return jsonify({"message": "Valid subject name and number of levels are required."}), 400
    try:
        with open(COURSE_CONFIG_PATH, 'r+', encoding='utf-8') as f:
            course_config = json.load(f)
            if subject_name in course_config:
                return jsonify({"message": f"Subject '{subject_name}' already exists."}), 409
            course_config[subject_name] = {
                "title": subject_name.replace("_", " ").title(), "isActive": True,
                "levels": [f"level{i}" for i in range(1, num_levels + 1)], "question_limit": 5
            }
            f.seek(0)
            json.dump(course_config, f, indent=2)
            f.truncate()
        for i in range(1, num_levels + 1):
            level_path = QUESTIONS_BASE_PATH / subject_name / f"level{i}"
            level_path.mkdir(parents=True, exist_ok=True)
            (level_path / "questions.json").write_text("[]", encoding="utf-8")
        if not _update_all_users_with_new_subject(subject_name, num_levels):
            raise Exception("Failed to update users file.")
        return jsonify({"message": f"Subject '{subject_name}' created successfully."}), 201
    except Exception as e:
        print(f"Error creating subject: {e}")
        return jsonify({"message": f"Failed to create subject: {str(e)}"}), 500

@admin_bp.route('/add-level', methods=['POST'])
def add_level_to_subject():
    subject_name = request.get_json().get('subjectName')
    if not subject_name:
        return jsonify({"message": "Subject name is required."}), 400
    try:
        with open(COURSE_CONFIG_PATH, 'r+', encoding='utf-8') as f:
            course_config = json.load(f)
            if subject_name not in course_config:
                return jsonify({"message": f"Subject '{subject_name}' not found."}), 404
            existing_levels = course_config[subject_name].get("levels", [])
            new_level_name = f"level{len(existing_levels) + 1}"
            course_config[subject_name]["levels"].append(new_level_name)
            f.seek(0)
            json.dump(course_config, f, indent=2)
            f.truncate()
        level_path = QUESTIONS_BASE_PATH / subject_name / new_level_name
        level_path.mkdir(parents=True, exist_ok=True)
        (level_path / "questions.json").write_text("[]", encoding="utf-8")
        with open(USERS_FILE_PATH, 'r+', encoding='utf-8') as f:
            users_data = json.load(f)
            for user in users_data.get("users", []):
                if user.get("role") == "student" and subject_name in user.get("progress", {}):
                    user["progress"][subject_name][new_level_name] = "locked"
            f.seek(0)
            json.dump(users_data, f, indent=2)
            f.truncate()
        return jsonify({"message": f"Successfully added {new_level_name} to {subject_name}."}), 201
    except Exception as e:
        print(f"Error adding new level: {e}")
        return jsonify({"message": f"Failed to add level: {str(e)}"}), 500

@admin_bp.route('/upload-users', methods=['POST'])
def upload_users():
    if 'file' not in request.files:
        return jsonify({"message": "No file part in the request"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"message": "No file selected for uploading"}), 400
    try:
        with open(USERS_FILE_PATH, 'r+', encoding='utf-8') as f:
            users_json, created_count, skipped_count = json.load(f), 0, 0
            existing_usernames = {u['username'] for u in users_json.get("users", [])}
            stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
            csv_reader = csv.DictReader(stream)
            for row in csv_reader:
                username, password, role = row.get('username'), row.get('password'), row.get('role', 'student')
                if not username or not password or username in existing_usernames:
                    skipped_count += 1
                    continue
                hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
                new_user = {"username": username, "password": hashed.decode('utf-8'), "role": role,
                            "progress": _build_initial_progress() if role == 'student' else {}}
                users_json["users"].append(new_user)
                existing_usernames.add(username)
                created_count += 1
            f.seek(0)
            json.dump(users_json, f, indent=2)
            f.truncate()
        return jsonify({"message": f"Upload complete. Created {created_count} new users. Skipped {skipped_count}."}), 201
    except Exception as e:
        print(f"Error during user upload: {e}")
        return jsonify({"message": f"An error occurred during user upload: {e}"}), 500