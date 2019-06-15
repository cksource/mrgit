# mgit2

<a href="https://www.npmjs.com/package/mgit2"><img src="https://img.shields.io/npm/v/mgit2.svg" alt="mgit2 npm package badge"></a>
<a href="https://travis-ci.org/cksource/mgit2"><img src="https://img.shields.io/travis/cksource/mgit2/master.svg" alt="build status badge"></a>
<a href="https://coveralls.io/github/cksource/mgit2?branch=master"><img src="https://coveralls.io/repos/github/cksource/mgit2/badge.svg?branch=master" alt="Coverage Status"></a>
<a href="https://david-dm.org/cksource/mgit2"><img src="https://img.shields.io/david/cksource/mgit2.svg" alt="mgit2 dependencies status badge"></a>
<a href="https://david-dm.org/cksource/mgit2?type=dev"><img src="https://img.shields.io/david/dev/cksource/mgit2.svg" alt="mgit2 devDependencies status badge"></a>

Multi-repo manager for git. A tool for managing projects build using multiple repositories.

mgit2 is designed to work with [yarn workspaces](https://yarnpkg.com/lang/en/docs/workspaces/) and [Lerna](https://github.com/lerna/lerna) out of the box, hence, it mixes the "package" and "repository" concepts. In other words, every repository is meant to be a single [npm](https://npmjs.com) package. It doesn't mean that you must use it with Lerna and npm, but don't be surprised that mgit2 talks about "packages" and works best with npm packages.

# Table of content

1. [Installation](#installation)
1. [Usage](#usage)
1. [Configuration](#configuration)
    1. [The `dependencies` option](#the-dependencies-option)
    1. [Recursive cloning](#recursive-cloning)
    1. [Cloning repositories on CI servers](#cloning-repositories-on-ci-servers)
    1. [Standard/core branches](#standardcore-branches)
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
1. [Projects using mgit2](#projects-using-mgit2)

## Installation

```bash
npm install -g mgit2
```

Use:

```bash
mgit --help
```

**Note:** The command is called `mgit`.

## Usage

First, create a configuration file `mgit.json`:

```json
{
  "dependencies": {
    "@ckeditor/ckeditor5-engine": "ckeditor/ckeditor5-engine",
    "mgit2": "cksource/mgit2"
  }
}
```

(Keys of the `dependencies` object are package names and values are repository URLs (GitHub identifiers in this case). Read more about the [`dependencies` option](#the-dependencies-option).)

And run `mgit sync` to clone all the repositories. By default, they will be cloned to `<cwd>/packages/` directory:

```bash
packages/
  ckeditor5-engine/
  mgit2/
```

## Configuration

CLI options:

```
--branch                    For "save" command: whether to save branch names.
                            For "checkout" command: name of branch that would be created.

--hash                      Whether to save current commit hashes. Used only by "save" command.

--ignore                    Ignores packages which names match the given glob pattern. E.g.:
                            > mgit exec --ignore="foo*" "git status"

                            Will ignore all packages which names start from "foo".
                            Default: null

--message                   Message that will be used as an option for git command. Required for "commit"
                            command but it is also used by "close" command (append the message to the default).

--packages                  Directory to which all repositories will be cloned or are already installed.
                            Default: '<cwd>/packages/'

--recursive                 Whether to install dependencies recursively. Used only by "sync" command.

--resolver-path             Path to a custom repository resolver function.
                            Default: '@mgit2/lib/default-resolver.js'

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

--resolver-default-branch   The branch name to use if not specified in mgit.json dependencies.
                            Default: master

--scope                     Restricts the command to packages which names match the given glob pattern.
                            Default: null
```

All these options can also be specified in `mgit.json` (options passed through CLI takes precedence):

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

This option specifies repositories which mgit is supposed to clone. It can also clone its dependencies recursively (see [Recursive cloning](#recursive-cloning)).

The dependency keys can be any strings, but it's recommended to use package names (e.g. npm package names, just like in `package.json`). The values are repository URLs which mgit will clone.

Examples:

```js
// Clone 'git@github.com:cksource/foo.git' and check out to 'master'.
{
    "foo": "git@github.com:cksource/foo.git"
}
```

```js
// Short format. Clone 'git@github.com:cksource/foo.git' and check out to branch 'dev'.
{
    "@cksource/foo": "cksource/foo#dev"
}
```

```js
// Clone 'https://github.com/cksource/foo.git' (via HTTPS) and check out to branch tag 'v1.2.3'.
{
    "foo": "https://github.com/cksource/foo.git#v1.2.3"
}
```

### Recursive cloning

When the `--recursive` option is used mgit will clone repositories recursively. First, it will clone the `dependencies` specified in `mgit.json` and, then, their `dependencies` and `devDependencies` specified in `package.json` files located in cloned repositories.

However, mgit needs to know repository URLs of those dependencies, as well as which dependencies to clone (usually, only the ones maintained by you). In order to configure that you need to use a custom repository resolver (`--resolver-path`).

Resolver is a simple Node.js module which exports the resolver function.

For example, assuming that you want to clone all `@ckeditor/ckeditor5-*` packages, your resolver could look like this:

```js
'use strict';

const parseRepositoryUrl = require( 'mgit2/lib/utils/parserepositoryurl' );

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

You can also check the [default resolver](https://github.com/cksource/mgit2/blob/master/lib/default-resolver.js) used by mgit and [the config object definition](https://github.com/cksource/mgit2/blob/master/lib/utils/getconfig.js).

### Cloning repositories on CI servers

CI servers, such as Travis, can't clone repositories using Git URLs (such as `git@github.com:cksource/mgit.git`). By default, mgit uses Git URLs because it assumes that you'll want to commit to these repositories (and don't want to be asked for a password every time).

If you need to run mgit on a CI server, then configure it to use HTTPS URLs:

```bash
mgit --resolver-url-template="https://github.com/\${ path }.git"
```

### Standard/core branches

When you call `mgit sync` or `mgit co` it uses the `master` branch in every repository, unless the repository's branch is defined in `mgit.json`.

If you support only the one main/core branch in your projects, it isn't a problem. But if you have more than one, on every single branch you need modify branches for dependencies in `mgit.json`.

In order to simplify the flow, we introduced the standard/core branches option. It uses the current branch of the main repository in all cases where the branch is not defined in `mgit.json`.

```json
{
  ...
  "standardBranches": [ "master", "stable" ],
  ...
}
```

[Read more about the feature.](https://github.com/cksource/mgit2/issues/103)

You can also use full HTTPS URLs to configure `dependencies` in your `mgit.json`.

## Commands

```bash
$ mgit [command]
```

For displaying help screen for specified command, type:

```bash
$ mgit [command] --help
```

### sync

Updates dependencies. Switches repositories to correct branches (specified in `mgit.json`) and pulls changes.

If any dependency is missing, the command will install this dependency as well.

This command does not touch repositories in which there are uncommitted changes.

If in the packages directory will be located some directories that are not specified in `mgit.json`, paths to these directories
will be printed out on the screen.

Examples:

```bash
mgit sync --recursive
```

### pull

Pulls changes in existing repositories. It does not change branches in the repositories and pull the changes even if
the repository contains uncommitted changes.

Examples:

```bash
mgit pull
```

### push

Pushes changes in existing repositories.

Examples:

```bash
mgit push
```

### fetch

Fetches changes in existing repositories.

Examples:

```bash
mgit fetch
```

### exec

Executes specified shell command in existing repositories.

Example:

```bash
mgit exec 'git status'

# Executes `git status` command on each repository.
```

During the task execution, `cwd` is set to the repository path:

```bash
mgit exec 'echo `pwd`'

# /home/mgit/packages/organization/repository-1
# /home/mgit/packages/organization/repository-2
```

### commit (alias: `ci`)

For every repository that contains changes which can be committed, makes a commit with these files.
You need to specify the message for the commit.

Example:

```bash
mgit commit --message 'Introduce PULL_REQUEST_TEMPLATE.md.'

# Executes `git commit --message 'Introduce PULL_REQUEST_TEMPLATE.md.'` command on each repository.
# Commit will be made in repositories that "git status" returns a list if changed files (these files must be tracked by Git).
```

### close

Requires a second argument which is a branch name that will be merged to current one. You can also specify the message
which will be added to the default git-merge message.

Repositories which do not have specified branch will be ignored.

After merging, the merged branch will be removed from the remote and the local registry.

Example:

```bash
# Assumptions: we are on "master" branch and "develop" branch exists.
mgit merge develop --message 'These changes are required for the future release.'

# Branch "develop" will be merged into "master".
# Branch "develop" will be removed from the origin.
```

### save

Saves hashes of packages in `mgit.json`. It allows to easily fix project to a specific state.

Example:

```bash
mgit save
```

If you would like to save name of branches instead of current commit, you can use an option `--branch`:

```bash
mgit save --branch
```

### status (alias: `st`)

Prints a table which contains useful information about the status of repositories.

Example:

```bash
mgit status
# or
mgit st
```

In order to save space in your terminal, you can define the `packagesPrefix` option in your configuration file.
The prefix will be removed from packages' names. Full names of packages aren't needed so we can cut the names.

![An example response of `mgit status` command.](https://user-images.githubusercontent.com/2270764/28871104-5915289e-7783-11e7-8d06-9eac6d7d96ab.png)

### diff

Prints changes from packages where something has changed.

It accepts additional options which will be passed directly to the `git diff` command which is used to gather the changes.

These options must be separated by a double dash `--`, the same way as [`npm scripts`](https://docs.npmjs.com/cli/run-script#synopsis) does.

#### Examples

Prints changes from all repositories:

```bash
mgit diff
```

Prints diffstat from all repositories:

```bash
mgit diff -- --stat
```

Prints staged changes from restricted scope:

```bash
mgit diff --scope=*@(engine|typing)* -- --staged
```

Prints changes from repositories which are not on `master`:

```bash
mgit diff -- master...HEAD
```

![An example response of `mgit diff` command.](https://user-images.githubusercontent.com/2270764/28918716-c6f90002-784a-11e7-95ae-8d08c47c5427.png)

### checkout (alias: `co`)

Changes branches in repositories according to the configuration file. It does not pull the changes and hance is much faster than `mgit sync`.
The command is useful for bisecting if your main repository contain a revision log like CKEditor 5's [`master-revision`](https://github.com/ckeditor/ckeditor5/commits/master-revisions) branch.

```bash
mgit checkout
# or
mgit co
```

If specified an argument, specified branch will be used instead of default or saved in `mgit.json` file.

```bash
# Checkout all repositories to "stable" branch.
mgit checkout stable
```

Also you can specify the `--branch` option which means that mgit creates a new branches in repositories that contains changes (that could be committed).
It works on the same terms like `mgit commit`.

```bash
# Create the branch "t/foo" in repositories where "git status" returns a list if changed files (these files must be tracked by Git).
mgit checkout --branch t/foo
```

## Projects using mgit2

* [CKEditor 5](https://github.com/ckeditor/ckeditor5)
