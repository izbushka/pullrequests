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

        return {release, current}
    })
    // Ask for PR details
    .then((branches) => {
        let sourceBranch = readlineSync.question(`Source branch [${branches.current.name}]: `);
        if (!sourceBranch) {
            sourceBranch = branches.current.name;
        }

        let targetBranch = readlineSync.question(`Target branch [${branches.release.name}]: `);
        if (!targetBranch) {
            targetBranch = branches.release.name;
        }

        let title = readlineSync.question(`Pull Request Title [${branches.current.label}]: `);
        if (!title) {
            title = branches.current.label;
        }

        let description = readlineSync.question(`Pull Request Description: `);

        return {sourceBranch, targetBranch, title, description};
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
        const prId = res.data.id;
        console.log(`PR created: https://bitbucket.org/${config.bitbucket.workspace}/${config.bitbucket.repo_slug}/pull-requests/${prId}`)
    }).catch((e) => {
    console.log(e)
});



