Changelog
=========

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
