import { error } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { APPLICATION_STATUSES } from '$lib/profile-options';
import { db } from '$lib/server/db';
import { application, jobPosting } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

type ApplicationStatus = keyof typeof APPLICATION_STATUSES;

function isApplicationStatus(value: string | null): value is ApplicationStatus {
    return value !== null && Object.hasOwn(APPLICATION_STATUSES, value);
}

function monthKey(date: Date): string {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export const load: PageServerLoad = async ({ locals, url }) => {
    const me = locals.user;
    if (!me || me.role !== 'job_seeker') error(403, 'Only job seekers can view application analytics.');

    const applications = await db
        .select({
            id: application.id,
            jobPostingId: jobPosting.id,
            title: jobPosting.title,
            company: jobPosting.company,
            appliedAt: application.createdAt,
            status: application.status
        })
        .from(application)
        .innerJoin(jobPosting, eq(application.jobPostingId, jobPosting.id))
        .where(eq(application.userId, me.id))
        .orderBy(desc(application.createdAt));

    const rawStatus = url.searchParams.get('status');
    const statusFilter = isApplicationStatus(rawStatus) ? rawStatus : '';
    const statusCounts = Object.keys(APPLICATION_STATUSES).filter(isApplicationStatus).map((status) => ({
        status,
        label: APPLICATION_STATUSES[status],
        count: applications.filter((item) => item.status === status).length
    }));

    const now = new Date();
    const months = Array.from({ length: 12 }, (_, index) => {
        const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + index, 1));
        return {
            key: monthKey(month),
            label: new Intl.DateTimeFormat('en-CA', {
                month: 'short',
                year: '2-digit',
                timeZone: 'UTC'
            }).format(month),
            count: 0
        };
    });
    const monthCounts = new Map(months.map((month) => [month.key, 0]));

    for (const item of applications) {
        const key = monthKey(item.appliedAt);
        const count = monthCounts.get(key);
        if (count !== undefined) monthCounts.set(key, count + 1);
    }

    for (const month of months) month.count = monthCounts.get(month.key) ?? 0;

    return {
        applications: statusFilter
            ? applications.filter((item) => item.status === statusFilter)
            : applications,
        totalApplications: applications.length,
        statusCounts,
        months,
        maxMonthlyApplications: Math.max(1, ...months.map((month) => month.count)),
        statusFilter
    };
};
