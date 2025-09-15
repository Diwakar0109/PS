import json
from pathlib import Path
from flask import Blueprint, jsonify
import random

# --- Flask Blueprint Setup ---
questions_bp = Blueprint('questions_api', __name__)

# --- Configuration ---
BASE_DIR = Path(__file__).parent.parent
QUESTIONS_BASE_PATH = BASE_DIR / "data" / "questions"
COURSE_CONFIG_PATH = BASE_DIR / "data" / "course_config.json"

# --- Routes ---

@questions_bp.route('/', methods=['GET'])
def get_all_subjects_and_levels():
    """
    GET all subjects and their levels from the central course_config.json file.
    """
    try:
        with open(COURSE_CONFIG_PATH, 'r', encoding='utf-8') as f:
            config = json.load(f)
        structure = {
            subject: details.get("levels", [])
            for subject, details in config.items()
        }
        return jsonify(structure), 200
    except Exception as e:
        print(f"Error fetching question structure: {e}")
        return jsonify({"message": "Failed to fetch question structure."}), 500


@questions_bp.route('/<string:subject>/<int:level>', methods=['GET'])
def get_questions_for_level(subject, level):
    """
    GET questions for a specific subject and level.
    - For ML subjects, it returns ONE random multi-part project.
    - For other subjects, it returns a random sample based on the question_limit.
    """
    level_dir = f"level{level}"
    questions_file_path = QUESTIONS_BASE_PATH / subject / level_dir / "questions.json"

    try:
        with open(questions_file_path, 'r', encoding='utf-8') as f:
            all_questions = json.load(f)

        if not all_questions:
            return jsonify([]), 200

        # --- Special handling for ML subjects ---
        if subject == 'ml':
            selected_question = random.choice(all_questions)
            print(f"Selected 1 random ML project ('{selected_question['id']}') for {subject}/{level_dir}.")
            return jsonify([selected_question]), 200
        
        # --- Standard logic for all other subjects ---
        else:
            with open(COURSE_CONFIG_PATH, 'r', encoding='utf-8') as f:
                config = json.load(f)
                limit = config.get(subject, {}).get('question_limit')

            if limit and len(all_questions) > limit:
                selected_questions = random.sample(all_questions, limit)
                print(f"Sampled {limit} of {len(all_questions)} questions for {subject}/{level_dir}.")
                return jsonify(selected_questions), 200
            else:
                print(f"Returning all {len(all_questions)} questions for {subject}/{level_dir}.")
                return jsonify(all_questions), 200

    except FileNotFoundError:
        return jsonify([]), 200
    except Exception as e:
        print(f"Error reading questions for {subject}/{level_dir}: {e}")
        return jsonify({"message": "An error occurred while fetching questions."}), 500


@questions_bp.route('/', methods=['POST'])
def add_new_question():
    data = request.get_json()
    if not data:
        return jsonify({"message": "Request must be JSON"}), 400

    subject = data.get('subject')
    level = data.get('level')
    new_question = data.get('newQuestion')

    if not all([subject, level, new_question, new_question.get('id')]):
        return jsonify({"message": "Subject, level, and question data with an ID are required."}), 400

    file_path = QUESTIONS_BASE_PATH / subject / f"level{level}" / "questions.json"

    try:
        file_path.parent.mkdir(parents=True, exist_ok=True)
        questions = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                questions = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            pass
        
        if any(q.get('id') == new_question.get('id') for q in questions):
            return jsonify({"message": f"Question with ID '{new_question['id']}' already exists."}), 409

        questions.append(new_question)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(questions, f, indent=2)

        return jsonify({"message": "Question added successfully."}), 201

    except Exception as e:
        print(f"Error uploading question: {e}")
        return jsonify({"message": "Failed to upload question."}), 500