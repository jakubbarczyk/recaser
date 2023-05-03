[![dependencies](https://david-dm.org/jakubbarczyk/recaser.svg)](https://david-dm.org/jakubbarczyk/recaser)
[![npm package](https://badge.fury.io/js/recaser.svg)](https://badge.fury.io/js/recaser)
[![vulnerabilities](https://snyk.io/test/github/jakubbarczyk/recaser/badge.svg)](https://snyk.io/test/github/jakubbarczyk/recaser)

# Recaser

Bulk-rename files to match a certain case.

## Installation

Installing the package with _npm_:

```shell
npm install --global recaser
```

Installing the package with _yarn_:

```shell
yarn global add recaser
```

## Usage

Bulk-rename files in the `Movies` directory to match `camel` case:

```shell
recase camel ./Movies
```

Bulk-rename files in the `Movies` directory, and its subdirectories, to match `kebab` case:

```shell
recase kebab ./Movies --recursive
```

## Options

Recaser handles the following cases:

- lower
- upper
- camel
- pascal
- kebab
- snake
- train

## License

[MIT](http://ilee.mit-license.org)
