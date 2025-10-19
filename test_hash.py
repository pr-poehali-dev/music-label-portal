import bcrypt

password = "12345"
old_hash = "$2b$12$FJNPu53/hYpsDPpcyGTXKuRsxx4jdc5GrDvu.VnXLNPgXrs8fpFby"

result = bcrypt.checkpw(password.encode('utf-8'), old_hash.encode('utf-8'))
print(f"Password '12345' matches hash: {result}")

# Generate correct one
correct_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')
print(f"Correct hash for '12345': {correct_hash}")
test = bcrypt.checkpw(password.encode('utf-8'), correct_hash.encode('utf-8'))
print(f"New hash works: {test}")
