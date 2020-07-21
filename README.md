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

```javascript
recase camel ./Movies
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
