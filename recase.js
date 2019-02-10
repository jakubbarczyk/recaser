#! /usr/bin/env node

'use strict'

const { join, parse } = require('path')
const { access, accessSync, constants, stat, statSync, readdir, rename } = require('fs')
const { promisify } = require('util')

const statAsync = promisify(stat)
const readdirAsync = promisify(readdir)
const renameAsync = promisify(rename)

const minimist = require('minimist')

// Parses arguments
const argv = minimist(process.argv.slice(2), {
  alias: {
    h: 'help',
    v: 'version'
  },
  // TODO: when present, recase directories
  // boolean: ['d'] --> directory
  // TODO: when present, recase subdirectories
  // boolean: ['r'] --> recursive
})

const { toLowerCase, toUpperCase, toCamelCase, toPascalCase, toKebabCase, toSnakeCase, toTrainCase } = require('casey-js')

// Creates case dictionary
const Case = {
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

const recase = Case[argv.case]

// Verifies if the specified case exist
if (!recase) {
  console.error(`
  Cannot use case "${argv.case}".
  
  Try one of the following:
  ${Object.keys(Case).join(', ')}`)
  process.exit(1)
}

const directory = join(process.cwd(), argv.path)

// Verifies if the specified directory exist and is accessible
try {
  statSync(directory)
  accessSync(directory, constants.R_OK & constants.W_OK)
} catch {
  console.error(`
    Cannot find directory "${argv.path}".`)
  process.exit(1)
}

// Renames files in a directory
readdirAsync(directory)
  .then(handleFiles)
  .catch(handleError)

const alphanumericCharacter = /^\w+/

function startsWithAlphanumericCharacter(file) {
  return alphanumericCharacter.test(file)
}

async function isFile(file) {
  return await statAsync(join(directory, file))
    .then((stats) => stats.isFile())
    .then((isFile) => isFile ? file : undefined)
    .catch(handleError)
}

async function toCase(file) {
  // Skips uncommon files, e.g. .gitignore
  if (startsWithAlphanumericCharacter(file.base)) {
    const oldName = join(directory, file.base)
    const newName = join(directory, recase(file.name).concat(file.ext))
    return await renameAsync(oldName, newName)
  }
}

function handleFiles(files) {
  return Promise
    .all(files.map((file) => isFile(file)))
    .then((files) => files.filter((file) => file))
    .then((files) => files.map((file) => parse(file)))
    .then((files) => Promise.all(files.map(toCase)))
    .catch(handleError)
}

function handleError(error) {
  console.error(error.message)
}
