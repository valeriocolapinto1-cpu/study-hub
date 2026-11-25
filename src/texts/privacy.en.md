## In short

- No accounts, no cookies, no traffic analytics, no trackers, no advertising.
- Preferences and progress stay **only in your browser** (`localStorage`) and are never sent to anyone.
- The **Contribute** form is an external Google Form: what you write reaches the controller only if you submit it; you can ask for it to be deleted at any time.

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

The Contribute page only contains a **link to a Google Forms form**, which opens in a new tab: the site sends nothing to Google and loads no Google resources. The form asks for the type of contribution, the course and topic, the text, the source and, **only if you want**, the name you would like to be credited with.

- **Where it goes.** Answers are collected by **Google Forms** and stored in a Google sheet on the controller's **Google Drive**. Google (Google Ireland Ltd. / Google LLC) processes the data under its own terms and the policy at policies.google.com/privacy (which also applies to the form page); data may be transferred to the United States with the safeguards provided by Google (standard contractual clauses, EU-U.S. Data Privacy Framework). If the form requires signing in with a Google account, the form page itself says so.
- **Use and retention.** Answers are used only to fix and improve the site; they are never shared. They may be read by a coding assistant run by the controller, which checks them against the source you gave and prepares the change, always approved by hand. Rows are deleted when the contribution is closed (included or rejected), **at the latest after 12 months**.
- **Publication.** If the contribution is included, its content (possibly reworked) is published on the site and in the public repository, together with the **source** you gave; your name appears on the **Acknowledgements** page and in the repository file `src/content/credits.yaml` **only if you asked for it**. You can ask for it to be removed at any time.
- **Legal basis.** Your consent, given by submitting the form (art. 6.1.a GDPR), which you can withdraw at any time without affecting processing already carried out.
- **Erasure.** To have a contribution deleted, write to the controller giving the date and content of the submission: the row is deleted within 30 days.

If you prefer, you can write by email or open an issue on GitHub (public and subject to GitHub's privacy statement).

## Offline use

The site can be installed as an app and also works without a connection: a *service worker* stores in the browser's memory (Cache Storage) the main pages and, **only if you ask for it** with “Download for offline” on a course overview, the pages of that course. These are copies of the site's public pages: no personal data. You can remove them from the same page or by clearing the site data in your browser.

## Hosting

The site is hosted on **GitHub Pages** (GitHub, Inc.): like any web server, GitHub may log visitors' IP addresses for security purposes (policy: docs.github.com, “GitHub General Privacy Statement”). Fonts, formulas and scripts are served from the same domain: no other external resource is loaded.

## Your rights

The site owner keeps no visitor data, except reports sent through the form. You have the rights set out in Articles 15–22 of Regulation (EU) 2016/679 (access, rectification, erasure, restriction, objection, portability): for reports, write to the controller; for data processed by the providers above, contact them. You can lodge a complaint with the Italian Data Protection Authority (Garante per la protezione dei dati personali).

## Changes

If this policy changes, the update date at the top is modified and the changes are visible in the repository history.
