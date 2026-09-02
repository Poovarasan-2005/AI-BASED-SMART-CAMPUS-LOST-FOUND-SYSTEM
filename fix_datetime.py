import os
import re

# Files to fix
files_to_fix = [
    "backend/app/main.py",
    "backend/app/routes/auth_routes.py",
    "backend/app/routes/conversation_routes.py",
    "backend/app/routes/found_routes.py",
    "backend/app/routes/lost_routes.py",
    "backend/app/routes/recovery_routes.py",
    "backend/app/routes/verification_routes.py",
    "backend/app/security/audit.py",
    "backend/app/security/auth.py",
    "backend/app/security/otp.py",
    "backend/app/services/email/email_service.py",
    "backend/app/services/recovery/handover_service.py",
    "backend/app/services/sms/sms_provider.py",
    "seed_demo.py"
]

def fix_file(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    modified = False
    new_lines = []
    imports_fixed = False
    needs_import = False
    
    for line in lines:
        # Check if we need to add UTC import
        if 'from datetime import' in line and 'UTC' not in line and ('utcnow' not in line):
            # We'll check later if we actually need to add it
            needs_import = True
        
        # Replace datetime.utcnow() patterns
        if 'utcnow()' in line:
            new_line = line.replace('datetime.datetime.utcnow()', 'datetime.datetime.now(datetime.UTC)')
            new_line = new_line.replace('datetime.utcnow()', 'datetime.now(datetime.UTC)')
            if new_line != line:
                new_lines.append(new_line)
                modified = True
                needs_import = True
                continue
        
        new_lines.append(line)
    
    # If we need UTC import and it's not already there, add it
    if needs_import and 'from datetime import' in ''.join(new_lines):
        final_lines = []
        for i, line in enumerate(new_lines):
            if 'from datetime import' in line and 'UTC' not in line:
                # Add UTC to the import
                line = line.rstrip('\n')
                if line.endswith(')'):
                    line = line[:-1] + ', UTC)'
                else:
                    line = line.rstrip() + ', UTC'
                final_lines.append(line + '\n')
                imports_fixed = True
            else:
                final_lines.append(line)
        new_lines = final_lines
    
    if modified or imports_fixed:
        with open(filepath, 'w') as f:
            f.writelines(new_lines)
        print(f"Fixed: {filepath}")
    else:
        print(f"No changes needed: {filepath}")

for filepath in files_to_fix:
    fix_file(filepath)

print("Done!")
