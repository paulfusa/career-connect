# Deadline reminders (US-26, Task 26.6)

The standalone `pnpm reminders:deadlines` job creates persistent in-app reminders
for verified recruiters (and admins, US-06) about their own open, published postings. It does not send
pre-application reminders to job seekers: saved jobs and reminder subscriptions
are not implemented. Existing overdue-decision indicators are separate.

Eligibility uses PostgreSQL's statement time converted to `America/Toronto`, from
today through today plus three calendar days, inclusive. Applications remain valid
through the entire deadline day. Wording says applications are accepted through
the stated date in Toronto time; it does not treat a date-only deadline as UTC
midnight or a 72-hour window.

One atomic insert-from-select checks eligibility and inserts reminders. A unique
key includes the posting, recipient, deadline date and `within_3_days` window.
Repeated or overlapping executions cannot insert the same key twice. A deadline
edit permits a reminder for the new date; reverting to an already-reminded date
does not create another reminder. Later job closure does not retract notifications
already created from an eligible statement snapshot. No notification UI is added.

## Default-off activation and credentials

`.github/workflows/deadline-reminders.yml` supports **manual dispatch only**. The
entire job is gated on the repository variable `DEADLINE_REMINDERS_ENABLED` being
set to the literal JSON boolean `true` and the selected ref being the repository's
default branch. An unset or false value keeps it disabled. Other values fail
closed; a malformed boolean can fail condition evaluation without running the job.
The same job gate must remain in place for any future automatic schedule.

The runner reads only `REMINDER_DATABASE_URL`, with no `DATABASE_URL` fallback and
no automatic `.env` loading. Missing credentials cause a nonzero exit before any
connection is created. The workflow exposes the dedicated secret only to its
execution step, never to dependency installation, ordinary CI or unit tests.
Credentials and raw database errors must never be written to source or logs.

Use a dedicated least-privilege PostgreSQL role where practical: SELECT on the
required `job_posting` fields (`id`, `created_by`, `title`, `status`, `published`,
`application_deadline`) and `user` fields (`id`, `role`, `email_verified`), INSERT
on `notification`, and SELECT on returned notification IDs. Verify actual grants
and any RLS policies in an isolated database. The runner requires TLS and uses
one connection with bounded connection, statement and shutdown timeouts.

Before anyone enables execution, the team must confirm the required schema is
deployed, pass isolated PostgreSQL integration tests, verify dedicated credentials
and permissions, and explicitly approve activation. Only then may maintainers
configure the secret and activation variable and authorize a manual run. These
settings are not configured by this implementation.

**Automatic scheduling remains disabled.** A later, separately approved change may
add `17 * * * *` (minute 17 hourly, UTC) while retaining the activation gate. GitHub
schedules run from the default branch and may be delayed or dropped; public-repo
schedules can be disabled after inactivity. Until that change, this feature is
not automatically operational. After activation, retrying within the window is
safe; outages beyond it can miss reminders. Expired reminders are not backfilled.

## Validation before activation

`pnpm test` covers actual SQL construction with nonconnecting Drizzle mocks and
runner lifecycle with injected I/O. Tests never use live database credentials.
The CLI safety check removes both database variables and verifies missing-secret
failure without a connection. Run `pnpm check` as well.

Before activation, use a disposable PostgreSQL database, never shared Supabase,
to verify today/+1/+3/+4/expired/null deadlines, Toronto midnight and DST,
month/year boundaries, closed/unpublished jobs, unverified/non-recruiter owners,
repeat/concurrent execution, edited deadlines, rollback/retry, and least-privilege
access. Unit tests do not establish PostgreSQL date or concurrency behavior.
Observe aggregate inserted counts and workflow failure status after approved
runs; no external monitoring or automatic retry infrastructure is provisioned.
