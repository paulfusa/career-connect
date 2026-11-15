# US-30: Archive Postings and Filter Applications (#188)

# Task ID/Title
US-30 (sub-story of US-13): Add recruiter job-posting archiving, application counts, and applicant filtering.

# Purpose of AI Use
Requirements analysis, implementation, database-schema troubleshooting, unit testing, route-level acceptance testing, and validation.

# AI-Suggested Content
The implementation reuses the existing SvelteKit route actions, Drizzle schema, shared application-status labels, and Node test runner. Archive actions enforce recruiter role and ownership on the server. Archived postings remain available to their owner and to job seekers who already applied, while public job browsing and new applications exclude them. Applicant filters are URL-backed and combined server-side. Application counts are fetched in one grouped query for the recruiter's own postings.

# Validation
- `npm run test`: 314 tests passed, 0 failed.
- `pnpm check`: passed with 0 errors and 0 warnings.
- `git diff --check`: passed.
- The new filter and archive acceptance tests passed individually.
- Verified the database archive column is `boolean NOT NULL DEFAULT false`.
- The broad `pnpm db:push` statement list was not applied because it attempted to disable row-level security and modify unrelated constraints.

# Decision
Accepted / Modified. The requested archive lifecycle, archived-applicant access, application filters, and posting counts were implemented. Two route-level acceptance tests and their proposed issue descriptions were delivered; GitHub issues were not created. The database was changed only by the targeted archive-column statement.

# Reflection
The work showed the importance of checking existing database state before approving schema pushes: an unrelated table used by raw SQL was missing from the Drizzle schema, and the proposed push would have disabled row-level security. A targeted, idempotent column change preserved unrelated data and protections. The archived-applicant follow-up also demonstrated that hiding archived jobs from new seekers must not break access for candidates who already applied. Unit tests cover parsing and business rules; route-level tests verify the resulting SQL, authorization scope, and page data without connecting to the live database.

# Responsible Person
Michael Derocher

# Responses
No shareable chat URL is available. Related prompts and responses are grouped below by task.

## Prompt 1
Asked what would be required to implement issue #188, which requests that recruiters archive and restore job postings and filter applications by status and submission date.

## Response 1
Reviewed the issue's acceptance criteria and repository patterns. Identified the need for an archive field and owner-scoped actions, public-visibility and application guards, an Active/Archived view, application counts, and status/date filters on each posting's applicants page.

## Prompt 2
Requested implementation of archiving and application behavior, then reported database-push prompts and a bug where applicants could see an archived job in their application history but received a 404 when opening it.

## Response 2
Added `archived` to the job-posting schema, implemented recruiter-only archive/unarchive actions scoped by posting ID and recruiter ID, and added Active/Archived tabs. Public job listings exclude archived postings; the application action rejects archived jobs. Existing applicants can still view an archived posting, while other job seekers and non-owner recruiters cannot.

The schema field is:

```ts
archived: boolean('archived').default(false).notNull(),
```

The archive action updates only a posting owned by the signed-in recruiter:

```ts
.update(jobPosting)
.set({ archived: true, updatedAt: new Date() })
.where(and(eq(jobPosting.id, id), eq(jobPosting.createdBy, me.id)))
.returning({ id: jobPosting.id });
```

The public listing query excludes archived postings; the recruiter's own view selects either active or archived postings:

```ts
mine
	? and(eq(jobPosting.createdBy, locals.user!.id), eq(jobPosting.archived, archivedView))
	: and(
			eq(jobPosting.archived, false),
			or(eq(jobPosting.published, true), eq(jobPosting.createdBy, locals.user!.id))
		)
```

The application action loads the archive flag and applies the existing server-side validation:

```ts
archived: jobPosting.archived,
// ...
const problem = applyProblem(job, !!existing, todayEastern());
```

For the archived-posting 404 bug, added `canViewJobPosting` and moved the current user's application lookup before the access check. Owners can always view their postings; a job seeker can view an archived posting only if they already applied:

```ts
if (posting.createdBy === viewer.id) return true;
if (!posting.published) return false;
if (!posting.archived) return true;
return viewer.role === 'job_seeker' && hasApplied;
```

The application submission helper independently rejects archived jobs, so allowing an existing applicant to view a posting does not permit new applications.

Database troubleshooting found that `password_reset_cooldown` was used by the forgot-password route's raw SQL but was absent from the Drizzle schema. Added its matching declaration and removed the unused `task` declaration:

```ts
export const passwordResetCooldown = pgTable('password_reset_cooldown', {
	emailHash: text('email_hash').primaryKey(),
	lastRequestedAt: timestamp('last_requested_at', { withTimezone: true }).defaultNow().notNull()
});
```

After the user aborted `pnpm db:push`, the proposed statement list was found to disable row-level security and alter unrelated constraints. Those statements were not applied. With the user's authorization, only the archive column was added and verified in the database:

```sql
ALTER TABLE public.job_posting
ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
```

No other database changes were applied.

## Prompt 3
Requested applicant filters by status and submission date, then requested application counts in the recruiter's Active/Archived posting lists and small layout adjustments to the Filter button.

## Response 3
Added validated status/date query filters to the recruiter applicants page. Supported statuses come from the existing `APPLICATION_STATUSES`; date ranges are a rolling 7 days, 30 days, or any time. Filter values are loaded from URL query parameters, so they remain selected after submission. The page combines the posting, status, and date conditions in its database query and distinguishes an empty filter result from a posting with no applications.

```ts
const filters = parseApplicationFilters(url.searchParams);
const conditions = [eq(application.jobPostingId, posting.id)];
if (filters.status) conditions.push(eq(application.status, filters.status));
const submittedAfter = applicationsSubmittedAfter(filters.dateRange, now);
if (submittedAfter) conditions.push(gte(application.createdAt, submittedAfter));

// ...
.where(and(...conditions))
```

The filter parser accepts only known statuses and the supported date ranges:

```ts
return {
	status: isApplicationStatus(status) ? status : '',
	dateRange: dateRange === '7' || dateRange === '30' ? dateRange : ''
};
```

The filter controls use those parsed values as their selected values:

```svelte
<select name="status" value={data.filters.status} class={field}>
	<option value="">All statuses</option>
	{#each Object.entries(APPLICATION_STATUSES) as [value, label] (value)}
		<option {value}>{label}</option>
	{/each}
</select>

<select name="dateRange" value={data.filters.dateRange} class={field}>
	<option value="">Any time</option>
	<option value="7">Last 7 days</option>
	<option value="30">Last 30 days</option>
</select>
```

Added grouped application counts for the recruiter's own postings, including archived postings. Public listings do not query or expose actual counts; postings with no applications show zero in the recruiter's view:

```ts
const applicationCounts = mine && postings.length
	? await db
			.select({ jobPostingId: application.jobPostingId, total: count() })
			.from(application)
			.where(inArray(application.jobPostingId, postings.map((posting) => posting.id)))
			.groupBy(application.jobPostingId)
	: [];
```

The posting card displays singular or plural application totals:

```svelte
{#if data.mine}
	<p class="text-xs font-medium text-ink/60">
		{posting.applicationCount ?? 0}
		{(posting.applicationCount ?? 0) === 1 ? 'application' : 'applications'}
	</p>
{/if}
```

Adjusted the Filter button's horizontal spacing, fixed its overall height, and aligned it vertically with Clear filters.

## Prompt 4
Asked whether more unit and acceptance tests were needed, then requested acceptance tests one at a time, with an issue description for each.

## Response 4
Existing unit tests cover archived application rejection, archived-posting visibility, status/date filter parsing, invalid values, and rolling date cutoffs. Added two route-level acceptance tests using the repository's fake-database test pattern:

- `tests/application-filters.test.ts` verifies the applicants route combines the Interview and last-7-days filters, includes the cutoff in its SQL, and returns the selected values.
- `tests/job-posting-archive.test.ts` verifies owner-scoped archive/restore actions, denial of another recruiter's unarchive attempt, exclusion from public listings, and the owner's archived view with application counts.
- `tests/job-posting-application-counts.test.ts` covers counts for active and archived postings and confirms public listings do not query or expose counts.

Descriptions for GitHub acceptance-test issues were provided to the user; no issues were created.

Representative acceptance-test assertions:

```ts
assert.match(applicantQuery.sql, /"application"\."status" = \$/);
assert.match(applicantQuery.sql, /"application"\."created_at" >= \$/);
assert.equal(result.filters.status, 'interview');
assert.equal(result.filters.dateRange, '7');
```

```ts
assert.match(archiveCondition.sql, /"job_posting"\."created_by" = \$/);
assert.equal(archivedJobs.archivedView, true);
assert.equal(archivedJobs.postings[0].applicationCount, 2);
assert.ok(publicCondition.params.includes(false));
```
