import test from 'ava';

test('np defines `Symbol.observable` before loading rxjs', async t => {
	// `listr-input` is loaded lazily and bundles its own rxjs 6. Every copy of rxjs picks up `Symbol.observable` when it loads, so np must define it before the first one loads. Otherwise the OTP prompt's observables are rejected with “You provided an invalid object where a stream was expected”.
	await import('../source/index.js');
	const {observable} = await import('rxjs');
	// eslint-disable-next-line unicorn/no-nonstandard-builtin-properties
	t.is(observable, Symbol.observable);
});
