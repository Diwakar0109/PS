# backend/hash_password.py
import bcrypt

salt_rounds = 10
plain_password = "password123"  # The password for your users

try:
    # Generate salt and hash the password
    hashed_password = bcrypt.hashpw(
        plain_password.encode("utf-8"),
        bcrypt.gensalt(salt_rounds)
    )

    print("Hashed Password:", hashed_password.decode("utf-8"))

except Exception as e:
    print("Error hashing password:", e)
