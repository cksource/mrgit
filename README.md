# Mr. Git

![Mrgit npm package badge](https://img.shields.io/npm/v/mrgit.svg)
[![Build Status](https://circleci.com/gh/cksource/mrgit.svg?style=shield)](https://app.circleci.com/pipelines/github/ckeditor/mrgit?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/cksource/mrgit/badge.svg?branch=master)](https://coveralls.io/github/ckeditor/ckeditor5-vue2?branch=master)
![Dependency Status](https://img.shields.io/librariesio/release/npm/mrgit)

Multi-repo manager for git. A tool for managing projects build using multiple repositories.

`mrgit` is designed to work with [yarn workspaces](https://yarnpkg.com/lang/en/docs/workspaces/) and [Lerna](https://github.com/lerna/lerna) out of the box, hence, it mixes the "package" and "repository" concepts. In other words, every repository is meant to be a single [npm](https://npmjs.com) package. It doesn't mean that you must use it with Lerna and npm, but don't be surprised that mrgit talks about "packages" and works best with npm packages.

# Table of content

1. [Installation](#installation)
1. [Usage](#usage)
1. [Configuration](#configuration)
    1. [The `dependencies` option](#the-dependencies-option)
    1. [The `presets` option](#the-presets-option)
    1. [The `$rootRepository` option](#the-rootrepository-option)
    1. [Recursive cloning](#recursive-cloning)
    1. [Cloning repositories on CI servers](#cloning-repositories-on-ci-servers)
    1. [Base branches](#base-branches)
1. [Commands](#commands)
    1. [`sync`](#sync)
    1. [`pull`](#pull)
    1. [`push`](#push)
    1. [`fetch`](#fetch)
    1. [`exec`](#exec)
    1. [`commit` or `ci`](#commit-alias-ci)
    1. [`close`](#close)
    1. [`save`](#save)
    1. [`status` or `st`](#status-alias-st)
    1. [`diff`](#diff)
    1. [`checkout` or `co`](#checkout-alias-co)
1. [Projects using mrgit](#projects-using-mrgit)

## Installation

```bash
npm install -g mrgit
```

Use:

```bash
mrgit --help
```

## Usage

First, create a configuration file `mrgit.json`:

```json
{
  "dependencies": {
    "@ckeditor/ckeditor5-engine": "ckeditor/ckeditor5-engine",
    "mrgit": "cksource/mrgit"
  }
}
```

(Keys of the `dependencies` object are package names and values are repository URLs (GitHub identifiers in this case). Read more about the [`dependencies` option](#the-dependencies-option).)

And run `mrgit sync` to clone all the repositories. By default, they will be cloned to `<cwd>/packages/` directory:

```bash
packages/
  ckeditor5-engine/
  mrgit/
```

## Configuration

CLI options:

```
--branch                    For "save" command: whether to save branch names.
                            For "checkout" command: name of branch that would be created.

--hash                      Whether to save current commit hashes. Used only by "save" command.

--ignore                    Ignores packages which names match the given glob pattern. E.g.:
                            > mrgit exec --ignore="foo*" "git status"

                            Will ignore all packages which names start from "foo".
                            Default: null

--message                   Message that will be used as an option for git command. Required for "commit"
                            command but it is also used by "close" command (append the message to the default).

--packages                  Directory to which all repositories will be cloned or are already installed.
                            Default: '<cwd>/packages/'

--recursive                 Whether to install dependencies recursively. Used only by "sync" command.

--resolver-path             Path to a custom repository resolver function.
                            Default: '@mrgit/lib/default-resolver.js'

--resolver-url-template     Template used to generate repository URL out of a
                            simplified 'organization/repository' format of the dependencies option.
                            Default: 'git@github.com:${ path }.git'.

--resolver-directory-name   Defines how the target directory (where the repository will be cloned)
                            is resolved. Supported options are: 'git' (default), 'npm'.

                            * If 'git' was specified, then the directory name will be extracted from
                            the git URL (e.g. for 'git@github.com:a/b.git' it will be 'b').
                            * If 'npm' was specified, then the package name will be used as a directory name.

                            This option can be useful when scoped npm packages are used and one wants to decide
                            whether the repository will be cloned to packages/@scope/pkgname' or 'packages/pkgname'.
                            Default: 'git'

--resolver-default-branch   The branch name to use if not specified in mrgit.json dependencies.
                            Default: master

--scope                     Restricts the command to packages which names match the given glob pattern.
                            Default: null

--preset                    Uses an alternative set of dependencies defined in the config file.

--skip-root                 Allows skipping root repository when executing command,
                            if "$rootRepository" is defined in the config file.
```

All these options can also be specified in `mrgit.json` (options passed through CLI takes precedence):

```json
{
    "packages": "/workspace/modules",
    "resolverDirectoryName": "npm",
    "resolverDefaultBranch": "dev",
    "dependencies": {
        "foo": "bar"
    }
}
```

### The `dependencies` option

This option specifies repositories which `mrgit` is supposed to clone. It can also clone its dependencies recursively (see [Recursive cloning](#recursive-cloning)).

The dependency keys can be any strings, but it's recommended to use package names (e.g. npm package names, just like in `package.json`). The values are repository URLs which `mrgit` will clone.

Examples:

```json5
// Clone 'git@github.com:cksource/foo.git' and check out to 'master'.
{
    "foo": "git@github.com:cksource/foo.git"
}
```

```json5
// Short format. Clone 'git@github.com:cksource/foo.git' and check out to branch 'dev'.
{
    "@cksource/foo": "cksource/foo#dev"
}
```

```json5
// Clone 'https://github.com/cksource/foo.git' (via HTTPS) and check out to tag 'v1.2.3'.
{
    "foo": "https://github.com/cksource/foo.git@v1.2.3"
}
```

```json5
// Clone 'cksource/foo' and check out to the latest available tag.
{
    "foo": "cksource/foo@latest"
}
```

### The `presets` option

This option allows the user to switch between different states of dependencies easily. When using any command with the `--preset` option, it will behave as if the `dependencies` option was using values from the given preset. Dependencies not specified in the preset but in the `dependencies` object will use a version from the latter as a fallback.

Example:

```json5
{
    "presets": {
        "dev": {
            "@cksource/foo": "cksource/foo#dev"
        },
        "example-feature": {
            "@cksource/foo": "cksource/foo#i/1-example-feature",
            "@cksource/bar": "cksource/foo#i/1-example-feature"
        }
    }
}
```

### The `$rootRepository` option

`mrgit` allows executing git commands in the root repository as well. If such behavior is desired, configure the `$rootRepository` option in the config. When configured, the requested command (e.g. `pull`) will be executed in the root repository and in all defined dependencies. Additionally, the `$rootRepository` key can be included in any preset, and will work accordingly to presets logic.

If the `$rootRepository` option is configured you can still disable this feature with the `--skip-root` CLI option.

Not all commands support execution in the root repository. If a command does not support this feature, it is executed normally, without affecting the root repository. Currently supported commands are:

 - `checkout`
 - `commit`
 - `diff`
 - `exec`
 - `fetch`
 - `pull`
 - `push`
 - `status`
 - `sync`

Example config:

```json5
{
    "packages": "/workspace/modules",
    "$rootRepository": "cksource/root-repository",
    "dependencies": {
       "@cksource/foo": "cksource/foo"
    },
    "presets": {
        "dev": {
           "@cksource/foo": "cksource/foo#dev",
            "$rootRepository": "cksource/root-repository#dev"
        }
    }
}
```

### Recursive cloning

When the `--recursive` option is used `mrgit` will clone repositories recursively. First, it will clone the `dependencies` specified in `mrgit.json` and, then, their `dependencies` and `devDependencies` specified in `package.json` files located in cloned repositories.

However, `mrgit` needs to know repository URLs of those dependencies, as well as which dependencies to clone (usually, only the ones maintained by you). In order to configure that you need to use a custom repository resolver (`--resolver-path`).

Resolver is a simple Node.js module which exports the resolver function.

For example, assuming that you want to clone all `@ckeditor/ckeditor5-*` packages, your resolver could look like this:

```js
'use strict';

const parseRepositoryUrl = require( 'mrgit/lib/utils/parserepositoryurl' );

/**
 * Resolves repository URL for a given package name.
 *
 * @param {String} packageName Package name.
 * @param {Options} options The options object.
 * @returns {Repository|null}
 */
module.exports = function resolver( packageName, options ) {
    // If package name starts with '@ckeditor/ckeditor5-*' clone it from 'ckeditor/ckeditor5-*'.
    if ( packageName.startsWith( '@ckeditor/ckeditor5-' ) ) {
        const repositoryUrl = packageName.slice( 1 );

        return parseRepositoryUrl( repositoryUrl );
    }

    // Don't clone any other dependencies.
    return null;
};
```

You can also check the [default resolver](https://github.com/cksource/mrgit/blob/master/lib/default-resolver.js) used by `mrgit` and [the config object definition](https://github.com/cksource/mrgit/blob/master/lib/utils/getoptions.js).

### Cloning repositories on CI servers

CI servers, such as Travis, can't clone repositories using Git URLs (such as `git@github.com:cksource/mrgit.git`). By default, `mrgit` uses Git URLs because it assumes that you'll want to commit to these repositories (and don't want to be asked for a password every time).

If you need to run `mrgit` on a CI server, then configure it to use HTTPS URLs:

```bash
mrgit --resolver-url-template="https://github.com/\${ path }.git"
```

You can also use full HTTPS URLs to configure `dependencies` in your `mrgit.json`.

### Base branches

When you call `mrgit sync` or `mrgit co`, mrgit will use the following algorithm to determine the branch to which each repository should be checked out:

1. If a branch is defined in `mrgit.json`, use it. A branch can be defined after `#` in a repository URL. For example: `"@cksource/foo": "cksource/foo#dev"`.
2. If a tag is defined in `mrgit.json`, use it. A tag can be defined after `@` in a repository URL. Its either a specific tag name, such as `@v30.0.0`, or `@latest` tag that will look for the latest available tag.
3. If the root repository (assuming, it is a repository) is on one of the "base branches", use that branch name.
4. Otherwise, use `master` branch.

You can define the base branches as follows:

```json5
{
  // ...
  "baseBranches": [ "master", "stable" ],
  // ...
}
```

With this configuration, if the root repository is on `stable`, calling `mrgit co` will check out all repositories to `stable`. If you change the branch of the root repository to `master` and call `mrgit co`, all sub repositories will be checked out to `master`.

## Commands

```bash
$ mrgit [command]
```

For displaying help screen for specified command, type:

```bash
$ mrgit [command] --help
```

### sync

Updates dependencies. Switches repositories to correct branches or tags (specified in `mrgit.json`) and pulls changes.

If any dependency is missing, the command will install this dependency as well.

This command does not touch repositories in which there are uncommitted changes.

If in the packages directory will be located some directories that are not specified in `mrgit.json`, paths to these directories
will be printed out on the screen.

Examples:

```bash
mrgit sync --recursive
```

### pull

Pulls changes in existing repositories. It does not change branches in the repositories. It does not pull the changes if the repository contains uncommitted changes. It skips repositories that are in detached head mode (are checked out on a tag).

Examples:

```bash
mrgit pull
```

### push

Pushes changes in existing repositories. It skips repositories that are in detached head mode (are checked out on a tag).

Examples:

```bash
mrgit push
```

### fetch

Fetches changes in existing repositories.

Examples:

```bash
mrgit fetch
```

### exec

Executes specified shell command in existing repositories.

Example:

```bash
mrgit exec 'git status'

# Executes `git status` command on each repository.
```

During the task execution, `cwd` is set to the repository path:

```bash
mrgit exec 'echo `pwd`'

# /home/mrgit/packages/organization/repository-1
# /home/mrgit/packages/organization/repository-2
```

### commit (alias: `ci`)

For every repository that contains changes which can be committed, makes a commit with these files. You need to specify the message for the commit. It skips repositories that are in detached head mode (are checked out on a tag).

Example:

```bash
mrgit commit --message 'Introduce PULL_REQUEST_TEMPLATE.md.'

# Executes `git commit --message 'Introduce PULL_REQUEST_TEMPLATE.md.'` command on each repository.
# Commit will be made in repositories that "git status" returns a list if changed files (these files must be tracked by Git).
```

### close

Requires a second argument which is a branch name that will be merged to current one. You can also specify the message which will be added to the default git-merge message. Repositories which do not have specified branch will be ignored. It skips repositories that are in detached head mode (are checked out on a tag).

After merging, the merged branch will be removed from the remote and the local registry.

Example:

```bash
# Assumptions: we are on "master" branch and "develop" branch exists.
mrgit merge develop --message 'These changes are required for the future release.'

# Branch "develop" will be merged into "master".
# Branch "develop" will be removed from the origin.
```

### save

Saves hashes of packages in `mrgit.json`. It allows to easily fix project to a specific state.

Example:

```bash
mrgit save
```

If you would like to save name of branches instead of current commit, you can use an option `--branch`:

```bash
mrgit save --branch
```

### status (alias: `st`)

Prints a table which contains useful information about the status of repositories.

Example:

```bash
mrgit status
# or
mrgit st
```

In order to save space in your terminal, you can define the `packagesPrefix` option in your configuration file.
The prefix will be removed from packages' names. Full names of packages aren't needed so we can cut the names.

![An example response of `mrgit status` command.](https://user-images.githubusercontent.com/2270764/28871104-5915289e-7783-11e7-8d06-9eac6d7d96ab.png)

### diff

Prints changes from packages where something has changed.

It accepts additional options which will be passed directly to the `git diff` command which is used to gather the changes.

These options must be separated by a double dash `--`, the same way as [`npm scripts`](https://docs.npmjs.com/cli/run-script#synopsis) does.

#### Examples

Prints changes from all repositories:

```bash
mrgit diff
```

Prints diffstat from all repositories:

```bash
mrgit diff -- --stat
```

Prints staged changes from restricted scope:

```bash
mrgit diff --scope=*@(engine|typing)* -- --staged
```

Prints changes from repositories which are not on `master`:

```bash
mrgit diff -- master...HEAD
```

![An example response of `mrgit diff` command.](https://user-images.githubusercontent.com/2270764/28918716-c6f90002-784a-11e7-95ae-8d08c47c5427.png)

### checkout (alias: `co`)

Changes branches in repositories according to the configuration file. It does not pull the changes and hance is much faster than `mrgit sync`.
The command is useful for bisecting if your main repository contain a revision log like CKEditor 5's [`master-revision`](https://github.com/ckeditor/ckeditor5/commits/master-revisions) branch.

```bash
mrgit checkout
# or
mrgit co
```

If specified an argument, specified branch will be used instead of default or saved in `mrgit.json` file.

```bash
# Checkout all repositories to "stable" branch.
mrgit checkout stable
```

Also you can specify the `--branch` option which means that `mrgit` creates a new branches in repositories that contains changes (that could be committed).
It works on the same terms like `mrgit commit`.

```bash
# Create the branch "t/foo" in repositories where "git status" returns a list if changed files (these files must be tracked by Git).
mrgit checkout --branch t/foo
```

## Projects using mrgit

* [CKEditor 5](https://github.com/ckeditor/ckeditor5)

## Releasing package

### Changelog

Before starting the release process, you need to generate the changelog:

```bash
npm run changelog
```

### Publishing

After generating the changelog, you are able to release the package.

First, you need to bump the version:

```bash
npm run release:prepare-packages
```

After bumping the version, you can publish the changes:

```bash
npm run release:publish-packages
```
