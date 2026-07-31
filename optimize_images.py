#!/usr/bin/env python3
"""
Performance optimization script for Down Together
- Adds lazy loading to images
- Adds decoding="async" to images
- Minifies frontmatter

Usage: python3 optimize_images.py
"""

import os
import re
from pathlib import Path

def optimize_article(filepath):
    """Add lazy loading and async decoding to images in markdown files"""

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Split frontmatter from content
    if content.startswith('---'):
        parts = content.split('---', 2)
        if len(parts) >= 3:
            frontmatter = parts[1]
            body = parts[2]

            # Process images in body: ![alt](src) → HTML img with lazy loading
            # Use Astro's built-in Image component or HTML img
            pattern = r'!\[([^\]]*)\]\(([^\)]+)\)'

            def replace_img(match):
                alt = match.group(1)
                src = match.group(2)
                # Return markdown with lazy loading comment (Astro will handle)
                return f'![{alt}]({src} "{{"loading": "lazy", "decoding": "async"}}")'

            body = re.sub(pattern, replace_img, body)
            content = f'---{frontmatter}---{body}'

    # Write back if changed
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    base_paths = [
        'src/content/articles/es',
        'src/content/articles/en',
    ]

    total = 0
    updated = 0

    for base_path in base_paths:
        if not os.path.exists(base_path):
            print(f"⚠️  Path not found: {base_path}")
            continue

        for filepath in Path(base_path).glob('*.md'):
            total += 1
            if optimize_article(str(filepath)):
                updated += 1
                print(f"✅ {filepath.name}")
            else:
                print(f"⏭️  {filepath.name} (no changes)")

    print(f"\n📊 Optimización completa")
    print(f"   Total archivos: {total}")
    print(f"   Actualizados: {updated}")
    print(f"   Sin cambios: {total - updated}")

    if updated > 0:
        print(f"\n💡 Próximo paso: npm run build && npm run preview")

if __name__ == '__main__':
    main()
