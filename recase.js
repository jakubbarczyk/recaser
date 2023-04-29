#! /usr/bin/env node

'use strict'

const { join, parse } = require('node:path')
const { accessSync, constants, statSync } = require('node:fs')
const { readdir, rename, stat } = require('node:fs/promises')

// Parses arguments
const argv = require('minimist')(process.argv.slice(2), {
  alias: { h: 'help', v: 'version' },
  boolean: ['help', 'version'],
  // TODO: when present, recase directories
  // boolean: ['d'] --> directory
  // TODO: when present, recase subdirectories
  // boolean: ['r'] --> recursive
})

const { toLowerCase, toUpperCase, toCamelCase, toPascalCase, toKebabCase, toSnakeCase, toTrainCase } = require('casey-js')

// Creates cases dictionary
const cases = {
  lower: toLowerCase,
  upper: toUpperCase,
  camel: toCamelCase,
  pascal: toPascalCase,
  kebab: toKebabCase,
  snake: toSnakeCase,
  train: toTrainCase
}

// Maps positional arguments
Object.assign(argv, { case: argv._[0], path: argv._[1] })

// Prints out package help
if (argv.help) {
  console.info(`
  Bulk-rename files and/or directories to match a case:
  recase <case> <directory>
  `)
  process.exit(0)
}

// Prints out package version
if (argv.version) {
  const { version } = require('./package.json')
  console.info(version)
  process.exit(0)
}

const recase = cases[argv.case]

// Verifies if the specified case exist
if (argv._.length === 0) {
  console.error(`
  Try specifying the parameters:
  recase <case> <directory>`)
  process.exit(1)
} else if (!recase) {
  console.error(`
  Cannot use case "${argv.case}".
  
  Try one of the following:
  ${Object.keys(cases).join(', ')}`)
  process.exit(1)
}

const directory = join(process.cwd(), argv.path)

// Verifies if the specified directory exist
try {
  statSync(directory)
} catch {
  console.error(`
  Cannot find directory "${argv.path}".`)
  process.exit(1)
}

// Verifies if the specified directory is accessible
try {
  accessSync(directory, constants.R_OK & constants.W_OK)
} catch {
  console.error(`
  Cannot access directory "${argv.path}".`)
  process.exit(1)
}

// Renames files in a directory
readdir(directory)
  .then(handleFiles)
  .catch(handleError)

const alphanumericCharacter = /^\w+/

// Skips uncommon files, e.g. .gitignore
function startsWithAlphanumericCharacter(file) {
  return alphanumericCharacter.test(file)
}

function isFile(file) {
  return stat(join(directory, file))
    .then(stats => stats.isFile())
    .then(isFile => isFile ? file : undefined)
    .catch(handleError)
}

function toCase(file) {
  if (startsWithAlphanumericCharacter(file.base)) {
    const oldName = join(directory, file.base)
    const newName = join(directory, recase(file.name).concat(file.ext))
    return rename(oldName, newName)
  }
}

function handleFiles(files) {
  return Promise
    .all(files.map(file => isFile(file)))
    .then(files => files.filter(file => file))
    .then(files => files.map(file => parse(file)))
    .then(files => Promise.all(files.map(toCase)))
    .catch(handleError)
}

function handleError(error) {
  console.error(error.message)
}
