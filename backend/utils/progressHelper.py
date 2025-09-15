# backend/utils/progress_helper.py
import os
from pathlib import Path

# Base path for questions folder
QUESTIONS_BASE_PATH = Path(__file__).resolve().parent.parent / "data" / "questions"


def build_initial_progress():
    """
    Scans the entire /data/questions directory and builds a complete
    level-based progress object. Level 1 is unlocked, others are locked.
    :return: dict representing initial progress object
    """
    initial_progress = {}

    try:
        # Loop through subjects (directories inside questions/)
        for subject in os.listdir(QUESTIONS_BASE_PATH):
            subject_path = QUESTIONS_BASE_PATH / subject
            if subject_path.is_dir():
                initial_progress[subject] = {}

                # List and sort levels numerically
                levels = [
                    lvl
                    for lvl in os.listdir(subject_path)
                    if lvl.startswith("level")
                ]
                sorted_levels = sorted(
                    levels, key=lambda x: int(x.replace("level", ""))
                )

                # Mark level1 unlocked, others locked
                for i, level in enumerate(sorted_levels):
                    initial_progress[subject][level] = "unlocked" if i == 0 else "locked"

    except Exception as e:
        print("Error building initial progress:", e)

    return initial_progress
