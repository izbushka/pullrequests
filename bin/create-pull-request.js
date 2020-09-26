#!/usr/bin/env node
const fs = require('fs')
const envFile = `${__dirname}/../config/.env`;
if (!fs.existsSync(envFile)) {
    console.log(`Please create environment file first: ${envFile}`)
    process.exit();
}
require('dotenv').config({ path: envFile})

const USERS = require('../config/reviewers');
const REVIEWERS = JSON.parse(process.env.Reviewers).map((user) => USERS[user])

const bitbucketOptions = {
    auth: {
        username: process.env.BitBucketUser,
        password: process.env.BitBucketPass,
    },
    repo_slug: process.env.Repository,
    workspace: process.env.Workspace,
    // remove api updates notice
    notice: false
}
const gitOptions = { baseDir: process.cwd() };

const readlineSync = require('readline-sync');
const { Bitbucket } = require('bitbucket');
const simpleGit = require('simple-git');

const bitbucket = new Bitbucket(bitbucketOptions);
const git = simpleGit(gitOptions);

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
                reviewers: REVIEWERS,
            },
            workspace: bitbucketOptions.workspace,
            repo_slug: bitbucketOptions.repo_slug,
        };
        return bitbucket.pullrequests.create(pullRequestParams)
    })
    .then((res) => {
        const prId = res.data.id;
        console.log(`PR created: https://bitbucket.org/${bitbucketOptions.workspace}/${bitbucketOptions.repo_slug}/pull-requests/${prId}`)
    }).catch((e) => {
        console.log(e)
    });



