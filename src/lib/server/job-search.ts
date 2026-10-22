import { EMPLOYMENT_TYPES, WORK_MODES } from '../profile-options.ts';

export type JobSearch = {
    keyword: string;
    company: string;
    location: string;
    employmentType: string;
    workMode: string;
};

export function parseJobSearch(params: URLSearchParams): JobSearch {
    const employmentType = params.get('employmentType') ?? '';
    const workMode = params.get('workMode') ?? '';

    return {
        keyword: (params.get('keyword') ?? '').trim().slice(0, 100),
        company: (params.get('company') ?? '').trim().slice(0, 100),
        location: (params.get('location') ?? '').trim().slice(0, 100),
        employmentType: Object.hasOwn(EMPLOYMENT_TYPES, employmentType) ? employmentType : '',
        workMode: Object.hasOwn(WORK_MODES, workMode) ? workMode : '',
    };
}
