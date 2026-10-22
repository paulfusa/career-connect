import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deleteJobPosting } from './job-posting-delete.ts';

const postingId = 'd2719f0a-98a7-4a21-8b67-123456789abc';

test('job posting deletion: non-recruiters cannot delete postings', async () => {
	let removeCalled = false;
	const result = await deleteJobPosting({ id: 'user-1', role: 'job_seeker' }, postingId, async () => {
		removeCalled = true;
		return postingId;
	});

	assert.deepEqual(result, { status: 'forbidden' });
	assert.equal(removeCalled, false);
});

test('job posting deletion: invalid posting IDs are not deleted', async () => {
	let removeCalled = false;
	const result = await deleteJobPosting(
		{ id: 'recruiter-1', role: 'recruiter' },
		'not-a-uuid',
		async () => {
			removeCalled = true;
			return postingId;
		}
	);

	assert.deepEqual(result, { status: 'not-found' });
	assert.equal(removeCalled, false);
});

test('job posting deletion: recruiter can delete their own posting', async () => {
	const postings = [{ id: postingId, createdBy: 'recruiter-1' }];
	let removedId: string | undefined;

	const result = await deleteJobPosting(
		{ id: 'recruiter-1', role: 'recruiter' },
		postingId,
		async (id, ownerId) => {
			const index = postings.findIndex((posting) => posting.id === id && posting.createdBy === ownerId);
			if (index < 0) return null;
			removedId = postings[index].id;
			postings.splice(index, 1);
			return removedId;
		}
	);

	assert.deepEqual(result, { status: 'deleted', id: postingId });
	assert.equal(removedId, postingId);
	assert.deepEqual(postings, []);
});

test("job posting deletion: recruiter cannot delete another recruiter's posting", async () => {
	const postings = [{ id: postingId, createdBy: 'owner-1' }];

	const result = await deleteJobPosting(
		{ id: 'recruiter-2', role: 'recruiter' },
		postingId,
		async (id, ownerId) => {
			const index = postings.findIndex((posting) => posting.id === id && posting.createdBy === ownerId);
			if (index < 0) return null;
			return postings.splice(index, 1)[0].id;
		}
	);

	assert.deepEqual(result, { status: 'not-found' });
	assert.deepEqual(postings, [{ id: postingId, createdBy: 'owner-1' }]);
});

test('job posting deletion: returns not found when the posting does not exist', async () => {
	const result = await deleteJobPosting(
		{ id: 'recruiter-1', role: 'recruiter' },
		postingId,
		async () => null
	);

	assert.deepEqual(result, { status: 'not-found' });
});
