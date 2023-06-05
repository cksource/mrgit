Changelog
=========

## [2.0.3](https://github.com/cksource/mrgit/compare/v2.0.2...v2.0.3) (2023-06-05)

Internal changes only (updated dependencies, documentation, etc.).


## [2.0.2](https://github.com/cksource/mrgit/compare/v2.0.1...v2.0.2) (2023-06-02)

### Bug fixes

* The `status` and `sync` commands will no longer fail when a repository has no tag. Closes [#157](https://github.com/cksource/mrgit/issues/157). ([commit](https://github.com/cksource/mrgit/commit/e30a42858c977d7b8700d25ef0b90c6495279e3b))


## [2.0.1](https://github.com/cksource/mrgit/compare/v2.0.0...v2.0.1) (2022-12-07)

### Bug fixes

* Added the missing "scripts/postinstall.js" file to the published package. ([commit](https://github.com/cksource/mrgit/commit/7240f72aac0b3499acc7f567545e30c56eb75e7a))


## [2.0.0](https://github.com/cksource/mrgit/compare/v1.0.0...v2.0.0) (2022-12-07)

### BREAKING CHANGES

* A minimal version of `Node.js` has been increased to `14` and for `npm` to `5.7.1`.

### Features

* Added support for presets. Closes [#151](https://github.com/cksource/mrgit/issues/151). ([commit](https://github.com/cksource/mrgit/commit/a86da0b9e3cf0cbda44c92e5dc8d79bfda855b30))
* Added support for tags. Closes [#148](https://github.com/cksource/mrgit/issues/148). ([commit](https://github.com/cksource/mrgit/commit/be590461bbe26f8e68c7271b39bdd23527fae4d2))

### Bug fixes

* Fixed message displayed by the `status` command when using a specific commit defined in the config file. ([commit](https://github.com/cksource/mrgit/commit/a86da0b9e3cf0cbda44c92e5dc8d79bfda855b30))

### Other changes

* Upgraded dependencies and changed minimal versions for Node (`>=14.0.0`) and npm (`>=5.7.1`). ([commit](https://github.com/cksource/mrgit/commit/130e6b16b5b25556653e06b12fdb55a1ade54b8f), [commit](https://github.com/cksource/mrgit/commit/8cac5b5d6071dcc29735fadcdd90a301d4bfcf0b))


## [1.0.0](https://github.com/cksource/mrgit/compare/v0.11.1...v1.0.0) (2019-07-23)

### Features

* Repositories, where an executed command failed, will be printed out at the end of the mgit log. Closes [#104](https://github.com/cksource/mrgit/issues/104). ([2d1450c](https://github.com/cksource/mrgit/commit/2d1450c))

### Other changes

* RIP mgit2 💀 Long live mrgit 🎉 Closes [#85](https://github.com/cksource/mrgit/issues/85). ([4a2a33f](https://github.com/cksource/mrgit/commit/4a2a33f))

### BREAKING CHANGES

* mgit2 was renamed to mrgit.


## [0.11.1](https://github.com/cksource/mgit2/compare/v0.11.0...v0.11.1) (2019-07-16)

Internal changes only (updated dependencies, documentation, etc.).


## [0.11.0](https://github.com/cksource/mgit2/compare/v0.10.1...v0.11.0) (2019-07-15)

### Features

* Allows cloning packages using the `file://` protocol. Closes [#101](https://github.com/cksource/mgit2/issues/101). ([d0aa893](https://github.com/cksource/mgit2/commit/d0aa893))

  Thanks to [@neumann-d](https://github.com/neumann-d)!
* Added support for base branches. Closes [#103](https://github.com/cksource/mgit2/issues/103). ([51eded0](https://github.com/cksource/mgit2/commit/51eded0))
* Introduced the `overrideDirectoryNames` option in `mgit.json`. Closes [#98](https://github.com/cksource/mgit2/issues/98).

### Bug fixes

* Number of unmerged files will be shown as "modified" in the table while execution the status command. Closes [#107](https://github.com/cksource/mgit2/issues/107). ([5481260](https://github.com/cksource/mgit2/commit/5481260))


## [0.10.1](https://github.com/cksource/mgit2/compare/v0.10.0...v0.10.1) (2019-01-14)

### Bug fixes

* The master repository package should not be loaded to packages dir. Closes [#96](https://github.com/cksource/mgit2/issues/96). ([7814c33](https://github.com/cksource/mgit2/commit/7814c33))


## [0.10.0](https://github.com/cksource/mgit2/compare/v0.9.1...v0.10.0) (2019-01-11)

### Features

* Introduced a set of new commands which should help developers in daily tasks. Closes [#73](https://github.com/cksource/mgit2/issues/73). ([2097c16](https://github.com/cksource/mgit2/commit/2097c16))

  *  New commands:

      * `commit` - allows committing all changes files that are tracked by Git (a shorthand for `mgit exec 'git commit -a'`)
      * `fetch` - allows fetching changes in all cloned repositories (a shorthand for `mgit exec 'git fetch'`)
      * `pull`  - allows pulling changes in all cloned repositories and cloning missing ones (it does not check out to specified branch in `mgit.json` file)
      * `push` - allows pushing changes in all cloned repositories (a shorthand for `mgit exec 'git push'`)
      * `close` - allows mering specified branch into current one and removes the merged branch from the local and remote

  * The `update` command was renamed to `sync`.

  * The `save-hashes` command was renamed to `save`. It accepts two options: `--branch` or `--hash` (which is default one). If specified `--branch`, name of current branches will be saved in `mgit.json`.

  * Removed command `bootstrap`. Use the `sync` command instead. Sync command will scan the package directories and compare results with packages saved in configuration file. If there is something that is not defined in `mgit.json`, it will be printed out.

  * `checkout` command now allows checking out the project to specified branch: `mgit checkout stable` will check out all repositories to `#stable` branch. It can also create a new branch for repositories that contains changes in files tracked by git. Calling `mgit checkout -- --branch develop` will create the `#develop` branch in these repositories.

  * Improved the help screen of mgit and introduced a help screen for specified command, e.g.: `mgit sync --help`.

### BREAKING CHANGES

* Removed the `bootstrap` command. The `sync` command should be used instead for initializing the repositories.
* Renamed `update` command to `sync`.
* Renamed `save-hashes` command to `save`. It supports two parameters: `--branch` and `--hash` which the second one is set as default.

### NOTE

* `mgit checkout branch` will check out the repository on `#branch`. `[branch]` argument is optional. If it isn't specified, branch name will be taken from `mgit.json`.


## [0.9.1](https://github.com/cksource/mgit2/compare/v0.9.0...v0.9.1) (2018-12-05)

### Bug fixes

* Simplified a check for "remote end hung up" error during the `bootstrap` command. Closes [#92](https://github.com/cksource/mgit2/issues/92). ([ed2291c](https://github.com/cksource/mgit2/commit/ed2291c))


## [0.9.0](https://github.com/cksource/mgit2/compare/v0.8.1...v0.9.0) (2018-11-22)

### Features

* The `mgit bootstrap` and `mgit update` commands will try pulling changes twice in case of a network hang-up. Closes [#87](https://github.com/cksource/mgit2/issues/87). ([47e6840](https://github.com/cksource/mgit2/commit/47e6840))


## [0.8.1](https://github.com/cksource/mgit2/compare/v0.8.0...v0.8.1) (2018-11-19)

### Bug fixes

* Mgit should end with proper exit code if some command failed. Closes [#86](https://github.com/cksource/mgit2/issues/86). ([b7b878b](https://github.com/cksource/mgit2/commit/b7b878b))


## [0.8.0](https://github.com/cksource/mgit2/compare/v0.7.5...v0.8.0) (2018-05-04)

### Features

* Introduced a smarter `cwd` resolver which scans directory tree up in order to find the `mgit.json` file. If the file won't be found, an exception will be thrown. Closes [#1](https://github.com/cksource/mgit2/issues/1). ([751c10f](https://github.com/cksource/mgit2/commit/751c10f))


## [0.7.5](https://github.com/cksource/mgit2/compare/v0.7.4...v0.7.5) (2018-05-04)

### Bug fixes

* Whitespaces in a CWD should not break the `bootstrap` command. Closes [#74](https://github.com/cksource/mgit2/issues/74). ([3a5eaac](https://github.com/cksource/mgit2/commit/3a5eaac))


## [0.7.4](https://github.com/cksource/mgit2/compare/v0.7.3...v0.7.4) (2018-02-06)

Internal changes only (updated dependencies, documentation, etc.).


## [0.7.3](https://github.com/cksource/mgit2/compare/v0.7.2...v0.7.3) (2018-02-06)

### Bug fixes

* Not staged, deleted files were not shown as modified during mgit status command. Closes [#58](https://github.com/cksource/mgit2/issues/58). ([52ee784](https://github.com/cksource/mgit2/commit/52ee784))
* The `status` command will now sort packages alphabetically. Closes [#60](https://github.com/cksource/mgit2/issues/60). ([56a31ce](https://github.com/cksource/mgit2/commit/56a31ce))


## [0.7.2](https://github.com/cksource/mgit2/compare/v0.7.1...v0.7.2) (2017-08-17)

Internal changes only (updated dependencies, documentation, etc.).

## [0.7.1](https://github.com/cksource/mgit2/compare/v0.7.0...v0.7.1) (2017-08-17)

### Other changes

* Improved UI of the statuses table. Closes [#55](https://github.com/cksource/mgit2/issues/55). ([35349d0](https://github.com/cksource/mgit2/commit/35349d0))

  * If current branch is other than specified in `mgit.json` – the branch will be prefixed with `!`,
  * If current branch is other than `master` – the whole row will be highlighted (in pink).


## [0.7.0](https://github.com/cksource/mgit2/compare/v0.6.0...v0.7.0) (2017-08-16)

### Features

* Introduced new commands and fixed bugs related to incorrectly displayed errors. Closes [#2](https://github.com/cksource/mgit2/issues/2). Closes [#45](https://github.com/cksource/mgit2/issues/45). Closes [#49](https://github.com/cksource/mgit2/issues/49). Closes [#52](https://github.com/cksource/mgit2/issues/52). ([c66c11a](https://github.com/cksource/mgit2/commit/c66c11a))

  * New commands:
    * `checkout` – changes branches in repositories according to the configuration file (see [#52](https://github.com/cksource/mgit2/issues/52)),
    * `diff` – prints changes from all repositories (see [#2](https://github.com/cksource/mgit2/issues/2)),
    * `status` – prints a table which contains useful information about the status of repositories (see [#2](https://github.com/cksource/mgit2/issues/2)).
  * Bug fixes:
    * known errors should not be logged as crashes (see [#45](https://github.com/cksource/mgit2/issues/45)).


## [0.6.0](https://github.com/cksource/mgit2/compare/v0.5.2...v0.6.0) (2017-07-31)

### Features

* Introduced `--ignore` and `--scope` options which allow executing the commands on a subset of packages. Closes [#50](https://github.com/cksource/mgit2/issues/50). ([061e32d](https://github.com/cksource/mgit2/commit/061e32d))


## [0.5.2](https://github.com/cksource/mgit2/compare/v0.5.1...v0.5.2) (2017-07-04)

### Bug fixes

* Fixed various minor issues with the commands. Introduced missing tests. Closes [#31](https://github.com/cksource/mgit2/issues/31). Closes [#41](https://github.com/cksource/mgit2/issues/41). Closes [#3](https://github.com/cksource/mgit2/issues/3). Closes [#43](https://github.com/cksource/mgit2/issues/43). ([5751eb7](https://github.com/cksource/mgit2/commit/5751eb7))

### Other changes

* Shortened hashes to 7-char version in the `save-hashes` command. Closes [#47](https://github.com/cksource/mgit2/issues/47). ([73990c8](https://github.com/cksource/mgit2/commit/73990c8))


## [0.5.1](https://github.com/cksource/mgit2/compare/v0.5.0...v0.5.1) (2017-02-01)

### Bug fixes

* Empty package was published due to incorrect `files` configuration in `package.json. Fixes [#37](https://github.com/cksource/mgit2/issues/37). ([d6fc7c0](https://github.com/cksource/mgit2/commit/d6fc7c0))


## [0.5.0](https://github.com/cksource/mgit2/compare/v0.4.1...v0.5.0) (2017-01-31)

### Features

* Introduced "save-hashes" command for saving hashes of the packages. Resolves: [#27](https://github.com/cksource/mgit2/issues/27). ([17e6c67](https://github.com/cksource/mgit2/commit/17e6c67))
