import json
from pathlib import Path
from flask import Blueprint, jsonify, request
import os

# --- Flask Blueprint Setup ---
submissions_bp = Blueprint("submissions", __name__)

# --- Configuration ---
BASE_DIR = Path(__file__).parent.parent
# CORRECTED: Point to the correct 'submissions' directory
SUBMISSIONS_PATH = BASE_DIR / "data" / "submissions"
SUBMISSIONS_PATH.mkdir(parents=True, exist_ok=True)  # Ensure base folder exists

# --- Routes ---

@submissions_bp.route("/", methods=["GET"])
def get_aggregated_submissions():
    """
    GET all submissions, aggregated and grouped by subject and level.
    This is for the "Aggregate View" in the admin dashboard.
    """
    aggregated = {}
    if not SUBMISSIONS_PATH.exists():
        return jsonify({}), 200

    try:
        # CORRECTED: Loop through each JSON file directly in the 'submissions' folder
        for user_file in SUBMISSIONS_PATH.glob("*.json"):
            if not user_file.is_file():
                continue

            # CORRECTED: Get username from the filename (e.g., 'student1.json' -> 'student1')
            username = user_file.stem

            # Skip if file is empty
            if os.path.getsize(user_file) == 0:
                continue

            with open(user_file, "r", encoding="utf-8") as f:
                try:
                    user_submissions = json.load(f)
                except json.JSONDecodeError:
                    print(f"Warning: Skipping malformed JSON file for {username}")
                    continue

                # The rest of your aggregation logic is correct
                for sub in user_submissions:
                    subject = sub.get("subject")
                    level = sub.get("level")

                    if not subject or not level:
                        continue

                    subject_group = aggregated.setdefault(subject, {})
                    level_list = subject_group.setdefault(level, [])

                    level_list.append(
                        {
                            "username": username,
                            "status": sub.get("status", "unknown"),
                            "timestamp": sub.get("timestamp"),
                        }
                    )

        # Sort by latest timestamp
        for subject in aggregated:
            for level in aggregated[subject]:
                aggregated[subject][level].sort(
                    key=lambda s: s.get("timestamp", ""), reverse=True
                )

        return jsonify(aggregated)
    except Exception as e:
        print(f"Error fetching and aggregating submissions: {e}")
        return jsonify({"message": "Failed to fetch submissions."}), 500


@submissions_bp.route("/<string:username>", methods=["GET"])
def get_student_submissions(username):
    """
    GET all submissions for a specific student for the "Student View".
    """
    # CORRECTED: Build the path directly to the user's JSON file
    student_file_path = SUBMISSIONS_PATH / f"{username}.json"

    # If missing or empty, return a proper 404 error
    if not student_file_path.exists():
        return jsonify({"message": f"Submissions for user '{username}' not found."}), 404
        
    if os.path.getsize(student_file_path) == 0:
        return jsonify([]), 200

    try:
        with open(student_file_path, "r", encoding="utf-8") as f:
            submissions = json.load(f)
        return jsonify(submissions)

    except json.JSONDecodeError:
        print(f"Error: Malformed JSON in file for user {username}")
        return jsonify({"message": "Failed to parse student submission data."}), 500
    except Exception as e:
        print(f"Error fetching submissions for user {username}: {e}")
        return jsonify({"message": "Failed to fetch student submissions."}), 500

# NOTE: Your POST route for adding submissions is pointing to the wrong place too.
# Let's fix that as well to prevent future data from being saved incorrectly.

@submissions_bp.route("/", methods=["POST"])
def add_submission():
    """
    POST a new submission for a student.
    Saves submission data into data/submissions/<username>.json
    """
    data = request.get_json()
    username = data.get("username")

    if not username:
        return jsonify({"message": "Username required"}), 400

    # CORRECTED: We no longer need a separate student directory
    # The SUBMISSIONS_PATH already exists.
    student_file_path = SUBMISSIONS_PATH / f"{username}.json"
    submissions = []

    if student_file_path.exists() and os.path.getsize(student_file_path) > 0:
        with open(student_file_path, "r", encoding="utf-8") as f:
            try:
                submissions = json.load(f)
            except json.JSONDecodeError:
                print(f"Warning: Overwriting malformed JSON for user {username}")
                submissions = []

    submissions.append(
        {
            "subject": data.get("subject"),
            "level": data.get("level"),
            "status": data.get("status", "unknown"),
            "timestamp": data.get("timestamp"),
            # Include other potential fields from your POST data if necessary
        }
    )

    with open(student_file_path, "w", encoding="utf-8") as f:
        json.dump(submissions, f, indent=2)

    return jsonify({"message": "Submission saved"}), 201
