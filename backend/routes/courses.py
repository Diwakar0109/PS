import json
from pathlib import Path
from flask import Blueprint, jsonify

# --- Flask Blueprint Setup ---
courses_bp = Blueprint("courses", __name__)

# --- Configuration ---
BASE_DIR = Path(__file__).parent.parent
COURSE_CONFIG_PATH = BASE_DIR / "data" / "course_config.json"


@courses_bp.route("/", methods=["GET"])
def get_all_courses():
    """
    Reads the central course configuration from the JSON file and returns it.
    This ensures the data is always fresh on every API call.
    """
    try:
        with open(COURSE_CONFIG_PATH, 'r', encoding='utf-8') as f:
            courses_data = json.load(f)
        return jsonify(courses_data)
    except FileNotFoundError:
        return jsonify({"message": "Course configuration file not found."}), 404
    except Exception as e:
        print(f"Error reading course config: {e}")
        return jsonify({"message": "Server error reading course configuration."}), 500