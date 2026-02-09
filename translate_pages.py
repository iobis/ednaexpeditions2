#!/usr/bin/env python3
import os
import re
import sys
import argparse
from pathlib import Path
from typing import Tuple
import deepl


LANGUAGES = {
    'fr': 'FR',
    'es': 'ES'
}

FILES_TO_TRANSLATE = [
    'index.html',
    'contact.html',
    'whoweare.html',
    'jointheproject.html',
    'newsletter_sub.html',
    'resources/index.html',
    'resources/data-policy.html',
    'resources/consent-form.html',
    'resources/biobanking-agreement.html',
]


def extract_front_matter(content: str) -> Tuple[str, str, str]:
    """Extract Jekyll front matter from content."""
    front_matter_pattern = r'^---\s*\n(.*?)\n---\s*\n(.*)$'
    match = re.match(front_matter_pattern, content, re.DOTALL)
    
    if match:
        front_matter = match.group(1)
        body = match.group(2)
        return front_matter, body, '---\n' + front_matter + '\n---\n'
    return '', content, ''


def translate_html_content(translator: deepl.Translator, html: str, target_lang: str) -> str:
    """Translate HTML content using DeepL API."""
    try:
        result = translator.translate_text(
            html,
            source_lang="EN",
            target_lang=target_lang,
            tag_handling="html",
            preserve_formatting=True
        )
        return str(result)
    except Exception as e:
        print(f"Error translating: {e}")
        return html


def translate_file(translator: deepl.Translator, source_path: Path, target_path: Path, target_lang: str, dry_run: bool = False):
    """Translate a single HTML file."""
    print(f"\nTranslating: {source_path} -> {target_path} ({target_lang})")
    
    if not source_path.exists():
        print(f"  ⚠️  Source file not found: {source_path}")
        return False
    
    # Read source file
    with open(source_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract front matter
    front_matter, body, front_matter_block = extract_front_matter(content)
    
    if not front_matter:
        print("  ⚠️  No front matter found, translating entire file")
        body = content
        front_matter_block = ''
    
    if dry_run:
        print(f"  [DRY RUN] Would translate {len(body)} characters")
        return True
    
    # Translate the body content
    try:
        translated_body = translate_html_content(translator, body, target_lang)
        
        # Update front matter lang (use lowercase language code)
        if front_matter:
            lang_code_lower = target_lang.lower()  # Convert FR->fr, ES->es
            front_matter = re.sub(r'^lang:\s*[a-zA-Z]+\s*$', f'lang: {lang_code_lower}', front_matter, flags=re.MULTILINE)
            if 'lang:' not in front_matter:
                # Add lang if it doesn't exist
                front_matter = front_matter.rstrip() + f'\nlang: {lang_code_lower}'
            front_matter_block = '---\n' + front_matter + '\n---\n'
        
        # Combine front matter and translated body
        translated_content = front_matter_block + translated_body
        
        # Ensure target directory exists
        target_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write translated file
        with open(target_path, 'w', encoding='utf-8') as f:
            f.write(translated_content)
        
        print(f"  ✅ Translated successfully")
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description='Translate HTML pages using DeepL API')
    parser.add_argument('--api-key', help='DeepL API key (or set DEEPL_API_KEY env var)')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be translated without actually translating')
    parser.add_argument('--lang', choices=['fr', 'es', 'both'], default='both', help='Language to translate to')
    parser.add_argument('--file', help='Specific file to translate (relative to project root)')
    
    args = parser.parse_args()
    
    # Get API key
    api_key = args.api_key or os.getenv('DEEPL_API_KEY')
    if not api_key:
        print("❌ Error: DeepL API key required")
        print("   Set DEEPL_API_KEY environment variable or use --api-key")
        sys.exit(1)
    
    # Initialize DeepL translator
    try:
        translator = deepl.Translator(api_key)
        print("✅ Connected to DeepL API")
    except Exception as e:
        print(f"❌ Error connecting to DeepL API: {e}")
        sys.exit(1)
    
    # Get project root
    project_root = Path(__file__).parent
    
    # Determine files to translate
    files_to_process = [args.file] if args.file else FILES_TO_TRANSLATE
    
    # Determine languages
    languages = ['fr', 'es'] if args.lang == 'both' else [args.lang]
    
    # Translate files
    success_count = 0
    total_count = 0
    
    for file_path in files_to_process:
        source_path = project_root / file_path
        
        if not source_path.exists():
            print(f"⚠️  Skipping {file_path} (not found)")
            continue
        
        for lang_code in languages:
            total_count += 1
            
            # Determine target path
            if lang_code == 'fr':
                target_path = project_root / 'fr' / file_path
            elif lang_code == 'es':
                target_path = project_root / 'es' / file_path
            
            target_lang = LANGUAGES[lang_code]
            
            if translate_file(translator, source_path, target_path, target_lang, args.dry_run):
                success_count += 1
    
    print(f"\n{'='*50}")
    print(f"Translation complete: {success_count}/{total_count} files")
    if args.dry_run:
        print("(Dry run - no files were modified)")
    print(f"{'='*50}")


if __name__ == '__main__':
    main()

