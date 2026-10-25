export type OutcomeInput = {
	status: string;
	message: string;
	nextSteps: string;
};

export type OutcomeErrors = Partial<Record<keyof OutcomeInput, string>>;
export type OutcomeParse =
	| { ok: true; values: OutcomeInput }
	| { ok: false; errors: OutcomeErrors; values: OutcomeInput };

const MESSAGE_LIMIT = 2000;
const MESSAGE_MIN = 100;

export function parseOutcome(data: FormData): OutcomeParse {
	const errors: OutcomeErrors = {};
	const values: OutcomeInput = {
		status: data.get('status')?.toString() ?? '',
		message: data.get('message')?.toString().trim() ?? '',
		nextSteps: data.get('nextSteps')?.toString().trim() ?? ''
	};

	if (values.status !== 'offered' && values.status !== 'rejected') errors.status = 'Choose to offer the job or reject the application.';
	if (values.message.length < MESSAGE_MIN) errors.message = `Please explain your decision in at least ${MESSAGE_MIN} characters.`;
	else if (values.message.length > MESSAGE_LIMIT) {
		errors.message = `Your reasons must be ${MESSAGE_LIMIT} characters or fewer.`;
	}
	if (values.status === 'offered') {
		if (values.nextSteps.length === 0) errors.nextSteps = 'Explain the next steps and how to respond to the offer.';
		else if (values.nextSteps.length > MESSAGE_LIMIT) errors.nextSteps = `Next steps must be ${MESSAGE_LIMIT} characters or fewer.`;
	} else {
		values.nextSteps = '';
	}
	return Object.keys(errors).length ? { ok: false, errors, values } : { ok: true, values };
}
