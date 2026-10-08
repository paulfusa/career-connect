import { pgTable, serial, integer, text, timestamp, boolean, date, uuid, index } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export const task = pgTable('task', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

const userId = () =>
	text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' });

// US-04: one profile per user; account data (name, email, photo, role) stays on `user`
export const profile = pgTable('profile', {
	userId: userId().primaryKey(),
	phone: text('phone'),
	location: text('location'),
	headline: text('headline'),
	about: text('about'),
	linkedinUrl: text('linkedin_url'),
	githubUrl: text('github_url'),
	websiteUrl: text('website_url'),
	skills: text('skills').array().notNull().default([]),
	topSkills: text('top_skills').array().notNull().default([]),
	// job preferences, used later by job search and matching
	openToWork: boolean('open_to_work').notNull().default(false),
	desiredRoles: text('desired_roles').array().notNull().default([]),
	jobTypes: text('job_types').array().notNull().default([]),
	workModes: text('work_modes').array().notNull().default([]),
	preferredLocations: text('preferred_locations').array().notNull().default([]),
	// recruiters
	company: text('company'),
	companyDomain: text('company_domain'),
	jobTitle: text('job_title'),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const experience = pgTable(
	'experience',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: userId(),
		title: text('title').notNull(),
		company: text('company').notNull(),
		companyDomain: text('company_domain'),
		employmentType: text('employment_type'),
		location: text('location'),
		startDate: date('start_date').notNull(),
		endDate: date('end_date'), // null = current role
		description: text('description'),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(t) => [index('experience_user_id_idx').on(t.userId)]
);

export const education = pgTable(
	'education',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: userId(),
		school: text('school').notNull(),
		schoolDomain: text('school_domain'),
		degree: text('degree'),
		fieldOfStudy: text('field_of_study'),
		startYear: integer('start_year'),
		endYear: integer('end_year'),
		description: text('description'),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(t) => [index('education_user_id_idx').on(t.userId)]
);

export const jobPosting = pgTable(
	'job_posting',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		createdBy: text('created_by')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		company: text('company').notNull(),
		companyDomain: text('company_domain'), // from the company autocomplete, used for the logo
		location: text('location').notNull(),
		employmentType: text('employment_type').notNull(),
		workMode: text('work_mode').notNull(),
		description: text('description').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(t) => [index('job_posting_created_by_idx').on(t.createdBy), index('job_posting_created_at_idx').on(t.createdAt)]
);

// Resume PDFs live in the private `resumes` storage bucket at storagePath; this row is the record of each file
export const resume = pgTable(
	'resume',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: userId(),
		fileName: text('file_name').notNull(),
		sizeBytes: integer('size_bytes').notNull(),
		storagePath: text('storage_path').notNull().unique(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(t) => [index('resume_user_id_idx').on(t.userId)]
);

export type Profile = typeof profile.$inferSelect;
export type Resume = typeof resume.$inferSelect;
export type Experience = typeof experience.$inferSelect;
export type Education = typeof education.$inferSelect;
export type JobPosting = typeof jobPosting.$inferSelect;

export * from './auth.schema';
