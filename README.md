# Lead Management

Connects people seeking legal help (plaintiffs) with law firms. A plaintiff submits a lead, it's routed to a firm by state and type of case, the firm accepts or declines it, and accepted leads become cases the firm works on with the plaintiff. Admins oversee everything and reassign leads and cases between firms.

One Next.js app (TypeScript) with Postgres. The design, and the reasoning behind each decision, is in [PLANNING.md](PLANNING.md).

## Run it locally

You need [Node.js 24](https://nodejs.org) and [Docker](https://www.docker.com/).

```bash
cp .env.example .env
docker compose up -d --wait
npm install
npm run db:reset
npm run dev
```

Open http://localhost:3000. If port 3000 is taken, Next.js picks another and prints it.

- `docker compose up -d --wait` starts Postgres on port 5432 and waits until it's ready. Stop anything else using that port first.
- `npm run db:reset` creates the tables and loads the demo data. Run it again any time to start over.
- Uploaded PDFs are stored in `uploads/`.

## Demo accounts

Every account uses the password `demo`. The login page also has one-click buttons for each.

| Email | Role |
| --- | --- |
| maya@example.com | Plaintiff |
| jordan@example.com | Plaintiff |
| avery@example.com | Attorney at Alder & Finch LLP (New York) |
| sam@example.com | Paralegal at Pacific Shore Legal (California, also takes New York family law) |
| riley@example.com | Admin |

Plaintiffs who submit the lead form can also sign in with their own email and `demo`.

## Demo walkthrough

1. **Submit a lead.** Signed out, go to [/submit](http://localhost:3000/submit) and submit a New York employment case. It's routed straight to Alder & Finch.
2. **Accept it as the firm.** Sign in as Avery. The lead is in the inbox. Open it, accept it, move it to Investigation, add a private note, and upload a PDF.
3. **Follow it as the plaintiff.** Sign in with the email you used on the form. The lead shows its progress and the PDF, but not the note.
4. **Decline a lead.** As Sam, open "Custody schedule after separation" and decline it. It leaves Sam's inbox.
5. **Resolve and reassign as the admin.** Sign in as Riley.
   - Filter by firm "Unmatched" to see every lead waiting for an admin, including the one Sam declined. Assign one to a firm.
   - Open "Hit by a delivery van while cycling" to see a case that was already reassigned from Alder & Finch to Pacific Shore. Its history shows every change, and the notes show both firms' notes.
   - Reassign a case. The old firm can no longer open it, and the new firm has to accept it. The new firm sees the plaintiff's documents but not the old firm's notes.

## Tests

With Postgres running (`docker compose up -d --wait`):

```bash
npm test
```

Tests run against a separate `leads_test` database, created and reset on each run, so they never touch the demo data. They cover the schema's constraints, who can see which leads, routing, every state change (including two firms accepting at once), reassignment rules, documents, notes, and history.

GitHub Actions runs lint, typecheck, tests, and a production build on every pull request.

## Project layout

```
db/            schema.sql, demo seed data, and the reset script
src/server/    database queries and business rules (server-only)
src/app/api/   REST endpoints, kept thin: parse input, call src/server, respond
src/app/       pages for each role
src/components shared UI
```

## With more time

Real sign-in, S3 for files with virus scanning, email notifications, and monitoring. See [With More Time](PLANNING.md#with-more-time) for the full list and the order to add them.
