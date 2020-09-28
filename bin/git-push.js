#!/usr/bin/env node
'use strict';

const config = require('../libs/configure');

const readlineSync = require('readline-sync');
const {Bitbucket} = require('bitbucket');
const simpleGit = require('simple-git');
const bitbucket = new Bitbucket(config.bitbucket);
const git = simpleGit({baseDir: process.cwd()});

git.push('origin', 'omuraviov/feature/4-info-popup-details', {'-u': null})