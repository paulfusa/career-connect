import { APPLICATION_STATUSES } from '../profile-options.ts';

type ApplicationStatus = keyof typeof APPLICATION_STATUSES;

export type ApplicationAnalyticsRecord = {
	status: ApplicationStatus;
	appliedAt: Date;
};

function isApplicationStatus(value: string | null): value is ApplicationStatus {
	return value !== null && Object.hasOwn(APPLICATION_STATUSES, value);
}

function monthKey(date: Date): string {
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function getApplicationAnalytics<T extends ApplicationAnalyticsRecord>(
	applications: T[],
	rawStatus: string | null,
	now = new Date()
) {
	const statusFilter = isApplicationStatus(rawStatus) ? rawStatus : '';
	const statusCounts = Object.keys(APPLICATION_STATUSES)
		.filter(isApplicationStatus)
		.map((status) => ({
			status,
			label: APPLICATION_STATUSES[status],
			count: applications.filter((application) => application.status === status).length
		}));

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

	for (const application of applications) {
		const key = monthKey(application.appliedAt);
		const count = monthCounts.get(key);
		if (count !== undefined) monthCounts.set(key, count + 1);
	}

	for (const month of months) month.count = monthCounts.get(month.key) ?? 0;

	return {
		applications: statusFilter
			? applications.filter((application) => application.status === statusFilter)
			: applications,
		totalApplications: applications.length,
		statusCounts,
		months,
		maxMonthlyApplications: Math.max(1, ...months.map((month) => month.count)),
		statusFilter
	};
}
