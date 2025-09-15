# backend/routes/evaluate.py

import json
import time
from pathlib import Path
from datetime import datetime
from flask import Blueprint, request, jsonify
from typing import Dict, Tuple
from jupyter_client.manager import KernelManager, KernelClient
from queue import Empty
import pandas as pd
import numpy as np
import re

evaluation_bp = Blueprint('evaluation_api', __name__)

QUESTIONS_BASE_PATH = Path(__file__).parent.parent / "data" / "questions"
SUBMISSIONS_PATH = Path(__file__).parent.parent / "data" / "submissions"
USERS_FILE_PATH = Path(__file__).parent.parent / "data" / "users.json"
USER_GENERATED_PATH = Path(__file__).parent.parent / "data" / "user_generated"
USER_KERNELS: Dict[str, Tuple[KernelManager, KernelClient]] = {}

# --- HELPER FUNCTIONS ---
def extract_and_compare_value(student_output: str, label: str, expected_value: float, tolerance: float) -> Tuple[bool, str]:
    try:
        pattern = re.compile(re.escape(label) + r'\s*(-?[\d\.]+)')
        match = pattern.search(student_output)
        if not match: return False, f"Failed. The required label '{label}' was not found in the output."
        extracted_string = match.group(1)
        extracted_value = float(extracted_string)
        if abs(extracted_value - expected_value) <= tolerance: return True, f"Passed. Found value {extracted_value:.4f} is within tolerance."
        else: return False, f"Failed. Found value {extracted_value:.4f}, expected around {expected_value}."
    except ValueError: return False, f"Failed. Found label '{label}', but could not parse '{extracted_string}' as a number."
    except Exception as e: return False, f"An unexpected error occurred during numerical parsing: {e}"

def check_keywords_in_text(student_output: str, keywords_str: str, threshold: float = 0.8) -> Tuple[bool, str]:
    student_output_lower = student_output.lower()
    keywords = [kw.strip().lower() for kw in keywords_str.split() if kw.strip()]
    if not keywords: return True, "No keywords specified."
    matched_count = sum(1 for kw in keywords if kw in student_output_lower)
    match_ratio = matched_count / len(keywords)
    if match_ratio >= threshold: return True, f"Passed ({match_ratio:.0%})"
    else:
        missing = [kw for kw in keywords if kw not in student_output_lower]
        return False, f"Failed. Missing keywords: {missing}"

def compare_csvs(student_path: Path, solution_path: Path, key_columns=None, threshold: float = 0.9) -> Tuple[bool, float]:
    try:
        if not student_path.exists(): return False, 0.0
        if not solution_path.exists(): print(f"ERROR: Solution file missing at {solution_path}"); return False, 0.0
        df_student = pd.read_csv(student_path)
        df_solution = pd.read_csv(solution_path)
        if key_columns and len(key_columns) == 2:
            merge_key, compare_col = key_columns
            if merge_key not in df_student.columns or merge_key not in df_solution.columns: return False, 0.0
            if compare_col not in df_student.columns or compare_col not in df_solution.columns: return False, 0.0
            df_student[merge_key] = df_student[merge_key].astype(df_solution[merge_key].dtype)
            merged = pd.merge(df_student, df_solution, on=merge_key, suffixes=('_student', '_solution'))
            col_student, col_solution = merged[f'{compare_col}_student'], merged[f'{compare_col}_solution']
            matches = np.isclose(col_student, col_solution).sum()
            similarity_score = (matches / len(col_solution)) if len(col_solution) > 0 else 1.0
        else:
            similarity_score = 1.0 if df_student.equals(df_solution) else 0.0
        return similarity_score >= threshold, similarity_score
    except Exception as e:
        print(f"ERROR during CSV comparison: {e}"); return False, 0.0

def run_code_on_kernel(kc: KernelClient, code: str, user_input: str = "", timeout: int = 45) -> Tuple[str, str]:
    full_script = f"""
import builtins
_input_lines = {json.dumps(user_input)}.splitlines()
_input_lines.reverse()
def _mock_input(prompt=''):
    try: return _input_lines.pop()
    except IndexError: return ''
builtins.input = _mock_input
{code}
"""
    msg_id = kc.execute(full_script); stdout, stderr = [], []; start_time = time.monotonic()
    while time.monotonic() - start_time < timeout:
        try:
            msg = kc.get_iopub_msg(timeout=1)
            if msg.get('parent_header', {}).get('msg_id') != msg_id: continue
            msg_type = msg['header']['msg_type']
            content = msg.get('content', {})
            if msg_type == 'stream':
                if content['name'] == 'stdout': stdout.append(content['text'])
                else: stderr.append(content['text'])
            elif msg_type == 'error': stderr.append('\\n'.join(content.get('traceback', [])))
            elif msg_type == 'status' and content.get('execution_state') == 'idle': break
        except Empty: pass
    else: stderr.append(f"\\n[Kernel Timeout] Execution exceeded {timeout} seconds.")
    return "".join(stdout).strip(), "".join(stderr).strip()

# --- ROUTES ---
@evaluation_bp.route('/session/start', methods=['POST'])
def start_session():
    data = request.get_json(); session_id = data.get('sessionId')
    if not session_id: return jsonify({'error': 'sessionId is required.'}), 400
    if session_id in USER_KERNELS: return jsonify({'message': f'Session {session_id} already exists.'})
    try:
        km = KernelManager(); km.start_kernel()
        kc = km.client(); kc.start_channels(); kc.wait_for_ready(timeout=60)
        USER_KERNELS[session_id] = (km, kc)
        return jsonify({'message': f'Session {session_id} started successfully.'})
    except Exception as e:
        if 'km' in locals() and km.is_alive(): km.shutdown_kernel()
        return jsonify({'error': 'The code execution engine failed to start.', 'details': str(e)}), 500

@evaluation_bp.route('/validate', methods=['POST'])
def validate_cell():
    data = request.get_json()
    session_id, subject, level, q_id, p_id, code = data.get('sessionId'), data.get('subject'), data.get('level'), data.get('questionId'), data.get('partId'), data.get('cellCode')

    if not all([session_id, subject, level, q_id, code]): return jsonify({'error': 'Missing required fields'}), 400
    if not code.strip(): return jsonify({'error': 'Code cannot be empty.'}), 400
    if session_id not in USER_KERNELS: return jsonify({'error': 'User session not found.'}), 404
    
    _km, kc = USER_KERNELS[session_id]

    try:
        # --- THIS IS THE CORRECTED LINE ---
        # It now uses the universal nested path for ALL subjects, fixing the crash.
        q_path = QUESTIONS_BASE_PATH / subject / f"level{level}" / "questions.json"

        with open(q_path, 'r', encoding='utf-8') as f: all_q = json.load(f)
        q_data = next((q for q in all_q if q['id'] == q_id), None)
        if not q_data: return jsonify({'error': f'Question with ID {q_id} not found.'}), 404
        part_data = next((p for p in q_data.get('parts', []) if p['part_id'] == p_id), q_data) if p_id else q_data
    except FileNotFoundError: return jsonify({'error': f"Question file not found at path: {q_path}"}), 500
    except Exception as e: return jsonify({'error': f'Could not load question data: {str(e)}'}), 500

    test_results = []
    
    if subject == 'ds':
        print(f"--- Starting DS Validation for Question: {q_id} ---")
        test_cases = q_data.get("test_cases", [])
        if not test_cases: return jsonify({'error': f'No test cases found for question {q_id}.'}), 500
        for i, case in enumerate(test_cases):
            user_input = case.get("input", "")
            expected_output = case.get("output", "")
            stdout, stderr = run_code_on_kernel(kc, code, user_input=user_input)
            if stderr:
                print(f"  - Test Case {i+1} FAILED (Code Error): {stderr}")
                test_results.append(False)
                continue
            passed = stdout.strip() == expected_output.strip()
            if passed: print(f"  - Test Case {i+1} PASSED")
            else: print(f"  - Test Case {i+1} FAILED. Expected: '{expected_output}', Got: '{stdout}'")
            test_results.append(passed)

    elif subject == 'ml':
        task_type = part_data.get("type")
        try:
            if task_type == "csv_similarity":
                print(f"--- Starting ML (CSV) Validation for Part: {p_id} ---")
                placeholder, solution_path = part_data['placeholder_filename'], Path(part_data['solution_file'])
                username = data.get("username", "default_student")
                student_dir = USER_GENERATED_PATH / username
                student_dir.mkdir(parents=True, exist_ok=True)
                student_path = student_dir / "submission.csv"
                modified_code = code.replace(f"'{placeholder}'", f"r'{student_path.as_posix()}'").replace(f"\"{placeholder}\"", f"r'{student_path.as_posix()}'")
                _stdout, stderr = run_code_on_kernel(kc, modified_code)
                if stderr: test_results.append(False)
                else:
                    passed, score = compare_csvs(student_path, solution_path, part_data.get('key_columns'), part_data.get('similarity_threshold', 0.9))
                    test_results.append(passed)
            elif task_type == "text_similarity":
                print(f"--- Starting ML (Text) Validation for Part: {p_id} ---")
                stdout, stderr = run_code_on_kernel(kc, code)
                if stderr: test_results.append(False)
                else:
                    passed, reason = check_keywords_in_text(stdout, part_data.get("expected_text", ""), part_data.get('similarity_threshold', 0.8))
                    test_results.append(passed)
            elif task_type == "numerical_evaluation":
                print(f"--- Starting ML (Numerical) Validation for Part: {p_id} ---")
                stdout, stderr = run_code_on_kernel(kc, code)
                if stderr: test_results.append(False)
                else:
                    passed, reason = extract_and_compare_value(stdout, part_data.get("evaluation_label"), float(part_data.get("expected_value")), float(part_data.get("tolerance")))
                    test_results.append(passed)
            else:
                print(f"Warning: Part '{p_id}' has unhandled type '{task_type}'. Defaulting to pass."); test_results.append(True)
        except Exception as e:
            print(f"CRITICAL ML VALIDATION ERROR: {e}"); test_results.append(False)
    
    else:
        return jsonify({'error': f"No validation logic defined for subject: '{subject}'"}), 400

    return jsonify({"test_results": test_results})

@evaluation_bp.route('/run', methods=['POST'])
def run_cell():
    data = request.get_json()
    session_id, student_code, user_input = data.get('sessionId'), data.get('cellCode', 'pass'), data.get('userInput', '')
    if not session_id or session_id not in USER_KERNELS: return jsonify({'error': 'User session not found or invalid.'}), 404
    if not student_code.strip(): return jsonify({'stdout': '', 'stderr': 'Cannot run empty code.'}), 400
    _km, kc = USER_KERNELS[session_id]
    try:
        stdout, stderr = run_code_on_kernel(kc, student_code, user_input=user_input)
        return jsonify({'stdout': stdout, 'stderr': stderr})
    except Exception as e: return jsonify({'stdout': '', 'stderr': str(e)}), 500

@evaluation_bp.route('/submit', methods=['POST'])
def submit_answers():
    data = request.get_json()
    session_id, username, subject, level = data.get('sessionId'), data.get('username'), data.get('subject'), data.get('level')
    answers = data.get('answers', [])
    all_passed = all(ans.get('passed', False) for ans in answers) if answers else False
    status = 'passed' if all_passed else 'failed'
    submission = { 'subject': subject, 'level': f"level{level}", 'status': status, 'timestamp': datetime.now().isoformat(), 'answers': answers }
    user_submission_file = SUBMISSIONS_PATH / f"{username}.json"
    try:
        with open(user_submission_file, 'r+', encoding='utf-8') as f:
            user_submissions = json.load(f); user_submissions.append(submission); f.seek(0); json.dump(user_submissions, f, indent=2)
    except (FileNotFoundError, json.JSONDecodeError):
        with open(user_submission_file, 'w', encoding='utf-8') as f: json.dump([submission], f, indent=2)
    updated_user = None
    if all_passed:
        with open(USERS_FILE_PATH, 'r+', encoding='utf-8') as f:
            users_json = json.load(f)
            user = next((u for u in users_json['users'] if u['username'] == username), None)
            if user:
                if subject not in user['progress']: user['progress'][subject] = {}
                user['progress'][subject][f"level{level}"] = 'completed'
                next_level = f"level{int(level) + 1}"
                if user['progress'][subject].get(next_level) == 'locked': user['progress'][subject][next_level] = 'unlocked'
                updated_user = {k: v for k, v in user.items() if k != 'password'}
            f.seek(0); json.dump(users_json, f, indent=2); f.truncate()
    if session_id in USER_KERNELS:
        km, kc = USER_KERNELS.pop(session_id)
        if kc.is_alive(): kc.stop_channels()
        if km.is_alive(): km.shutdown_kernel()
    return jsonify({'success': True, 'message': "Submission received.", 'updatedUser': updated_user})