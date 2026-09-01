import test from 'ava';
import handleNpmError from '../../source/npm/handle-npm-error.js';

const makeError = ({code, stdout, stderr}) => ({
	code,
	stdout: stdout ?? '',
	stderr: stderr ?? '',
});

test('error code 402 - privately publish scoped package', t => {
	t.throws(
		() => handleNpmError(makeError({code: 402})),
		{message: 'You cannot publish a scoped package privately without a paid plan. Did you mean to publish publicly?'},
	);

	t.throws(
		() => handleNpmError(makeError({stderr: 'npm ERR! 402 Payment Required'})),
		{message: 'You cannot publish a scoped package privately without a paid plan. Did you mean to publish publicly?'},
	);
});

test('error code 402 - npm 10+ log prefix', t => {
	t.throws(
		() => handleNpmError(makeError({stderr: 'npm error code E402\nnpm error 402 Payment Required - PUT https://registry.npmjs.org/@scope%2fname - You must sign up for private packages'})),
		{message: 'You cannot publish a scoped package privately without a paid plan. Did you mean to publish publicly?'},
	);
});
