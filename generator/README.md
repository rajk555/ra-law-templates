# RA Law Group draft downloads

The nine templates in `insolvency/` are editable Word draft templates for the existing Softr matter document generator. Existing eight document options are retained by the enhancement.

`portal-drafts.js` is the deployed bundle. Load it from a commit-pinned jsDelivr URL after the existing generator code. It derives the template base URL from its own script URL.

The enhancement uses only the `get-record-item-details1` event for the selected URL record ID. It does not write to Softr Database or send merged matter data to GitHub or a document-generation service. Blank templates are fetched; merging and downloads happen in the user's browser.

Missing information becomes `[COMPLETE: Label]`; uncertain debt values become `[VERIFY: Debt amount]`. Dates, witnesses, liquidators and legal facts are not inferred. Instructions are marked using yellow Word highlighting/shading and dark-red text. Review notices are intentionally retained.

Creditor selection uses the matter's `Plaintiff` field (`UPOSo`) or the structured extraction's `plaintiff`, not the combined linked-client name. ACNs and addresses from client lookups are used only when they align with the selected creditor. Multiple unresolved creditors or conflicting debt totals block generation.

Invoice rows are read from `Combine JSON` (`dReQF`) or `JSON FIle 2 (Email)` (`hw9CZ`), using `invoices[].no`, `date`, `description` and `amount`. The statutory-demand schedule has three invoice slots and a separate row for recorded collection/legal costs. More than three invoices requires a different precedent rather than silently omitting invoices.

Reviewed enrichment can be stored in `Formatted Extracted Results` (`LfWh7`) as JSON with `schema: "ra_draft_data_v1"`. Supported groups are `creditor`, `invoices`, `debt`, `demand_service`, `demand`, `office`, and `lawyer`. `demand_service` distinguishes `post_date`, `service_date`, and `affidavit_date`; it also accepts `deponent`, `exhibit`, `posting_location`, `posting_time`, and source references. The source reference is retained in the database; it is not uploaded to GitHub.

Office routing uses the defendant's RO State. Approved VIC and QLD addresses are configured in `draft-core.js`; NSW remains unconfigured. Matter-specific office/lawyer details in reviewed enrichment take priority. No staff name is inferred from a numeric Actionstep role ID.

Rebuild with `node generator/build.cjs` and run `node generator/mapping.test.cjs`. The manifest is preserved by the build script. `extend-schedule.py` is an idempotent template migration.

These are unfinished legal drafts, not filing-ready documents. Staff must complete every instruction, verify all facts and current legal wording, attach required exhibits, check layout in Word, and remove instructions before signing, serving or filing. Source legal wording includes historical notes that require review.

Do not commit generated documents, test fixtures with matter data, credentials or client records to this public repository. Source-client custom properties and personal author metadata were removed from these public blank copies.
