import os
import re

replacements = {
    r'#131314': '#0C0A09',
    r'#1e1f20': '#1C1917',
    r'#1a1a1c': '#1C1917',
    r'#282a2c': '#292524',
    r'#e3e3e3': '#FAFAF9',
    r'#b4b4b4': '#A8A29E',
    r'#3c4043': '#44403C',
    r'#8ab4f8': '#F59E0B', # amber-500 hex approx for inline use, or just replace with amber-500 where class allows? Actually let's use tailwind classes where possible, or just the hex. #f59e0b
    r'#f28b82': '#F43F5E', # rose-500 hex
    r'#4285f4': '#F59E0B', # gradient start
    r'#9b72cb': '#F43F5E', # gradient end
}

def process_file(path):
    with open(path, 'r') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements.items():
        new_content = re.sub(old, new, new_content, flags=re.IGNORECASE)
        
    if new_content != content:
        with open(path, 'w') as f:
            f.write(new_content)
        print(f"Updated {path}")

directories = ['app', 'components']
for d in directories:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.css')):
                process_file(os.path.join(root, file))

print("Done.")
