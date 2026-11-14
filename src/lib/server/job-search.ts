import { EMPLOYMENT_TYPES, JOB_SORTS, POSTED_WITHIN, WORK_MODES } from '../profile-options.ts';

export type JobSearch = {
    keyword: string;
    company: string;
    location: string;
    employmentType: string;
    workMode: string;
    minSalary: string;
    postedWithin: string;
    openOnly: string;
    sort: string;
    following: string;
};

export function parseJobSearch(params: URLSearchParams): JobSearch {
    const employmentType = params.get('employmentType') ?? '';
    const workMode = params.get('workMode') ?? '';
    const postedWithin = params.get('postedWithin') ?? '';
    const sort = params.get('sort') ?? '';
    const minSalary = (params.get('minSalary') ?? '').trim();

    return {
        keyword: (params.get('keyword') ?? '').trim().slice(0, 100),
        company: (params.get('company') ?? '').trim().slice(0, 100),
        location: (params.get('location') ?? '').trim().slice(0, 100),
        employmentType: Object.hasOwn(EMPLOYMENT_TYPES, employmentType) ? employmentType : '',
        workMode: Object.hasOwn(WORK_MODES, workMode) ? workMode : '',
        postedWithin: Object.hasOwn(POSTED_WITHIN, postedWithin) ? postedWithin : '',
        sort: Object.hasOwn(JOB_SORTS, sort) ? sort : '',
        // US-28: only whole numbers up to 7 digits count as a salary
        minSalary: /^\d{1,7}$/.test(minSalary) ? minSalary : '',
        // a ticked checkbox sends 'on', an unticked one sends nothing
        openOnly: params.get('openOnly') === 'on' ? 'on' : '',
        // US-19: only jobs from recruiters you follow
        following: params.get('following') === 'on' ? 'on' : '',
    };
}

// US-28: the oldest posting date that still counts for "posted in the last N days"
export function postedAfter(postedWithin: string, now: Date): Date | null {
    if (!postedWithin) return null; // no date picked, so no limit
    const days = Number(postedWithin);
    return new Date(now.getTime() - days * (1000 * 60 * 60 * 24));
}
