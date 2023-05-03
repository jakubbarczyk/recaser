#! /usr/bin/env node

'use strict'

const { accessSync, constants, statSync } = require('node:fs')
const { access, readdir, rename, stat } = require('node:fs/promises')
const { join, parse, resolve } = require('node:path')

// Parses arguments
const argv = require('minimist')(process.argv.slice(2), {
  alias: { h: 'help', r: 'recursive', v: 'version' },
  boolean: ['help', 'recursive', 'version']
  // TODO: [-d, --directory] when present, recase directory names
})

const casey = require('casey-js')

const cases = {
  lower: casey.toLowerCase,
  upper: casey.toUpperCase,
  camel: casey.toCamelCase,
  pascal: casey.toPascalCase,
  kebab: casey.toKebabCase,
  snake: casey.toSnakeCase,
  train: casey.toTrainCase
}

// Maps positional arguments
Object.assign(argv, { case: argv._[0], path: argv._[1] })

// Prints out package help
if (argv.help) {
  process.stdout.write(`
  Bulk-rename files and directories to match a case:
  recase <case> <path> [-r, --recursive]
  `)
  process.exit(0)
}

// Prints out package version
if (argv.version) {
  const { version } = require('./package.json')
  process.stdout.write(version)
  process.exit(0)
}

const recase = cases[argv.case]

if (argv._.length === 0) {
  handleError(Error('\n  Try specifying the parameters:\n  recase <case> <path>'))
}

if (!recase) {
  handleError(Error(`\n  Cannot use case "${argv.case}"\n\n  Try one of the following:\n  ${Object.keys(cases).join(', ')}`))
}

if (!argv.path) {
  handleError(Error('\n  Try specifying the <path> parameter:\n  recase <case> <path>'))
}

// Verifies if the specified directory exist
try {
  statSync(argv.path)
} catch {
  handleError(Error(`\n  Cannot find path "${argv.path}"`))
}

// Verifies if the specified directory is accessible
try {
  accessSync(argv.path, constants.R_OK & constants.W_OK)
} catch {
  handleError(Error(`\n  Cannot access directory "${argv.path}"`))
}

const alphanumericCharacter = /^\w+/i

// Skips uncommon files, such as .gitignore
const startsWithAlphanumericCharacter = file => alphanumericCharacter.test(file)

const isFile = path => stat(path).then(stats => stats.isFile())

const toCase = file => {
  if (startsWithAlphanumericCharacter(file.base)) {
    const oldName = join(file.dir, file.base)
    const newName = join(file.dir, recase(file.name).concat(file.ext))
    return rename(oldName, newName)
  }
}

handleDirectory(resolve(argv.path))

function handleDirectory(directory) {
  return readdir(directory)
    .then(paths => Promise.all(paths
      .map(path => join(directory, path))
      .map(absolutePath => isFile(absolutePath)
        .then(isFile => {
          if (isFile) return toCase(parse(absolutePath))
          if (argv.recursive) return handleDirectory(absolutePath)
        })
      )
    ))
    .catch(handleError)
}

function handleError(error) {
  process.stderr.write(error.message)
  process.exit(1)
}
