#!/usr/bin/env node
'use strict';

const config = require('../libs/configure');

const readlineSync = require('readline-sync');
const {Bitbucket} = require('bitbucket');
const simpleGit = require('simple-git');
const bitbucket = new Bitbucket(config.bitbucket);
const git = simpleGit({baseDir: process.cwd()});


(async () => {
    const branches = await getBranches();
    console.log(branches.release.name);
})();


function getBranches() {
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
    });    
}

  