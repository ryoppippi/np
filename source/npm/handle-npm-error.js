import chalk from 'chalk';
import {
	throwError,
	catchError,
	from,
	mergeMap,
} from 'rxjs';

export default function handleNpmError(error, task, message, executor) {
	if (typeof message === 'function') {
		executor = message;
		message = undefined;
	}

	// `one-time pass` is for npm and `Two factor authentication` is for Yarn.
	if (
		error.stderr.includes('one-time pass') // Npm
		|| error.stdout.includes('Two factor authentication') // Yarn v1
		|| error.stdout.includes('One-time password:') // Yarn berry
	) {
		const {title} = task;
		task.title = `${title} ${chalk.yellow('(waiting for input…)')}`;

		const promptForOtp = listrInput => listrInput('Enter OTP:', {
			done(otp) {
				task.title = title;
				return executor(otp);
			},
			autoSubmit: value => value.length === 6,
		}).pipe(catchError(otpError => handleNpmError(otpError, task, 'OTP was incorrect, try again:', executor)));

		// `listr-input` is slow to load, so only load it when an OTP is actually needed.
		return from(import('listr-input')).pipe(mergeMap(({default: listrInput}) => promptForOtp(listrInput)));
	}

	// Attempting to privately publish a scoped package without the correct npm plan
	// https://stackoverflow.com/a/44862841/10292952
	if (
		error.code === 402
		|| error.stderr.includes('402 Payment Required') // Npm/pnpm (prefixed with `npm ERR!` before npm 10 and `npm error` since)
		|| error.stdout.includes('Response Code: 402 (Payment Required)') // Yarn Berry
	) {
		throw new Error('You cannot publish a scoped package privately without a paid plan. Did you mean to publish publicly?');
	}

	return throwError(() => error);
}
