export function canManageCompany(
    user: { id: string; role: string } | null,
    recruiterId: string
): boolean {
    return user?.role === 'recruiter'
        && user.id === recruiterId;
}
