import os
import re

base_dir = r'c:\Users\IT\Downloads\vcard_qr_system\nextjs_space'
app_api_dir = os.path.join(base_dir, 'app', 'api')

pattern = re.compile(r"import \{ authOptions \} from '.*auth/\[\.\.\.nextauth\]/route';")
replacement = "import { authOptions } from '@/lib/auth';"

for root, dirs, files in os.walk(app_api_dir):
    for file in files:
        if file.endswith('.ts'):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = pattern.sub(replacement, content)
            
            if new_content != content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed: {file_path}")

# Also check lib/audit.ts
audit_path = os.path.join(base_dir, 'lib', 'audit.ts')
if os.path.exists(audit_path):
    with open(audit_path, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content = pattern.sub(replacement, content)
    if new_content != content:
        with open(audit_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed: {audit_path}")
