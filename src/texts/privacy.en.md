## In short

- No accounts, no cookies, no traffic analytics, no trackers, no advertising.
- Preferences and progress stay **only in your browser** (`localStorage`) and are never sent to anyone.
- The **Contribute** form sends the site owner only what you write, when you decide to send it.

## Data controller

Valerio Colapinto, in a personal, non-commercial capacity. For any data request, write to the email address at the bottom of the page.

## Data stored in your browser

The site stores in `localStorage`, on your device, some information it needs to work. All keys start with `sh:v1:`:

| Key | Content |
|---|---|
| `sh:v1:global:theme` | chosen theme (light or dark), if you change it |
| `sh:v1:global:lang` | chosen language (Italian or English), if you change it |
| `sh:v1:global:examDates` | exam dates you enter |
| `sh:v1:<course>:progress` | topics studied and exercises done |
| `sh:v1:<course>:srs` | spaced-repetition state of the flashcards |
| `sh:v1:<course>:exam` | mock exams taken and scores |
| `sh:v1:<course>:notes`, `…:settings` | course notes and settings |

On your first visit the site may copy into the new keys the progress saved by the previous study sites (same `github.io` origin), without deleting the original data.

This data never leaves your device. From the **Progress** page of each course you can **export** it as a JSON file, import it on another device or delete it; you can also remove it at any time by clearing the site data in your browser settings.

## The “Contribute” form

If you use the form to report an error or suggest content, the following is sent: the text you write, the page and course it refers to, the type of report and, **only if you fill them in**, a name (for the acknowledgements) and an email address (for a reply).

- Submissions go through the owner's **Google Apps Script** and are stored in a sheet on the owner's **Google Drive** (Google Ireland Ltd. / Google LLC, privacy policy: policies.google.com/privacy). They are used only to fix the site and reply, are never shared and are deleted when the report is closed, at the latest after 12 months.
- To block spam the form uses **Cloudflare Turnstile** (Cloudflare, Inc., privacy policy: cloudflare.com/privacypolicy). Turnstile is loaded only on the Contribute page and may process your IP address and some browser characteristics to tell people from bots; it does not set profiling cookies.
- Legal basis: your consent, given by submitting the form (Art. 6(1)(a) GDPR). You can ask for a report to be deleted at any time.

If you prefer, you can write directly by email or open an issue on GitHub (subject to GitHub's privacy statement).

## Hosting

The site is hosted on **GitHub Pages** (GitHub, Inc.): like any web server, GitHub may log visitors' IP addresses for security purposes (policy: docs.github.com, “GitHub General Privacy Statement”). Fonts, formulas and scripts are served from the same domain: no other external resource is loaded, except Turnstile on the Contribute page.

## Your rights

The site owner keeps no visitor data, except reports sent through the form. You have the rights set out in Articles 15–22 of Regulation (EU) 2016/679 (access, rectification, erasure, restriction, objection, portability): for reports, write to the controller; for data processed by the providers above, contact them. You can lodge a complaint with the Italian Data Protection Authority (Garante per la protezione dei dati personali).

## Changes

If this policy changes, the update date at the top is modified and the changes are visible in the repository history.
