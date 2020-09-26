#!/usr/bin/env node
const config = require('../libs/configure');

const readlineSync = require('readline-sync');
const {Bitbucket} = require('bitbucket');
const simpleGit = require('simple-git');
const bitbucket = new Bitbucket(config.bitbucket);
const git = simpleGit({baseDir: process.cwd()});

const branches = ['develop', 'uat'];

(async () => {
    const release = await getReleaseBranch();
    branches.unshift(release.release.name);

    let title = readlineSync.question(`Pull Request Title [${release.current.label}]: `);
    if (!title) {
        title = release.current.label;
    }

    try {
        for (let i = 0; i < branches.length - 1; i++) {
            console.log(`Creating pull request ${branches[i]} -> ${branches[i + 1]}`);

            let ok = readlineSync.question('Continue [y/N]: ');
            if (ok !== 'y') {
                process.exit();
            }

            const prData = {
                sourceBranch: branches[0],
                targetBranch: branches[1],
                title,
                description: '',
                reviewers: [],
            }

            const pr = await createPR(prData);

            if (!pr?.data?.id) {
                console.log('Unable to create PR')
                process.exit();
            }

            const res = await mergePR(pr.data.id)

            if (res?.data?.state !== 'MERGED') {
                console.log(`Unable to merge PR ${pr.data.id}`)
                process.exit();
            }

            console.log(`PR ${pr.data.id} merged`)
        }
    } catch (e) {
        console.log(e)
        console.log('Something went wrong')
    }

})();

function getReleaseBranch() {
    return git.branch({'--sort': '-committerdate'})
        // Get Current and Latest Release Branches
        .then((branches) => {
            const release = Object.values(branches.branches).find(
                (branch) => branch.name.indexOf('release/') === 0
            );

            const current = Object.values(branches.branches).find(
                (branch) => branch.current
            );

            return {release, current}
        })
}

function createPR(pr) {
    const pullRequestParams = {
        _body: {
            close_source_branch: true,
            title: pr.title,
            description: pr.description,
            destination: {
                branch: {
                    name: pr.targetBranch
                }
            },
            source: {
                branch: {
                    name: pr.sourceBranch
                }
            },
            reviewers: pr.reviewers || config.reviewers,
        },
        workspace: config.bitbucket.workspace,
        repo_slug: config.bitbucket.repo_slug,
    };
    return bitbucket.pullrequests.create(pullRequestParams)
}

function mergePR(pull_request_id) {
    const pullRequestParams = {
        workspace: config.bitbucket.workspace,
        repo_slug: config.bitbucket.repo_slug,
        pull_request_id
    };
    return bitbucket.pullrequests.merge(pullRequestParams)
}