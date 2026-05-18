# Create New Participating Site Page(s)

Create complete eDNA Expeditions site page(s) for: $ARGUMENTS

Each site name in the arguments maps to a row in the KoboToolbox submissions spreadsheet.
Run through every listed site fully before reporting done.

---

## Step 1 — Read the KoboToolbox API token

Read `.claude/kobo-token` (one line, the token value). If the file doesn't exist, ask the user for the token and save it there before continuing.

---

## Step 2 — Parse the Excel files

Both files live in `00_temp_DO_NOT_INCLUDE/`. Use Python + openpyxl.

**Site information file** — filename matches `*site_information*`:
Row 1 is headers. Find the row where the "Official name of your site" column matches the requested site name (case-insensitive, partial match is fine). Extract these fields:

| Field | Column header (exact match not needed — partial is fine) |
|---|---|
| `site_title` | "Official name of your site" |
| `subtitle` | "Site page subtitle" |
| `about_site` | "About your site" |
| `what_we_plan` | "What we plan to achieve" |
| `hero_image_url` | "Site image_URL" (the `_URL` variant) |
| `hero_caption` | "Image caption" |
| `hero_credit` | "Image credit" |
| `contact_email` | "Public contact email" |
| Team member N first name | "Team member N First name" (N = 1–6) |
| Team member N last name | "Team member N Last name" |
| Team member N role | "Team member N Role" |
| Team member N photo URL | "Team member N Portrait photograph…_URL" (the `_URL` variant) |
| Team member N consent | "Has Team member N given their consent" |

Only include team members where consent = "Yes" and at least one of first/last name is non-empty.

**Coordinates file** — filename matches `*coordinates*` or `*Tiered*`:
Row 1 is headers. Find the row where `site` column matches. Extract:
- `map_lat` from `site_latitude`
- `map_lon` from `site_longitude`

---

## Step 3 — Derive the site slug and paths

Slug rules:
- Lowercase the `site_title`
- Keep only ASCII letters, digits, spaces, hyphens
- Replace spaces and underscores with hyphens
- Collapse multiple hyphens into one
- Strip leading/trailing hyphens
- Trim to first 3–4 meaningful words (avoid overly long slugs)

Example: "Malindi-Watamu-Arabuko Sokoke (MWAS) Biosphere Reserve" → `malindi-watamu`
Example: "Península Valdés Natural Protected Area" → `peninsula-valdes`
Example: "Pulau Bidong and Pulau Yu, Terengganu" → `pulau-bidong-pulau-yu`

Paths derived from slug:
- Site page: `_participating_sites/<slug>.md`
- Images dir: `assets/images/sites/<slug>/`
- Hero image: `assets/images/sites/<slug>/hero.jpg`
- Team photos: `assets/images/sites/<slug>/team-1.jpg`, `team-2.jpg`, etc.

Create the images directory with `mkdir -p`.

---

## Step 4 — Download and convert images

For each image URL (hero + team members with consent=Yes):

1. **Download** as a `.pdf` temp file using curl with the KoboToolbox token:
   ```
   curl -L -H "Authorization: Token <token>" -o <dest>.pdf "<url>" --silent
   ```
   Check the HTTP status code (`-w "%{http_code}"`). If not 200, skip and use placeholder.

2. **Convert PDF → PNG → JPG** (KoboToolbox wraps all uploads as PDFs):
   ```
   qlmanage -t -s 1200 -o <images_dir> <dest>.pdf 2>/dev/null
   sips -s format jpeg <dest>.pdf.png --out <dest>.jpg 2>/dev/null
   rm <dest>.pdf <dest>.pdf.png
   ```

3. If the resulting `.jpg` is not a valid JPEG (check with `file` command), replace it with the placeholder:
   ```
   cp assets/images/team-placeholder.svg <dest>.jpg
   ```

For the hero image: if download/conversion fails, omit the `hero_image` key from front matter entirely (the template handles missing hero gracefully).

---

## Step 5 — Derive the map_label

Shorten the site title to the essential name for the map (no country, no "National Park", "World Heritage Site", "Biosphere Reserve", "Natural Protected Area" suffixes unless they are part of the common name). Keep it to 3–5 words max. Use your judgment — look at these examples from existing sites:

- "Sundarbans World Heritage Site" → "Sundarbans"
- "Península Valdés Natural Protected Area" → "Península Valdés"
- "Malindi-Watamu-Arabuko Sokoke (MWAS) Biosphere Reserve" → "MWAS Biosphere Reserve"
- "Pulau Bidong and Pulau Yu, Terengganu" → "Pulau Bidong and Pulau Yu"
- "Kerkennah Archipelago" → "Kerkennah Archipelago"

---

## Step 6 — Derive sort_name, country, and listing_teaser

- `sort_name`: ASCII-only version of the key geographic name (used for alphabetical sorting in the grid). Strip accents (é→e, etc.), remove parenthetical abbreviations, remove generic suffixes like "National Park", "Biosphere Reserve", etc.
- `country`: infer from the site name, coordinates, or contact email domain if not explicitly in the spreadsheet. Use the coordinates file `applicant_email` domain or your knowledge of the site geography.
- `listing_teaser`: write a 1–2 sentence teaser (max ~200 chars) suitable for the site card grid. Capture the ecosystem type, location, and eDNA focus. Model on existing teasers:
  - "The world's largest mangrove forest on the Bay of Bengal, where eDNA will track how climate change and salinity shifts are reshaping aquatic biodiversity."
  - "A climate-sensitive Kenya coast seascape—coral reefs, seagrass beds, and mangroves—where community-led eDNA sentinel monitoring will support marine protected area management."

---

## Step 7 — Write the site markdown file

Use this exact front matter template (omit any key whose value is unknown/empty):

```yaml
---
layout: site-page
title: "<site_title>"
lang: en

site_title: "<site_title>"
map_label: "<map_label>"
country: "<country>"
sort_name: "<sort_name>"
site_subtitle: "<subtitle>"

hero_image: /assets/images/sites/<slug>/hero.jpg
hero_caption: "<hero_caption>"
hero_credit: "<hero_credit>"

listing_teaser: "<listing_teaser>"

map_lat: <lat>
map_lon: <lon>
map_zoom: 5

contact_email: <contact_email>

about_site: |
  <about_site — preserve paragraph breaks as blank lines, clean up any encoding artifacts like â€™ → ', â€" → –, etc.>

what_we_plan: |
  <what_we_plan — same cleaning>

team:
  - name: "<First Last>"
    role: "<role>"
    image: /assets/images/sites/<slug>/team-1.jpg
  # repeat for each team member with consent
---
```

**Text cleaning rules** for `about_site` and `what_we_plan`:
- Replace `â€™` → `'`, `â€"` → `–`, `â€œ` → `"`, `â€` → `"`, `Ã©` → `é`, etc.
- Break long single paragraphs into 2–3 shorter ones at logical boundaries.
- Keep the text faithful to the submission — do not rewrite or summarise.

---

## Step 8 — Verify

After creating the file, run:
```bash
grep "map_lat\|map_lon\|site_title\|country" _participating_sites/<slug>.md
```
and confirm the map coordinates look geographically plausible for the country.

Also confirm:
```bash
file assets/images/sites/<slug>/*.jpg
```
All files should report "JPEG image data" (not PDF, SVG, or JSON).

---

## Step 9 — Report to the user

For each site, summarise:
- Site page path created
- Map coordinates
- Which images were successfully downloaded vs. placeholder
- Any fields that were missing or required inference
- Any encoding issues found and fixed

Do not commit — leave that to the user.
