# RA Law Group draft downloads

The nine templates in `insolvency/` are editable Word draft templates for the existing Softr matter document generator. Existing eight document options are retained by the enhancement.

`portal-drafts.js` is the deployed bundle. Load it from a commit-pinned jsDelivr URL after the existing generator code. It derives the template base URL from its own script URL.

The enhancement uses only the `get-record-item-details1` event for the selected URL record ID. It does not write to Softr Database or send merged matter data to GitHub or a document-generation service. Blank templates are fetched; merging and downloads happen in the user's browser.

Missing information becomes `[COMPLETE: Label]`; uncertain debt values become `[VERIFY: Debt amount]`. Dates, witnesses, liquidators and legal facts are not inferred. Instructions are marked using yellow Word highlighting/shading and dark-red text. Review notices are intentionally retained.

These are unfinished legal drafts, not filing-ready documents. Staff must complete every instruction, verify all facts and current legal wording, attach required exhibits, check layout in Word, and remove instructions before signing, serving or filing. Source legal wording includes historical notes that require review.

Do not commit generated documents, test fixtures with matter data, credentials or client records to this public repository. Source-client custom properties and personal author metadata were removed from these public blank copies.
