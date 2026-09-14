# Create a New Article (News & Stories)

Create a new eDNA Expeditions article for: $ARGUMENTS

---

## Step 1 — Gather content

The user will provide either:
- A Google Doc URL (use the Google Drive MCP connector to read it), or
- Raw text pasted directly.

Read the full content before doing anything else.

---

## Step 2 — Prepare images

The user will indicate where the images are (typically `00_temp_DO_NOT_INCLUDE/<folder>/`).

Create the destination folder:
```
assets/images/news/<article-slug>/
```

**Naming convention:**
- Hero image → `hero.jpg`
- Body images → descriptive lowercase slugs, e.g. `students-sampling.jpg`, `teacher-portrait.jpg`

**Copy** the chosen images into the destination folder, then **resize and compress** every image using `sips`:

```bash
# Resize to max 1280px on the longest side, JPEG quality 82
sips -Z 1280 --setProperty formatOptions 82 <image>.jpg --out <image>.jpg
```

Target: all images under 400 KB. Verify with `ls -lh` after processing.

---

## Step 3 — Create the Jekyll post file

File path: `_posts/<YYYY-MM-DD>-<article-slug>.md`

Use today's date. The slug should be lowercase, hyphen-separated, 4–6 words max.

**Front matter template:**

```yaml
---
layout: article
title: "<Full article title>"
date: YYYY-MM-DD
category: story
hero_image: /assets/images/news/<article-slug>/hero.jpg
hero_caption: "<One sentence describing the scene, location, and date>. <span class='caption-credit'>© Credit Name / Organisation</span>"
teaser: "<1–2 sentence teaser for the news card. Should stand alone.>"
lang: en
---
```

---

## Step 4 — Write the article body

### Intro paragraph
Open with a plain paragraph (no heading) that sets the scene and introduces the subject. No heading before it, and no manual `<br>` after it — the first intertitle's own top margin creates the gap.

### Intertitles (section headings)
Break the body into narrative sections with Markdown `### ` headings (renders as `.article-body h3`: bold, 1.6rem, tighter line-height). Do not add `<br>` before or after a heading — spacing is handled entirely by CSS margin (which also collapses correctly whether the heading follows a paragraph or a `<figure>`, giving it less top margin right after an image since the image already reads as a break). Write headings as short descriptive phrases ("Getting to the site: the beginning of an adventure"), not literal interview questions — fold the question into the surrounding prose or the coordinator's own words instead.

Do not use the old bold-paragraph Q&A style (`**Question text**`) for new articles — it's kept in CSS only for backward compatibility with older posts.

### Verbatim quotes
Every direct quotation from a source (dialogue in the body text) is italicized: `*"Quote text,"* said **Name**.` Bold the person's name only the first time they are quoted, plain text on every subsequent mention. This italic treatment does not apply inside `<blockquote class="pull-quote">` elements — those stay unstyled/plain.

### Pull quotes
Pick 1–2 strong quotes from the text. Insert them as:

```html
<blockquote class="pull-quote">"Quote text here."</blockquote>
```

Place pull quotes at a natural pause — after a key concept lands, before the next section.

### Body images
Insert images as `<figure>` blocks with captions. Always use `<span class="caption-credit">` for the photo credit, inline (no line break before it):

```html
<figure>
  <img src="/assets/images/news/<slug>/<image>.jpg" alt="Brief description">
  <figcaption>One sentence describing the scene. <span class="caption-credit">© Credit / Organisation</span></figcaption>
</figure>
```

For a photo that should run wider than the text column (matching the hero's width), add `class="figure-wide"` to the `<figure>` tag — use this sparingly, for standout images only:

```html
<figure class="figure-wide">
  <img src="/assets/images/news/<slug>/<image>.jpg" alt="Brief description">
  <figcaption>...</figcaption>
</figure>
```

- Ship names must be in `<em>`: e.g. `<em>Statsraad Lehmkuhl</em>`
- Species names must be in `<em>`, not Markdown asterisks — Markdown italics can't nest inside an already-italicized quote: e.g. `<em>Saccostrea cucullata</em>`
- Spread images throughout the article — aim for one image every 2–3 sections
- Portrait images stay at full content width (no special class needed)

### Hero image width
The hero image (`.article-hero`) is wider than the text column by default on desktop (≥992px): 929.5px vs. the 640px text column, centered so the text width never moves. No action needed — this is automatic from the `hero_image` front matter field.

### Closing section
End with a `---` separator and a "Dive deeper" block:

```html
---

<p class="article-section-kicker">Dive deeper</p>

- [Link text](URL)
- [Link text](URL)
- Stay informed, join our newsletter (scroll below!)
```

---

## Step 5 — Links open in new tab

All links in the article body open in `_blank` automatically — this is handled by a script in `_layouts/article.html`. No special markup needed.

---

## Step 6 — Verify the news card

Check that the article appears correctly on `/news-stories/`:
- Hero image loads
- Title and teaser display correctly
- The card links to the article

---

## Step 7 — Report to the user

Summarise:
- Post file path created
- Images processed (before/after file sizes)
- Pull quotes chosen and their placement
- Any content decisions made (e.g. caption wording inferred)

Do not commit — leave that to the user.
