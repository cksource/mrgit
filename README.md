# mgit2

<a href="https://www.npmjs.com/package/mgit2"><img src="https://img.shields.io/npm/v/mgit2.svg" alt="mgit2 npm package badge"></a>
<a href="https://david-dm.org/cksource/mgit2"><img src="https://img.shields.io/david/cksource/mgit2.svg" alt="mgit2 dependencies status badge"></a>
<a href="https://david-dm.org/cksource/mgit2?type=dev"><img src="https://img.shields.io/david/dev/cksource/mgit2.svg" alt="mgit2 devDependencies status badge"></a>
<!-- <a href="https://travis-ci.org/mgit2"><img src="https://img.shields.io/travis/mgit2/master.svg" alt="build status badge"></a>
<a href="https://codeclimate.com/github/cksource/mgit2/coverage"><img src="https://img.shields.io/codeclimate/coverage/github/cksource/mgit2.svg" alt="mgit2 coverage badge"></a> -->

Multi-repo manager for git. A tool for managing projects build using multiple repositories.

mgit2 is designed to work with [Lerna](https://github.com/lerna/lerna) (*"A tool for managing JavaScript projects with multiple packages."*) out of the box, hence, it mixes the "package" and "repository" concepts. In other words, every repository is meant to be a single [npm](https://npmjs.com) package. It doesn't mean that you must use it with Lerna and npm, but don't be surprised that mgit2 talks about "packages" and works best with npm packages.

## Installation

```bash
sudo npm install -g mgit2
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
  "packages": "packages/",
  "dependencies": {
    "package-name": "organization/repository",
    "foo": "cksource/foo",
    "bar": "git@github.com:cksource/bar.git"
  }
}
```

* `packages` - the directory where dependencies will be cloned,
* `dependencies` - list of dependencies (git repositories).

### Example configuration of `dependencies`

Package will be installed in `packages/foo` and checked out to `master`:

```json
{
	"foo": "git@github.com:cksource/foo.git"
}
```

Package will be installed in `packages/@scope/package-name` and checked out to branch `develop`. It will be cloned from `git@github.com:organization/repository.git`:

```json
{
	"@scope/package-name": "organization/repository#develop"
}
```

Package will be installed in `packages/foo` from tag `v1.2.3`:

```json
{
	"foo": "git@github.com:cksource/foo.git#v1.2.3"
}
```

If you don't specify the branch, then by default it will be `master`.

## Commands

```
mgit [command]
```

### bootstrap

Installs missing packages (i.e. clone them) and check them out to correct branches.

This command will not change existing repositories, so you can always safely use it. It's useful to bootstrap the project initially, but later you'll rather want to use `mgit update`.

Example:

```bash
mgit bootstrap --recursive --repository-resolver ./dev/custom-repository-resolver.js
```

Options:

* `--recursive` – whether to clones also dependencies of your main project dependencies (finds them in `package.json`); needs to be used with `--repository-resolver`,
* `--repository-resolver` – path to a function which gets a package name and should return a falsy value if this repository should not be installed by mgit2 or an object representing git URL and branch name if should; read more in [Custom repository resolver](#custom-repository-resolver).

### update

Updates dependencies. Switches repositories to correct branches (specified in `mgit.json`) and pulls changes.

If any dependency is missing, the it will install it too.

This command does not touch repositories in which there are uncommitted changes.

Examples:

```bash
# Updates existing packages. Clones missing packages and their dependencies.
mgit update --recursive

# Updates existing packages. Does not execute the "git fetch" command.
mgit update --no-fetch
```

Options:

* `--no-fetch` – do not fetch (or pull) changes – only switch branches,
* `--recursive` – like in the bootstrap command,
* `--repository-resolver` – like in the bootstrap command.

### exec

For every repository executes the specified shell command.

Example:

```bash
# Executes `git status` command on each repository.
mgit exec 'git status'
```

During the task, `cwd` is set to the repository path:

```bash
mgit exec 'echo `pwd`'

# /home/mgit/packages/organization/repository-1
# /home/mgit/packages/organization/repository-2
```

## Custom repository resolver

By default, mgit2 uses a simple repository resolver which returns git URL and branch name for a package name based on dependencies specified in `mgit.json`.

If you want to create a custom resolver, you need to create a module which returns a repository or a falsy value if the repository cannot be resolved (and should not be cloned by mgit2).

Such a resolver is only needed if:

* you use the `--recursive` option, because mgit2 needs to know how to clone dependencies of the packages listed in `mgit.json`,
* you use the simple `'organization/repository'` format of dependencies in `mgit.json` and would like to use an HTTPS version of a repository URL (mgit2 defaults to Git+SSH URLs which doesn't work on e.g. Travis).

The resolver is called with two arguments:

* `{String} packageName` Name of the package to resolve,
* `{String} cwd` Current working directory. Not the same as `process.pwd()` because `mgit` might've been executed in a child directory.

For example, the default resolver implementation looks as follows:

```js
const path = require( 'path' );
const parseRepositoryUrl = require( 'mgit2/lib/utils/parserepositoryurl' );

/**
 * Resolves repository URL for a given package name.
 *
 * @param {String} name Package name.
 * @param {String} cwd Current working directory.
 * @returns {Object|null}
 * @returns {String} return.url Repository URL. E.g. `'git@github.com:ckeditor/ckeditor5.git'`.
 * @returns {String} return.branch Branch name. E.g. `'master'`.
 * @returns {String} return.directory Directory to which the repository will be cloned.
 * The final path is created by concatenating the `packages` option from `mgit.json` and the
 * returned value. E.g. if `'ckeditor5'` was returned, then the package will be cloned to `packages/ckeditor5`.
 */
module.exports = function repositoryResolver( name, cwd ) {
	const mgitConf = require( path.join( cwd, 'mgit.json' ) );
	const repositoryUrl = mgitConf.dependencies[ name ];

	if ( !repositoryUrl ) {
		return null;
	}

	return parseRepositoryUrl( repositoryUrl );
};
```

The `parseRepositoryUrl` function accepts `options.urlTemplate` which allows define what kind of
URLs should be used by mgit to clone dependencies. E.g.:

```js
parseRepositoryUrl( 'organization/repository', {
	urlTemplate: 'https://github.com/${ path }.git'
} );

//	{
//		url: 'https://github.com/organization/repository.git',
//		branch: 'master',
//		directory: 'repository'
//	}
```

## Projects using mgit2

* [CKEditor 5](https://github.com/ckeditor/ckeditor5)
