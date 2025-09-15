import json
import bcrypt
from pathlib import Path
from flask import Blueprint, request, jsonify

# --- Flask Blueprint Setup ---
auth_bp = Blueprint('auth_api', __name__)

# --- Configuration ---
BASE_DIR = Path(__file__).parent.parent
USERS_FILE_PATH = BASE_DIR / "data" / "users.json"

# --- Routes ---

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticates a user and ensures their progress data is synchronized
    (e.g., level 1 of assigned courses is unlocked).
    """
    data = request.get_json()
    if not data:
        return jsonify({"message": "Request must be JSON"}), 400
        
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required.'}), 400

    try:
        with open(USERS_FILE_PATH, 'r', encoding='utf-8') as f:
            users_data = json.load(f)
        
        users_list = users_data.get("users", [])
        user = next((u for u in users_list if u['username'] == username), None)

        if not user:
            return jsonify({'message': 'Invalid credentials.'}), 401
        
        is_match = bcrypt.checkpw(
            password.encode('utf-8'), 
            user['password'].encode('utf-8')
        )

        if not is_match:
            return jsonify({'message': 'Invalid credentials.'}), 401

        # --- NEW LOGIC: Synchronize User Progress ---
        # This section will "self-heal" the user's progress data on every successful login.
        progress_was_updated = False
        if "progress" in user and isinstance(user["progress"], dict):
            for subject, levels in user["progress"].items():
                # Check if level1 exists and is not already completed
                if "level1" not in levels or levels.get("level1") == "locked":
                    # If level1 is missing or locked, unlock it.
                    print(f"Auto-unlocking level 1 for user '{username}' in subject '{subject}'.")
                    user["progress"][subject]["level1"] = "unlocked"
                    progress_was_updated = True
        
        # If we made any changes, we must save them back to the users.json file.
        if progress_was_updated:
            # Find the user's index to update the correct entry in the list
            user_index = next((i for i, u in enumerate(users_list) if u['username'] == username), None)
            if user_index is not None:
                users_list[user_index] = user
                users_data["users"] = users_list
                with open(USERS_FILE_PATH, 'w', encoding='utf-8') as f:
                    json.dump(users_data, f, indent=2)
                print(f"Saved updated progress for user '{username}' to users.json.")
        # --- END OF NEW LOGIC ---

        # Prepare the user object to send back (with updated progress).
        user_to_return = user.copy()
        del user_to_return['password']
        
        return jsonify({'message': 'Login successful!', 'user': user_to_return}), 200

    except FileNotFoundError:
        print(f"Error: The users file was not found at {USERS_FILE_PATH}")
        return jsonify({'message': 'Server configuration error.'}), 500
    except Exception as e:
        print(f'Login error: {e}')
        return jsonify({'message': 'Server error during login.'}), 500