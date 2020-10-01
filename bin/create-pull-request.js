#!/usr/bin/env node
'use strict';

const config = require('../libs/configure');

const readlineSync = require('readline-sync');
const {Bitbucket} = require('bitbucket');
const simpleGit = require('simple-git');
const bitbucket = new Bitbucket(config.bitbucket);
const git = simpleGit({baseDir: process.cwd()});

git.branch({'--sort': '-committerdate'})
    // Get Current and Latest Release Branches
    .then((branches) => {
        const release = Object.values(branches.branches).find(
            (branch) => branch.name.indexOf('release/') === 0
        );

        const current = Object.values(branches.branches).find(
            (branch) => branch.current
        );

        return {release: release || {}, current, all: Object.values(branches.branches).map((item) => item.name)}
    })
    // Ask for PR details
    .then((branches) => {
        let sourceBranch = readlineSync.question(`Source branch (L - list) [${branches.current.name}]: `);
        if (!sourceBranch) {
            sourceBranch = branches.current.name;
        } else if (sourceBranch === 'L') {
            sourceBranch = selectBranch(branches.all);
        }

        let targetBranch = readlineSync.question(`Target branch (L - list) [${branches.release.name}]: `);
        if (!targetBranch) {
            targetBranch = branches.release.name;
        } else if (targetBranch === 'L') {
            targetBranch = selectBranch(branches.all);
        }

        let title = readlineSync.question(`Pull Request Title [${branches.current.label}]: `);
        if (!title) {
            title = branches.current.label;
        }

        let description = readlineSync.question(`Pull Request Description: `);

        let close = readlineSync.question('Close source branch after merge [Y/n]: ');
        close = close !== 'n';

        return {sourceBranch, targetBranch, title, description,};
    })
    // Create Pull Request
    .then((pr) => {
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
                reviewers: config.reviewers,
            },
            workspace: config.bitbucket.workspace,
            repo_slug: config.bitbucket.repo_slug,
        };
        return bitbucket.pullrequests.create(pullRequestParams)
    })
    .then((res) => {
        try {
            const prId = res.data.id;
            console.log(`"-----------\nPR CREATED: https://bitbucket.org/${config.bitbucket.workspace}/${config.bitbucket.repo_slug}/pull-requests/${prId}\n----------`);
            if (prId) {
                let ok = readlineSync.question(`Merge branch without approval [y/N]: `);
                if (ok === 'y') {
                    return mergePR(prId);
                }
            }
            return false;
        } catch {
            console.log('Looks like PR is not created');
            return false;
        }
    })
    .then((res) => {
        if (!res || !res.data) {
            return;
        }

        if (res.data.state !== 'MERGED') {
            console.log(`Unable to merge PR ${pr.data.id}`)
            process.exit();
        }

        console.log('Merged successfully');
    })
    .catch((e) => {
        console.log("-----------\nGOT ERROR!\n    " + e.message);
        if (e.error && e.error.error) {
            console.log("    MESSAGE: " + e.error.error.message + "\n----------\n");
            console.log(e)
        }
    });


function mergePR(pull_request_id) {
    const pullRequestParams = {
        workspace: config.bitbucket.workspace,
        repo_slug: config.bitbucket.repo_slug,
        pull_request_id
    };
    return bitbucket.pullrequests.merge(pullRequestParams)
}

function selectBranch(branches) {
    console.log("Select branch: ");
    branches.forEach((item, idx) => {
        console.log(`   ${idx}. ${item}`);
    });
    let selectedBranch = readlineSync.question('Branch id: ');   
    console.log(`Selected branch: ${branches[selectedBranch]}`);
    return branches[selectedBranch];
}