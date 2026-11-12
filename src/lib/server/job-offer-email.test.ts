
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jobOfferEmailHtml } from './email-template.ts';

const offerUrl = 'https://careerconnect.example/applications';

test('job offer email: displays a congratulatory message', () => {
    const html = jobOfferEmailHtml(offerUrl);

    assert.match(html, /Congratulations!/);
    assert.match(html, /job offer/i);
    assert.match(html, /CareerConnect/);
});

test('job offer email: includes the applications link', () => {
    const html = jobOfferEmailHtml(offerUrl);

    assert.ok(html.includes(`href="${offerUrl}"`));
    assert.match(html, /View My Job Offer/);
});

test('job offer email: does not expose offer details', () => {
    const html = jobOfferEmailHtml(offerUrl);

    assert.doesNotMatch(html, /salary/i);
    assert.doesNotMatch(html, /next steps:/i);
    assert.doesNotMatch(html, /contract details/i);
});

test('job offer email: escapes unsafe HTML in URLs', () => {
    const unsafeUrl = 'https://example.com/?q="><script>alert(1)</script>';
    const html = jobOfferEmailHtml(unsafeUrl);

    assert.ok(html.includes('&quot;&gt;&lt;script&gt;'));
    assert.ok(!html.includes('<script>'));
});
