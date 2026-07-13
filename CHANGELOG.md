Changelog
=========

## [5.0.1](https://github.com/cksource/mrgit/compare/v5.0.0...v5.0.1) (July 13, 2026)

### Other changes

* This release does not include any user-facing changes. It was published solely to verify the release process.


## [5.0.0](https://github.com/cksource/mrgit/compare/v4.1.0...v5.0.0) (July 13, 2026)

### BREAKING CHANGES

* Upgrade to and require at least Node v24.11.
* `mrgit` is now pure ESM and no longer supports CommonJS. Closes [#197](https://github.com/cksource/mrgit/issues/197).

### Bug fixes

* Harden internal Git command execution by running `diff`, `push`, `checkout`, `close`, `commit`, and `sync` commands without shell interpolation, so command arguments are treated as literal values. Closes [#216](https://github.com/cksource/mrgit/issues/216).

### Other changes

* Update the `glob`, `js-yaml`, and `@ckeditor/ckeditor5-dev-*` packages.


## [4.1.0](https://github.com/cksource/mrgit/compare/v4.0.0...v4.1.0) (September 16, 2025)

### Features

* Introduced `--config` CLI parameter which allows providing custom configuration filename that will be used instead of the default `mrgit.json` file. Closes [#189](https://github.com/cksource/mrgit/issues/189).


## [4.0.0](https://github.com/cksource/mrgit/compare/v3.0.0...v4.0.0) (June 26, 2025)

### BREAKING CHANGES

* Updated the required version of Node.js to 22 after bumping all `@ckeditor/ckeditor5-dev-*` packages to the latest `^50.0.0` version.

### Bug fixes

* The `mrgit status` command should not print an error when processing a repository without tags or with a partially cloned history that causes tags to be assigned to non-existing commits. Closes [#179](https://github.com/cksource/mrgit/issues/179).


## [3.0.0](https://github.com/cksource/mrgit/compare/v2.1.0...v3.0.0) (2025-03-14)

### BREAKING CHANGES

* Upgraded the minimal version of Node.js to 20.0.0 due to the end of LTS.

### Other changes

* Updated the required version of Node.js to 20. ([commit](https://github.com/cksource/mrgit/commit/1f598905e2da7b7fe9fdf9fdfea22d43d9ae9cc3))

---

To see all releases, visit the [release page](https://github.com/cksource/mrgit/releases).
