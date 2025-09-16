Changelog
=========

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


## [2.1.0](https://github.com/cksource/mrgit/compare/v2.0.3...v2.1.0) (2023-08-28)

### Features

* Added support for executing commands in the root repository. Closes [#160](https://github.com/cksource/mrgit/issues/160). ([commit](https://github.com/cksource/mrgit/commit/2271a029d30cba2abd7209888361e2fde646e748))

  Add [the `$rootRepository` option](https://github.com/cksource/mrgit/#the-rootrepository-option) to the `mrgit.json` configuration file to enable this feature. Its value should be a repository GitHub identifier (the same as defining the `dependencies` values). You can also define the option within [the preset feature](https://github.com/cksource/mrgit/#the-presets-option).

  Below, you can find a list of supported commands that take into consideration the root repository if specified:

    * `checkout`
    * `commit`
    * `diff`
    * `exec`
    * `fetch`
    * `pull`
    * `push`
    * `status`
    * `sync`

  To disable executing a command in the root repository without modifying the configuration file, you can add the `--skip-root` modifier to mrgit. Example: `mrgit status --skip-root`.


## [2.0.3](https://github.com/cksource/mrgit/compare/v2.0.2...v2.0.3) (2023-06-05)

Internal changes only (updated dependencies, documentation, etc.).

---

To see all releases, visit the [release page](https://github.com/cksource/mrgit/releases).
