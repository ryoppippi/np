import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'ava';
import {writePackage} from 'write-package';
import {getFilesToBePacked} from '../../../source/npm/util.js';
import {createIntegrationTest} from '../../_helpers/integration-test.js';
import {runIfExists} from '../../_helpers/util.js';

const getFixture = name => path.resolve('test', 'fixtures', 'files', name);

const verifyPackedFiles = test.macro(async (t, fixture, expectedFiles, {before, after} = {}) => {
	const fixtureDirectory = getFixture(fixture);

	await runIfExists(before, fixtureDirectory);
	t.teardown(async () => runIfExists(after, fixtureDirectory));

	const files = await getFilesToBePacked(fixtureDirectory);
	t.deepEqual(files.toSorted((a, b) => a.localeCompare(b)), [...expectedFiles, 'package.json'].toSorted((a, b) => a.localeCompare(b)), 'Files different from expectations!');
});

test('package.json files field - one file', verifyPackedFiles, 'one-file', [
	'index.js',
]);

test('package.json files field - source dir', verifyPackedFiles, 'source-dir', [
	'source/foo.js',
	'source/bar.js',
]);

test('package.json files field - source and dist dirs', verifyPackedFiles, 'source-and-dist-dir', [
	'source/foo.js',
	'source/bar.js',
]);

test('package.json files field - leading slash', verifyPackedFiles, 'files-slash', [
	'index.js',
]);

test('package.json files field - has readme and license', verifyPackedFiles, 'has-readme-and-license', [
	'readme.md',
	'license.md',
	'index.js',
]);

test('npmignore', verifyPackedFiles, 'npmignore', [
	'readme.md',
	'index.js',
	'index.d.ts',
]);

test('package.json files field and npmignore', verifyPackedFiles, 'files-and-npmignore', [
	'readme.md',
	'source/foo.js',
	'source/bar.js',
	'source/index.d.ts',
]);

test('package.json files field and gitignore', verifyPackedFiles, 'gitignore', [
	'readme.md',
	'dist/index.js',
]);

test('npmignore and gitignore', verifyPackedFiles, 'npmignore-and-gitignore', [
	'readme.md',
	'dist/index.js',
]);

test('package.json main field not in files field', verifyPackedFiles, 'main', [
	'foo.js',
	'bar.js',
]);

test('doesn\'t show files in .github', verifyPackedFiles, 'dot-github', [
	'index.js',
]);

test('handles prepare script output (e.g., Husky)', verifyPackedFiles, 'prepare-script', [
	'index.js',
]);

test('ignores failing prepack script', verifyPackedFiles, 'failing-prepack-script', [
	'index.js',
]);

const verifyDevEnginesPackageManager = test.macro(async (t, packageManager) => {
	await createIntegrationTest(t, async ({temporaryDirectory}) => {
		await writePackage(temporaryDirectory, {
			name: 'fixture',
			version: '1.0.0',
			files: ['index.js'],
			devEngines: {
				packageManager,
			},
		});
		await fs.writeFile(path.join(temporaryDirectory, 'index.js'), '');

		// `npm pack` must not block inspection based on the package's development manager.
		const files = await getFilesToBePacked(temporaryDirectory);
		t.deepEqual(files.toSorted((left, right) => left.localeCompare(right)), ['index.js', 'package.json']);
	});
});

test('works when the package requires a different package manager', verifyDevEnginesPackageManager, {
	name: 'pnpm',
	version: '11.15.1',
	onFail: 'download',
});

test('works when the package requires a different npm version', verifyDevEnginesPackageManager, {
	name: 'npm',
	version: '<0.0.0',
	onFail: 'error',
});

test('works when the package lists multiple other package managers', verifyDevEnginesPackageManager, [
	{
		name: 'pnpm',
		version: '11.15.1',
		onFail: 'error',
	},
	{
		name: 'yarn',
		version: '4.0.0',
		onFail: 'error',
	},
]);
