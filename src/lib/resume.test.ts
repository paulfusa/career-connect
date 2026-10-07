// Run with: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanFileName, formatBytes, RESUME_MAX_BYTES, validateResume } from './resume.ts';

const pdfHead = new TextEncoder().encode('%PDF-1.7\n');
const pdf = { name: 'Ada Resume.pdf', type: 'application/pdf', size: 120_000 };

test('resume: accepts a real PDF', () => {
	assert.equal(validateResume(pdf, pdfHead), null);
	assert.equal(validateResume({ ...pdf, name: 'RESUME.PDF' }, pdfHead), null);
});

test('resume: rejects other formats, including ones disguised as PDFs', () => {
	const notPdf = 'Only PDF files are accepted.';
	const docx = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
	assert.equal(validateResume({ name: 'resume.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 5000 }, docx), notPdf);
	// renamed to .pdf with a PDF mime type, but the content isn't a PDF
	assert.equal(validateResume(pdf, docx), notPdf);
	// PDF content but the wrong extension or type
	assert.equal(validateResume({ ...pdf, name: 'resume.exe' }, pdfHead), notPdf);
	assert.equal(validateResume({ ...pdf, type: 'image/png' }, pdfHead), notPdf);
});

test('resume: rejects empty and oversized files', () => {
	assert.equal(validateResume({ ...pdf, size: 0 }, new Uint8Array()), 'Choose a PDF to upload.');
	assert.equal(validateResume({ ...pdf, size: RESUME_MAX_BYTES + 1 }, pdfHead), 'Use a PDF under 4 MB.');
	assert.equal(validateResume({ ...pdf, size: RESUME_MAX_BYTES }, pdfHead), null);
});

test('resume: display names are stripped of paths and control characters', () => {
	assert.equal(cleanFileName('../../etc/passwd.pdf'), 'passwd.pdf');
	assert.equal(cleanFileName('C:\\Users\\ada\\My Resume.PDF'), 'My Resume.pdf');
	assert.equal(cleanFileName('bad\u0000name\n.pdf'), 'badname.pdf');
	assert.equal(cleanFileName('.pdf'), 'Resume.pdf');
	assert.equal(cleanFileName('x'.repeat(300) + '.pdf').length, 104);
});

test('resume: sizes are readable', () => {
	assert.equal(formatBytes(120_000), '117 KB');
	assert.equal(formatBytes(2_500_000), '2.4 MB');
});
