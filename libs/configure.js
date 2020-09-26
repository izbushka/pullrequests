'use strict';

const fs = require('fs')
const envFile = `${__dirname}/../config/.env`;
if (!fs.existsSync(envFile)) {
    console.log(`Please create environment file first: ${envFile}`)
    process.exit();
}
require('dotenv').config({ path: envFile})

const users = require('../config/reviewers');
const reviewers = JSON.parse(process.env.Reviewers).map((user) => users[user])

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

exports.bitbucket = bitbucketOptions;
exports.reviewers = reviewers;
