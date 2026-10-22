const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DeleteJobPostingResult =
	| { status: 'forbidden' }
	| { status: 'not-found' }
	| { status: 'deleted'; id: string };

export async function deleteJobPosting(
	user: { id: string; role: string },
	postingId: string,
	remove: (postingId: string, ownerId: string) => Promise<string | null>
): Promise<DeleteJobPostingResult> {
	if (user.role !== 'recruiter') return { status: 'forbidden' };
	if (!UUID.test(postingId)) return { status: 'not-found' };

	const id = await remove(postingId, user.id);
	return id ? { status: 'deleted', id } : { status: 'not-found' };
}
