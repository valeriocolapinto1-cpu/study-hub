## In short

- No accounts, no cookies, no traffic analytics, no trackers, no advertising.
- Preferences and progress stay **only in your browser** (`localStorage`) and are never sent to anyone.
- The **Contribute** form sends the controller only what you write, when you decide to send it; you can ask for it to be deleted at any time.

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

If you use the form to report an error, suggest an improvement or send notes, the following is sent: the type of contribution, the course and page it refers to, the text you write, the three declarations (privacy, rights to the material, publication), the page language and, **only if you add them**, attachments, a name (for the acknowledgements) and an email address (for a reply).

- **Where it goes.** Submissions go through the controller's **Google Apps Script**: a row in a Google Sheet, the attachments in a dedicated folder on the controller's **Google Drive** and a notification email in the controller's Gmail inbox. Google (Google Ireland Ltd. / Google LLC) acts as **data processor** on behalf of the controller, under the Google Workspace terms and the policy at policies.google.com/privacy; data may be transferred to the United States with the safeguards Google provides (standard contractual clauses, EU-U.S. Data Privacy Framework).
- **Anti-spam.** The form uses **Cloudflare Turnstile** (Cloudflare, Inc., policy at cloudflare.com/privacypolicy), loaded **only when you start filling in the form**: it may process your IP address and some browser characteristics to tell people from bots, and sets no profiling cookies. The script checks the result of the challenge and does not keep it. To limit repeated submissions the script keeps for one hour, as a SHA-256 hash, the email address and a random browser identifier (key `sh:v1:global:contribClient` in `localStorage`, created on the first submission); both expire by themselves after one hour.
- **Use and retention.** The data is used only to fix and improve the site and to reply to you; it is never shared. The text and attachments may be read by an automated process (a coding assistant run by the controller) that prepares the proposed change, which is always approved by hand. Rows and attachments are deleted when the contribution is closed (included or rejected), **at the latest after 12 months**; your email is never published.
- **Publication.** If the contribution is included, its content (possibly reworked) is published on the site and in the public repository; the name you gave appears on the **Acknowledgements** page and in the repository file `src/content/credits.yaml`. You can ask for it to be removed at any time.
- **Legal basis.** Your consent, given with the dedicated checkbox (Art. 6(1)(a) GDPR), which you can withdraw at any time without affecting processing already carried out.
- **Erasure.** To have a contribution deleted, write to the controller quoting the **contribution code** shown after sending (or the date and email address used): the row, the attachments and the notification email are deleted within 30 days.

If you prefer, you can write directly by email or open an issue on GitHub (public and subject to GitHub's privacy statement).

## Offline use

The site can be installed as an app and also works without a connection: a *service worker* stores in the browser's memory (Cache Storage) the main pages and, **only if you ask for it** with “Download for offline” on a course overview, the pages of that course. These are copies of the site's public pages: no personal data. You can remove them from the same page or by clearing the site data in your browser.

## Hosting

The site is hosted on **GitHub Pages** (GitHub, Inc.): like any web server, GitHub may log visitors' IP addresses for security purposes (policy: docs.github.com, “GitHub General Privacy Statement”). Fonts, formulas and scripts are served from the same domain: no other external resource is loaded, except Turnstile when you fill in the Contribute form.

## Your rights

The site owner keeps no visitor data, except reports sent through the form. You have the rights set out in Articles 15–22 of Regulation (EU) 2016/679 (access, rectification, erasure, restriction, objection, portability): for reports, write to the controller; for data processed by the providers above, contact them. You can lodge a complaint with the Italian Data Protection Authority (Garante per la protezione dei dati personali).

## Changes

If this policy changes, the update date at the top is modified and the changes are visible in the repository history.
