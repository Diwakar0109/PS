import json
from pathlib import Path
from flask import Blueprint, jsonify

# --- Flask Blueprint Setup ---
users_bp = Blueprint('users_bp', __name__)

# --- Configuration ---
BASE_DIR = Path(__file__).parent.parent
USERS_FILE_PATH = BASE_DIR / "data" / "users.json"

@users_bp.route('/', methods=['GET'])
def get_users():
    """
    Returns the list of all users, excluding their passwords.
    """
    try:
        with open(USERS_FILE_PATH, 'r', encoding='utf-8') as f:
            users_data = json.load(f)
        
        users_list = users_data.get("users", [])
        
        # --- Security: Never send password hashes to the frontend ---
        sanitized_users = []
        for user in users_list:
            user_copy = user.copy()
            user_copy.pop('password', None) # Remove password if it exists
            sanitized_users.append(user_copy)
            
        return jsonify(sanitized_users)
    except FileNotFoundError:
        return jsonify([]), 200 # Return empty list if no users file
    except Exception as e:
        print(f"Error fetching users: {e}")
        return jsonify({"message": "Failed to fetch users"}), 500