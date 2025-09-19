# backend/routes/admin.py

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

# --- PARSER LOGIC ---

def parse_ml_excel(input_file, output_file):
    """
    (This is your new, updated parser)
    Parses a standardized Excel/CSV file for multi-part ML questions.
    """
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
    
    print(f"✅ Successfully converted ML Excel file to {output_file}")
    return len(result)


def parse_ds_excel(input_file, output_file):
    """
    (This function is unchanged)
    Parses a standardized Excel file for DS questions with test cases.
    """
    df = pd.read_excel(input_file)
    result = []
    for q_id, group in df.groupby("id"):
        first_row = group.iloc[0]
        test_cases = []
        for _, row in group.iterrows():
            test_cases.append({
                "input": str(row["input"]),
                "output": str(row["output"])
            })
        result.append({
            "id": str(first_row["id"]),
            "title": str(first_row["title"]),
            "description": str(first_row["description"]),
            "test_cases": test_cases
        })
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)
    
    print(f"✅ Successfully converted DS Excel file to {output_file}")
    return len(result)

# --- Other helper functions (unchanged) ---
def _build_initial_progress():
    # ... (this function remains exactly the same)
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
    # ... (this function remains exactly the same)
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
    # This route's logic remains the same, it just calls the new ML parser now.
    if 'file' not in request.files: return jsonify({"message": "No file part"}), 400
    file = request.files['file']
    subject = request.form.get('subject')
    level = request.form.get('level')

    if not all([file, subject, level]) or file.filename == '':
        return jsonify({"message": "File, subject, and level are required."}), 400

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        input_file = temp_path / file.filename
        output_json_file = temp_path / "processed_questions.json"
        
        try:
            file.save(input_file)
            
            if subject == 'ml':
                print(f"Processing '{file.filename}' with the ML parser...")
                num_questions = parse_ml_excel(str(input_file), str(output_json_file))
            elif subject == 'ds':
                print(f"Processing '{file.filename}' with the DS parser...")
                num_questions = parse_ds_excel(str(input_file), str(output_json_file))
            else:
                return jsonify({"message": f"No parser available for subject: '{subject}'"}), 400

            with open(output_json_file, 'r', encoding='utf-8') as f:
                new_questions = json.load(f)
            
            level_dir_name = f"level{level}"
            final_json_path = QUESTIONS_BASE_PATH / subject / level_dir_name / "questions.json"
            final_json_path.parent.mkdir(parents=True, exist_ok=True)
            with open(final_json_path, 'w', encoding='utf-8') as f:
                json.dump(new_questions, f, indent=2)

            return jsonify({"message": f"Successfully processed and uploaded {num_questions} questions to {subject}/{level_dir_name}."}), 201

        except Exception as e:
            print(f"Error processing Excel file: {e}")
            return jsonify({"message": f"An error occurred during question upload: {str(e)}"}), 500


# --- Other routes (create-subject, add-level, upload-users) are unchanged ---
@admin_bp.route('/create-subject', methods=['POST'])
def create_subject():
    # ... (this function remains exactly the same)
    data = request.get_json()
    subject_name, num_levels = data.get('subjectName'), data.get('numLevels', 0)
    if not subject_name or not isinstance(num_levels, int) or num_levels < 1:
        return jsonify({"message": "Valid subject name and number of levels are required."}), 400
    try:
        with open(COURSE_CONFIG_PATH, 'r+', encoding='utf-8') as f:
            course_config = json.load(f)
            if subject_name in course_config:
                return jsonify({"message": f"Subject '{subject_name}' already exists."}), 409
            question_limits_per_level = {f"level{i}": 5 for i in range(1, num_levels + 1)}
            course_config[subject_name] = {
                "title": subject_name.replace("_", " ").title(), "isActive": True,
                "levels": [f"level{i}" for i in range(1, num_levels + 1)], "question_limit": question_limits_per_level
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
    # ... (this function remains exactly the same)
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
            if 'question_limit' in course_config[subject_name] and isinstance(course_config[subject_name]['question_limit'], dict):
                course_config[subject_name]['question_limit'][new_level_name] = 5 
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
    # ... (this function remains exactly the same)
    if 'file' not in request.files: return jsonify({"message": "No file part in the request"}), 400
    file = request.files['file']
    if file.filename == '': return jsonify({"message": "No file selected for uploading"}), 400
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