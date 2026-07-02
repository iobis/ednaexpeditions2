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
hero_caption: "<One sentence describing the scene, location, and date>.<br><span class='caption-credit'>© Credit Name / Organisation</span>"
teaser: "<1–2 sentence teaser for the news card. Should stand alone.>"
lang: en
---
```

---

## Step 4 — Write the article body

### Intro paragraph
Open with a plain paragraph (no heading) that sets the scene and introduces the subject.

### Q&A format
Each question is a bold paragraph (Markdown `**Question text**`), followed by the answer as one or more regular paragraphs. The CSS adds top spacing before each question automatically via `:has(> strong:only-child)`.

### Pull quotes
Pick 1–2 strong quotes from the text. Insert them as:

```html
<blockquote class="pull-quote">"Quote text here."</blockquote>
```

Place pull quotes at a natural pause — after a key concept lands, before the next question.

### Body images
Insert images as `<figure>` blocks with captions. Always use `<span class="caption-credit">` for the photo credit, inline (no line break before it):

```html
<figure>
  <img src="/assets/images/news/<slug>/<image>.jpg" alt="Brief description">
  <figcaption>One sentence describing the scene. <span class="caption-credit">© Credit / Organisation</span></figcaption>
</figure>
```

- Ship names must be in `<em>`: e.g. `<em>Statsraad Lehmkuhl</em>`
- Spread images throughout the article — aim for one image every 2–3 questions
- Portrait images stay at full content width (no special class needed)

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
