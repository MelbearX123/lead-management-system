# Planning

## Terminology

| Term | Meaning |
| --- | --- |
| plaintiff | person seeking help |
| lead | plaintiff's inquiry |
| case | work recorded when a firm accepts the lead |
| attorneys/paralegals | staff at law firm |

## Functional Requirements

### Overall flow

1. Plaintiff must be able to submit a lead describing their situation with region and category.
2. System must route lead to a law firm using category/region mapping.
   - Assigned firm's staff see it in inbox, admins can see it across system.
   - If no matching firm, lead waits for an admin to assign it.
3. Firm must be able to review lead and accept/decline.
   - Accepting creates case.
   - Declining leaves lead up for admin to resolve/reassign.
4. Firm works on case, updates progress, adds private notes, exchanges PDFs with plaintiff.
   - Plaintiff can see progress/documents.
5. Admins oversee leads and cases across firms, reassign when needed.

### Plaintiff

- Submit a lead with name, email, region, category, description.
- Access own leads/cases to see progress and upload/view PDFs.
- Keep other plaintiffs' info and firm-private notes inaccessible.

### Law firm

- Route new lead to one firm using category/region mapping.
  - May seed this mapping (mapping editor not required).
  - Unmatched leads remain pending for an admin.
- Attorneys/paralegals can view and filter firm inbox, inspect lead, accept/decline.
  - Acceptance creates case.
  - Declined leads remain available for admin resolution.
- Staff can update case progress, upload/view case PDFs, add firm-private notes.

### Admin

- Search leads and cases across firms.
- Resolve unmatched/declined leads and reassign leads/cases.
- Record who changed an assignment or important status, what changed + when. History inspectable.
- On reassignment:
  - Old firm loses future access to lead/case.
  - New firm receives case info + plaintiff docs.
- Firm-private notes retain their authoring firm's ownership:
  - New firm does not inherit them.
  - Plaintiffs cannot see them.
  - Authorized admins can inspect them.
  - No separate archive UI for old firm required.

## Non-functional Requirements

Assume must handle at least:

- 100 firms
- 1,000 leads/day
- 100,000 stored leads
- A case may have hundreds of related records

## Scope and Submission

- No account creation/registration needed. A single account with hardcoded demo sign-in details is fine.
- Plaintiff, law firm, and admin workflows must all still be available to demo.
- Prioritize a coherent, working system covering the workflows above.
- Use Next.js, or React with a Python or JavaScript/TypeScript backend.
- Submit one public GitHub repo with all app code + instructions to run it.
- One app with different routes for each experience is fine. Multiple apps/services are fine if kept in a monorepo in the same repo. Either is equally acceptable, be ready to explain the choice.
- Hosted demo optional. Must run from the repo using the documented setup.

## Key Entities/Objects

Postgres, using foreign keys (FK) to keep relationships valid.

### Users

One `users` table for every role.

| Entity | Properties |
| --- | --- |
| users | userId, role (plaintiff, attorney, paralegal, admin), firmId (FK firms), fname, lname, email (unique) |

- `firmId` is set for attorneys and paralegals and null for plaintiffs and admins (CHECK constraint).
- `email` is unique, so a plaintiff who submits twice with the same email is one user with two leads.

### Firms

| Entity | Properties |
| --- | --- |
| firms | firmId, name, regionId (FK regions) |

Region is where the firm is located. Lawyers are only allowed to practice within their state. Store each state as a key mapped to a list of their cities.

Routing doesn't read `firms.regionId`. A firm that practices in several states gets a routing rule for each.

### Regions and categories

| Entity | Properties |
| --- | --- |
| regions | regionId, name |
| categories | categoryId, name |

- All locations: make them pick out of a dropdown provided.
- All categories: make them pick out of a dropdown.
- No "other" option. Regions are states, so every plaintiff fits one, and categories are a fixed list.
- The dropdowns are filled from these tables. Leads and routing rules point at them by FK, so the API can't accept a region or category that doesn't exist.

### Routing

| Entity | Properties |
| --- | --- |
| routingRules | regionId (FK regions), categoryId (FK categories), firmId (FK firms) |

- Primary key is (regionId, categoryId), so each pair maps to at most one firm. Seeded, no editor.
- New lead: look up its (regionId, categoryId). Match → `firmId` set. No match → `firmId` null, waits for an admin.

### Leads and cases

Treat leads and cases as same with a bool check since they have the same properties anyway.

| Entity | Properties |
| --- | --- |
| leads | leadId, plaintiffId (FK users), firmId (FK firms), regionId (FK regions), categoryId (FK categories), title, description, status, progress, isCase (generated), timeSubmit |

Note: status is pending or accepted (CHECK constraint). Declining isn't its own status: it sets status back to pending and firmId to null, and history records who declined.

FirmId is null if declined.

- `firmId` always means "the firm that can see this lead right now". Admin queue = pending leads with no firm.
- `progress` is the case progress the plaintiff sees: intake, investigation, negotiation, litigation, closed (CHECK constraint). Null until first accepted. Accepting sets `progress = COALESCE(progress, 'intake')`, so only the first acceptance starts it at intake. Staff can set any stage, since many cases settle without litigation.
- `isCase` is a generated column: `GENERATED ALWAYS AS (progress IS NOT NULL) STORED`. Postgres computes it, so it can't disagree with `progress`. It turns true on first acceptance and stays true through reassignment.
- Reassigning (lead or case): admin sets `firmId` to the new firm and `status` back to pending. The new firm accepts or declines like any new lead. `isCase`, `progress`, and documents carry over. The old firm's notes stay with the old firm.
- Every status change is a conditional update (`... WHERE status = 'pending' AND firmId = <my firm>`), so a double-click, or an admin reassigning while a firm accepts, can't both succeed.

Lifecycle of one lead:

| Event | status | firmId | progress | isCase |
| --- | --- | --- | --- | --- |
| Submitted, matches Firm A | pending | A | null | false |
| Firm A accepts | accepted | A | intake | true |
| Firm A updates progress | accepted | A | negotiation | true |
| Admin reassigns to Firm B | pending | B | negotiation | true |
| Firm B declines | pending | null | negotiation | true |
| Admin assigns Firm C | pending | C | negotiation | true |
| Firm C accepts | accepted | C | negotiation | true |

### Documents

| Entity | Properties |
| --- | --- |
| documents | documentId, leadId (FK leads), uploadedBy (FK users), fileName, storageKey, sizeBytes, createdAt |

- PDFs are saved to a local folder (`uploads/`, gitignored) by one storage module with save and read functions. Nothing else touches the folder, so moving to S3 later means rewriting only that module.
- `storageKey` is the file's generated name in that folder, never the uploaded filename. Two uploads called `contract.pdf` can't collide, and a name like `../../secret` can't escape the folder. The original name is kept in `fileName` for display.
- Documents belong to the lead, not to a firm, so a new firm sees all of them after reassignment. `uploadedBy` shows whether the plaintiff or a firm uploaded each one.

### Notes

| Entity | Properties |
| --- | --- |
| notes | noteId, leadId (FK leads), firmId (FK firms), authorId (FK users), body, createdAt |

- `firmId` is the authoring firm. Staff only see notes where `firmId` is their firm, so a new firm doesn't inherit old notes.
- `body` is a plain text column.

### History

| Entity | Properties |
| --- | --- |
| history | historyId, leadId (FK leads), actorId (FK users), field (firm, status, progress), oldValue, newValue, createdAt |

- One row per change, never edited, so every previous firm is kept.
- `actorId` is null when the system made the change (automatic routing).

### Access rules

| Who | Leads | Documents | Notes |
| --- | --- | --- | --- |
| Plaintiff | `plaintiffId` = me | on my leads | none |
| Staff | `firmId` = my firm | on those leads | `firmId` = my firm |
| Admin | all | all | all |

The backend checks these on every request. Hiding something in the frontend is not security.

### Indexes

Postgres doesn't index foreign key columns on its own.

| Index | Query it serves |
| --- | --- |
| leads (firmId, status, timeSubmit) | firm inbox filtered by status, newest first. Also the admin queue, since `firmId IS NULL` can use it |
| leads (plaintiffId) | a plaintiff's own leads |
| notes (leadId, firmId) | one firm's notes on a case |
| documents (leadId) | a case's documents |
| history (leadId, createdAt) | a lead's history in order |
| leads (timeSubmit, leadId) | admin list sorted newest or oldest first |
| GIN trigram on leads.title | admin search by title |
| GIN trigram on users (fname \|\| ' ' \|\| lname) | admin search by plaintiff name |

Trigram indexes need the `pg_trgm` extension.

### Admin search

- Default (no search or filters): every lead, newest first, paginated.
- Text search: lead `title` and plaintiff name, using `ILIKE '%term%'`.
- Filters: region, category, firm. Search and filters only narrow the list.
- The firm dropdown has an "Unmatched" option for `firmId IS NULL`. That covers both unmatched and declined leads, which is the admin's work queue.
- Sort: by `timeSubmit`, newest or oldest first, with `leadId` as a tiebreaker so leads submitted at the same moment keep a fixed order between pages.
- Offset pagination (`LIMIT`/`OFFSET`) shown as a table with page numbers.
- The firm filter uses the existing leads (firmId, status, timeSubmit) index, so it needs no new one.

## App Structure

Each of admin, staff, and plaintiffs has different views of the app. Have a common backend (as they use similar API endpoints) and one shared frontend that displays differently based on logged in user.

Stack: Next.js with TypeScript. Pages and API routes live in one app, so there's one project to run and the frontend and API share types.

## Design Decisions

Changes from the first draft, why, and alternatives that don't work.

### One users table instead of three

History needs "who made this change" (an admin or staff), and a document needs "who uploaded it" (a plaintiff or staff). A foreign key points at exactly one table, and the three tables only differed by `firmId`.

- **Three tables + `actorType`/`actorId` columns:** no FK is possible, so nothing stops a history row pointing at a user that doesn't exist.
- **Three nullable FK columns + a CHECK that exactly one is set:** works, but every read joins three tables, and adding a role changes the schema of every table that references users.
- **A base users table + one table per role:** works, but it's a lot of structure for a single column difference.

### A routingRules table

Routing has to read something. Before this, no table connected a (region, category) pair to a firm, and the spec requires exactly one firm per lead.

- **Categories as a list on each firm + `firms.region`:** two firms can match the same pair and nothing in the database stops it. Postgres arrays also can't hold foreign keys.
- **Routing by `firms.region` only:** ignores category entirely.

### Regions and categories as tables

The dropdown only protects the UI. Anyone can call the API directly, and a lead with a misspelled region quietly never matches a rule.

- **Free text:** "NY" and "New York" never match.
- **A list kept only in code:** the database can't enforce it.
- **Postgres ENUM types:** would work, but adding a category needs a migration and there's nowhere to store a display name.

### `progress` on leads

Plaintiffs must see case progress, and `status` (pending/accepted) had nowhere to put it.

- **More values in `status`:** mixes "who has this lead" with "how far along is the case", and every "is this a case" check becomes `status IN (...)`.

### Records split into documents, notes, and history

The three types need different columns:
- Notes need the authoring firm. A public/private flag says a note is private, but not whose. Firm B would see Firm A's notes.
- History needs who, old value and new value.
- Documents need a storage key.

In one table most columns are empty for each type, and a column can't be NOT NULL for only one type.

- **One table with a public/private flag:** leaks other firms' notes.
- **One table with every column nullable + `recordType`:** only works with a pile of CHECK constraints, and every query has to filter by type.

### Notes as a text column, not `.txt` files

A note is a few sentences. A text column loads with the same query that checks access.

- **`.txt` in file storage:** an extra network request per note and two systems to keep in sync, for no gain.

### History is append-only and keeps every change

Admins must be able to inspect past assignments. Keeping only the last firm loses earlier moves.

- **`timeLastEdited` on an edited row:** a log that gets overwritten can't be trusted, and it loses who and what changed.
- **An array of previous firms on the lead:** no who or when, and it grows on the busiest table.

### Indexes on the hot queries

Without them, every inbox load scans all 100,000+ leads.

### Progress values: intake, investigation, negotiation, litigation, closed

Plaintiffs see this, so it has to make sense for any category. These are the common stages of a civil case, and every case here is civil: a plaintiff is the person who brings a civil case. Criminal cases are brought by the government against a defendant, so they never come through this system. Detail belongs in notes and documents, not in the stage name.

- **Free text:** each firm words it differently, plaintiffs get inconsistent updates, and admins can't filter by it.
- **Percent complete:** legal cases don't move in a straight line, so the number would be made up.
- **Different stages per category:** more accurate, but needs another table and per-category UI for little demo value.

### Reassigned cases must be accepted again

The new firm should agree to take on the work, the same way it would for a new lead. A reassigned case goes back to pending with the new firm, and `isCase` stays true so it's still a case while it waits.

- **"isCase only when accepted":** reassignment would turn a case back into a plain lead and hide its progress from the plaintiff.
- **Keep it accepted on reassignment:** the new firm never agreed to the work.

### `isCase` generated from `progress`

A case is exactly a lead that has progress. If app code set `isCase` by hand, one missed code path would leave a lead with progress but `isCase = false`. A generated column can't drift.

- **App code sets `isCase`:** every accept, reassign, and decline path has to remember it.
- **Drop `isCase` and write `progress IS NOT NULL` everywhere:** works, but queries read worse.

### Trigram indexes for admin search

`ILIKE '%term%'` can match anywhere in the text, so a normal B-tree index can't help, and every search scans every lead. A trigram index breaks text into 3-letter pieces, so partial matches like "john" in "Johnson" use the index.

- **No index:** fine at 100,000 leads, but it gets slower by 1,000 leads a day.
- **Full-text search (`tsvector`):** built for whole words in long text, so "Joh" wouldn't find "Johnson". Overkill for short fields like names and titles.
- **A search engine like Elasticsearch:** another service to run and keep in sync, unnecessary at this size.

### Offset pagination for the admin list

The admin list isn't live data, so a few shifted rows while new leads arrive are acceptable. Page numbers in a table let an admin jump straight to a page. Admins mostly filter rather than paging deep, so `OFFSET` skipping rows is cheap enough at this size.

- **Cursor (keyset) pagination:** stable while new leads arrive and fast at any depth, but it can only go next/previous, not jump to page 37.
- **Infinite scroll:** harder to find your place again, and still needs one of the two above underneath.

Known tradeoff: with newest first, leads that arrive while an admin reads page 1 push rows down, so page 2 can repeat a few rows from page 1.

### PDFs on local disk

The system only has to run locally, so a folder needs no extra service or account.

- **Postgres `bytea`:** 100,000 leads with several PDFs each makes the database huge, and every download goes through it.
- **MinIO in Docker:** no longer maintained, and no longer publishes Docker images.
- **AWS S3:** everyone running the repo would need an AWS account and credentials.

With more time or resources: S3, with the backend handing out short-lived presigned URLs after its access check.

### Kept as is

These are defensible and not harmful, so they're yours to explain:
- Leads and cases in one table. A case is the same row once a firm accepts it.
- Declined leads go back to pending with no firm. An admin can only tell "declined" from "unmatched" by looking at history.
- `title`, the city list, `fname`/`lname`, and one shared frontend.

## Seed Data

Starting data loaded during setup, since there's no registration or editor. Every seeded lead also gets history rows for each change listed under "How it got there", so its history matches its current state.

### Regions and categories

- Regions: all 50 states + DC, so the dropdown is complete without an "other" option.
- Categories: Personal Injury, Employment, Family Law, Consumer Protection. These are common plaintiff-side civil areas, and all of them go through intake → investigation → negotiation → litigation → closed. Immigration and bankruptcy were left out because they don't follow those stages.

### Firms and routing rules

| Firm | Located in | Routing rules (region, category) |
| --- | --- | --- |
| Alder & Finch LLP (Firm A) | New York | (NY, Personal Injury), (NY, Employment) |
| Pacific Shore Legal (Firm B) | California | (CA, Personal Injury), (CA, Family Law), (NY, Family Law) |

Firm B also practices in New York, so reassigning a New York case to it doesn't break the "lawyers practice within their state" rule. No firm covers Texas or Consumer Protection.

### Users

| Name | Role | Firm | Email |
| --- | --- | --- | --- |
| Maya Chen | plaintiff | none | maya@example.com |
| Jordan Ruiz | plaintiff | none | jordan@example.com |
| Avery Stone | attorney | Firm A | avery@example.com |
| Sam Patel | paralegal | Firm B | sam@example.com |
| Riley Morgan | admin | none | riley@example.com |

- 2 plaintiffs, so the demo can show that Maya can't see Jordan's leads.
- One staff member per firm, so the demo can log in as both sides of a reassignment. One attorney and one paralegal shows that both roles work.

### Leads

| # | Plaintiff | Region / category | Current state | How it got there |
| --- | --- | --- | --- | --- |
| 1 | Maya | NY / Personal Injury | pending at A | routed to A |
| 2 | Jordan | CA / Family Law | pending at B | routed to B |
| 3 | Maya | NY / Employment | accepted at A, intake | routed to A, A accepted |
| 4 | Maya | NY / Personal Injury | accepted at A, investigation | routed to A, A accepted, progress → investigation |
| 5 | Maya | NY / Personal Injury | accepted at B, negotiation | routed to A, A accepted, progress → investigation, admin reassigned to B, B accepted, progress → negotiation |
| 6 | Jordan | CA / Personal Injury | accepted at B, litigation | routed to B, B accepted, progress → investigation → negotiation → litigation |
| 7 | Jordan | CA / Family Law | accepted at B, closed | routed to B, B accepted, progress → investigation → negotiation → closed |
| 8 | Jordan | TX / Consumer Protection | pending, no firm | no matching rule |
| 9 | Jordan | CA / Personal Injury | pending, no firm | routed to B, B declined |
| 10 | Maya | NY / Employment | pending, no firm, investigation | routed to A, A accepted, progress → investigation, admin reassigned to B, B declined |

- Leads 1–2 give each firm something to accept or decline live.
- Leads 3–7 cover one case per progress stage.
- Leads 8–10 are the admin's "Unmatched" queue: one with no match, one declined lead, and one declined case (the "accepted, then declined" lead). A firm can't decline a case it already accepted, so this only happens after a reassignment.
- Firm A's inbox: 1, 3, 4. Firm B's inbox: 2, 5, 6, 7. Firm A no longer sees 5 or 10.

### Notes and documents

- Lead 5: a private note from Firm A (written before the reassignment) and one from Firm B. Firm B only sees its own note, and the admin sees both.
- Lead 4: a private note from Firm A.
- Lead 5: a PDF uploaded by Maya before the reassignment, which Firm B can see.
- Lead 6: a PDF uploaded by Firm B.
- PDFs come from one small sample file committed in the seed folder. The seed copies it into `uploads/` under a generated name.

## API Routing

All paths start with `/api`. "Has access" means the access rules table above: a plaintiff's own leads, a firm's current leads, or any lead for an admin.

### Auth

Sign-in is an email plus one shared demo password (no registration). Any plaintiff created by the lead form can sign in this way too.

| Method | Path | Who can call | What it does |
| --- | --- | --- | --- |
| POST | /api/auth/login | anyone | Sign in with email + demo password, set a session cookie |
| POST | /api/auth/logout | signed in | Clear the session |
| GET | /api/auth/me | signed in | Current user's name, role, and firm, so the frontend knows which view to show |

### Users

No endpoints. No workflow lists users: plaintiffs are created by the lead form, the current user comes from `/api/auth/me`, and names (plaintiff, note author) come back inside lead and note responses.

### Firms

| Method | Path | Who can call | What it does |
| --- | --- | --- | --- |
| GET | /api/firms | admin | List firms, for the firm filter and the reassign dropdown |

### Regions and categories

| Method | Path | Who can call | What it does |
| --- | --- | --- | --- |
| GET | /api/regions | anyone | List regions for the lead form and filters |
| GET | /api/categories | anyone | List categories for the lead form and filters |

### Routing rules

No endpoints. Rules are seeded, and routing runs inside `POST /api/leads`.

### Leads and cases

| Method | Path | Who can call | What it does |
| --- | --- | --- | --- |
| POST | /api/leads | anyone | Submit a lead. Finds or creates the plaintiff by email, routes it, writes history |
| GET | /api/leads | signed in | List leads the caller has access to, newest first, paginated. Filters below |
| GET | /api/leads/:leadId | has access | One lead with its plaintiff's name and email, firm, status, and progress |
| POST | /api/leads/:leadId/accept | staff of the assigned firm | Pending → accepted, progress starts at intake if empty, writes history |
| POST | /api/leads/:leadId/decline | staff of the assigned firm | Pending lead loses its firm and goes to the admin queue, writes history |
| POST | /api/leads/:leadId/assign | admin | Body `{ firmId }`. Gives the lead to a firm as pending, for both unmatched leads and reassignment, writes history |
| PATCH | /api/leads/:leadId/progress | staff of the assigned firm | Body `{ progress }`. Only on accepted cases, writes history |

`GET /api/leads` query parameters:

| Parameter | Who can use it | Values |
| --- | --- | --- |
| q | admin | Text matched against title and plaintiff name |
| regionId, categoryId | staff, admin | Filter by region or category |
| firmId | admin | A firm's id, or `unmatched` for leads with no firm |
| status | staff, admin | pending or accepted |
| sort | signed in | newest (default) or oldest |
| page | signed in | Page number, 25 per page |

### Documents

| Method | Path | Who can call | What it does |
| --- | --- | --- | --- |
| GET | /api/leads/:leadId/documents | has access | List a lead's documents (name, uploader, date), paginated |
| POST | /api/leads/:leadId/documents | plaintiff who owns it, staff of the assigned firm | Upload a PDF. Rejects anything that isn't a PDF or is over 10 MB |
| GET | /api/leads/:leadId/documents/:documentId | has access | Download the PDF |

### Notes

| Method | Path | Who can call | What it does |
| --- | --- | --- | --- |
| GET | /api/leads/:leadId/notes | staff of the assigned firm, admin | Staff get only their firm's notes, admins get every firm's, paginated |
| POST | /api/leads/:leadId/notes | staff of the assigned firm | Add a note owned by the author's firm |

### History

| Method | Path | Who can call | What it does |
| --- | --- | --- | --- |
| GET | /api/leads/:leadId/history | admin | A lead's history, oldest first, paginated |

### Errors

| Status | When |
| --- | --- |
| 400 | Bad input, like a missing field or a region that doesn't exist |
| 401 | Not signed in |
| 403 | Signed in but the wrong role, like a plaintiff reading notes |
| 404 | The lead doesn't exist, or the caller has no access to it |
| 409 | The lead changed first, like a firm accepting a lead an admin just reassigned |

### Why it's shaped this way

- **Everything about a lead is nested under `/api/leads/:leadId`.** Documents, notes, and history only exist on a lead, so every check starts with "can you access this lead?"
- **Accept, decline, and assign are their own endpoints.** Each one is a state change with its own rule about who can do it and from which status. A generic `PATCH /api/leads/:leadId { status }` would push all those rules into one handler, and a client could send any combination of fields.
- **One `assign` endpoint for both unmatched leads and reassignment.** Both set the firm and put the lead back to pending, so the data change is the same.
- **One `GET /api/leads` for every role.** The backend always narrows results to what the caller can access before applying filters. Separate endpoints per role (`/api/admin/leads`, `/api/firm/leads`) would also work, but would repeat the same query three times.
- **404 instead of 403 for someone else's lead.** A 403 would confirm the lead exists. A 404 reveals nothing.
- **409 when a conditional update changes nothing.** That's how the frontend learns someone else got there first, and can reload.
- **Related records are paginated.** A case can have hundreds of documents, notes, or history rows, so they load separately from the lead, a page at a time.
- **The lead form is public.** Anyone can submit, and the lead is tied to the plaintiff by email. Someone could submit a lead under another person's email but never read that person's leads. With more time: email a sign-in link to verify the address.

## Implementation Phases

Backend first, then frontend. Each bullet under a phase is roughly one small commit. Tests are written alongside the code they cover, not saved for the end.

### Tooling

| Need | Choice | Why |
| --- | --- | --- |
| App | Next.js (App Router), TypeScript, Tailwind | One app for pages and API. Tailwind comes with the Next.js starter |
| Database | Postgres 17 in Docker Compose | One command to start it, same version for everyone running the repo |
| Database access | `postgres` (postgres.js) with plain SQL, schema in `db/schema.sql` | The design relies on Postgres features (generated column, CHECK constraints, trigram indexes, conditional updates) that are plain SQL. An ORM would hide the SQL you'll be asked about, and Prisma can't express CHECK constraints or generated columns in its schema |
| Input validation | zod | Checks request bodies and query parameters, and gives TypeScript types from the same definition |
| Sessions | iron-session | Encrypted, HTTP-only cookie holding the user id. No sessions table needed for a demo |
| Tests | Vitest against a separate test database | Real Postgres, so constraints and conditional updates are actually tested |

Code layout: route handlers in `src/app/api/` stay thin (parse input, call a function, return a response). Database queries and business rules live in `src/server/`, which is marked server-only so it can never end up in browser code.

### Phase 0: Project setup

- Next.js starter with TypeScript
- Docker Compose for Postgres, `.env.example`, `uploads/` gitignored
- Database connection module

### Phase 1: Database and seed

- `db/schema.sql`: tables, foreign keys, CHECK constraints, the generated `isCase` column, indexes, `pg_trgm`
- Setup script that resets the database and applies the schema
- Seed: regions, categories, firms, routing rules, users
- Seed: the 10 leads with their history rows
- Seed: notes, plus documents from a sample PDF

### Phase 2: Auth and access control

- Login, logout, and `me` endpoints with iron-session
- Helpers: get the current user, require a role, load a lead only if the caller has access (otherwise 404)
- One error helper for the 400/401/403/404/409 responses
- Tests: each role can only load the leads in the access rules table

### Phase 3: Leads

- Regions, categories, and firms endpoints
- Submit a lead: find or create the plaintiff, route it, write history, all in one transaction
- List leads: scoped by role, then filters, search, sort, and pagination
- Get one lead
- Accept, decline, assign, and progress: conditional updates, 409 when nothing changed, history in the same transaction
- Tests: routing, every state change, the old firm losing access, two firms racing to accept

### Phase 4: Documents, notes, and history

- Storage module: save and read files in `uploads/` under generated names
- Upload (PDF and size checks), list, and download documents
- Notes: list (own firm's, or all for admins) and add
- History: list for admins
- Tests: a new firm sees old documents but not old notes, plaintiffs get 403 on notes

### Phase 5: Frontend shell

- Shared layout, login page with the demo accounts listed, redirect to the right view by role
- Small shared pieces: lead status badge, paginated table, PDF list and upload

### Phase 6: Plaintiff pages

- Public lead form
- My leads list
- Lead detail: progress, documents, upload

### Phase 7: Staff pages

- Inbox with filters
- Lead detail: accept or decline, progress, notes, documents

### Phase 8: Admin pages

- Leads table with search, filters (including "Unmatched"), sort, and page numbers
- Lead detail: assign or reassign, history, every firm's notes, documents

### Phase 9: Submission

- README: prerequisites, setup commands, demo accounts, a short demo walkthrough, and a link to this design doc
- Final check: fresh clone, follow the README, run every workflow

## With More Time

1,000 leads a day is less than one a minute, and 100,000 rows is small for one Postgres database. So most full-scale additions are about reliability, security, and operations, not speed. Add each one when something calls for it, not up front.

| Concern | Technology | What it does | Needed at this scale? |
| --- | --- | --- | --- |
| Database | Managed Postgres (AWS RDS or Aurora) | Same Postgres, with backups, failover, and upgrades handled | Yes, for reliability |
| Connections | PgBouncer | Shares a pool of database connections across app servers | Once there are several app servers |
| Read scaling | Read replicas | Copies of the database for read-heavy pages like inboxes and search | Only if reads outgrow one server |
| File storage | S3 with presigned URLs | Stores PDFs. The backend checks access, then hands out a short-lived download link | Yes, replaces the local folder |
| Upload safety | Virus scanning (ClamAV, or AWS's built-in S3 malware scanning) | Checks uploaded files before anyone opens them | Yes, strangers upload PDFs |
| Caching | Redis | Keeps data in memory, like sessions and the region/category lists | Barely. See below |
| Background jobs | A queue (AWS SQS, or BullMQ/Celery on Redis) | Runs slow work outside the request, like emails and scans | Yes, once there are notifications |
| Email | AWS SES, Postmark, or SendGrid | Tells firms about new leads and plaintiffs about updates | Yes, the biggest missing feature |
| Auth | Auth0, Clerk, or Cognito | Real sign-in, single sign-on for firms, MFA, email sign-in links for plaintiffs | Yes, replaces the demo password |
| Search | OpenSearch or Elasticsearch | A dedicated search engine | No. Trigram indexes are enough until millions of leads |
| Hosting | Containers (AWS ECS or Kubernetes) or Vercel, behind a load balancer | Several copies of the app, so one crash doesn't take it down | Yes, for uptime |
| CDN | CloudFront or Cloudflare | Serves frontend files from servers near users | Nice to have |
| Abuse protection | Rate limiting, a web application firewall, CAPTCHA on the lead form | Stops spam and bots on the public form | Yes, the form is public |
| Observability | Logs, metrics, tracing (Datadog, or OpenTelemetry + Grafana), Sentry | Shows when something breaks and why | Yes |
| Secrets | AWS Secrets Manager | Keeps passwords and API keys out of code | Yes |
| Deployment | GitHub Actions + Terraform | Automated tests and deploys, infrastructure written as code | Yes |

### Caching and access control

Caching a firm's inbox is risky. After a reassignment, a cached inbox would keep showing the old firm a lead it no longer has access to, which breaks "the old firm loses future access". Only cache data that rarely changes and isn't private, like the region and category lists, and always check access against the database.

### Legal data

These are confidential client documents, so a real version also needs encryption at rest (S3 and RDS both support it), strict access logging, backups with point-in-time restore, and possibly a security audit like SOC 2.

### Order

First the things that make it safe and reliable: S3 with virus scanning, real auth, email notifications through a queue, and monitoring. Caching, read replicas, or a search engine only when measurements show they're needed.

## Open Questions

None right now.
