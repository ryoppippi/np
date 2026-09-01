import test from 'ava';
import {_createFixture} from '../_helpers/integration-test.js';

/** @type {ReturnType<typeof _createFixture<import('../../source/git-util.js')>>} */
const createFixture = _createFixture('../../source/git-util.js');

test('no upstream', createFixture, async () => {
	//
}, async ({t, testedModule: {hasUpstream}}) => {
	t.false(await hasUpstream());
});

test('has upstream', createFixture, async ({$$}) => {
	await $$`git init --bare remote.git`;
	await $$`git remote add origin ./remote.git`;
	await $$`git push --set-upstream origin HEAD`;
}, async ({t, testedModule: {hasUpstream}}) => {
	t.true(await hasUpstream());
});

test('upstream branch has a different name', createFixture, async ({$$}) => {
	await $$`git init --bare remote.git`;
	await $$`git remote add origin ./remote.git`;
	await $$`git push origin HEAD:refs/heads/trunk`;
	await $$`git branch --set-upstream-to=origin/trunk`;
}, async ({t, testedModule: {hasUpstream}}) => {
	t.true(await hasUpstream());
});

test('detached head', createFixture, async ({$$}) => {
	await $$`git checkout --detach`;
}, async ({t, testedModule: {hasUpstream}}) => {
	t.false(await hasUpstream());
});
