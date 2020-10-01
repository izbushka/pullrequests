# pullrequests
Helper to Create BitBuckets Pull Request

## Installation
`npm install`

create `.env` file in `config` directory using example `.env.example`

Probably you'll need to add reviewers in `/config/reviewers.json`

## Usage
**It finds automatically current release branch by 'release/' prefix and last commit date in it**

### Create Pull Requests
From the current branch to the latest release by default but you'd be asked to change
 
in your project repository run:
```node /path-to-this-repo/bin/create-pull-request.js```

### Merge release branch to UAT
in your project repository run:
```node /path-to-this-repo/bin/release-to-uat.js```

## BitBucket API Lib
https://bitbucketjs.netlify.app/
