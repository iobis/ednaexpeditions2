# Translation guide

This script uses the DeepL API to translate HTML pages from English to French and Spanish.

## Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set your API key:**
   ```bash
   export DEEPL_API_KEY="your-api-key-here"
   ```
   
   Or pass it directly:
   ```bash
   python translate_pages.py --api-key "your-api-key-here"
   ```

## Usage

### Translate all pages to both languages:
```bash
python translate_pages.py
```

### Translate to specific language:
```bash
python translate_pages.py --lang fr
python translate_pages.py --lang es
```

### Dry run (see what would be translated):
```bash
python translate_pages.py --dry-run
```

### Translate a specific file:
```bash
python translate_pages.py --file index.html
python translate_pages.py --file resources/consent-form.html
```
