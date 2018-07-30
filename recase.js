#! /usr/bin/env node

'use strict'

const { join, resolve, parse } = require('path')
const { stat, readdir, rename } = require('fs')
const { promisify } = require('util')

const yargs = require('yargs')
const { toLowerCase, toUpperCase, toCamelCase, toPascalCase, toKebabCase, toSnakeCase, toTrainCase } = require('casey-js')

const statAsync = promisify(stat)
const readdirAsync = promisify(readdir)
const renameAsync = promisify(rename)

const Case = {
  lower: toLowerCase,
  upper: toUpperCase,
  camel: toCamelCase,
  pascal: toPascalCase,
  kebab: toKebabCase,
  snake: toSnakeCase,
  train: toTrainCase
}

const argv = yargs
  .command('recase <case> [path]', 'bulk-rename files to match a certain case', (yargs) => {
    yargs
      .positional('case', {
        choices: Object.keys(Case),
        describe: 'the case to be used',
        type: 'string'
      })
      .positional('path', {
        default: process.cwd(),
        describe: 'the path to recase',
        type: 'string'
      })
  })
  .help()
  .alias({ 'help': 'h', 'version': 'v' })
  .epilog('Copyright © 2018 Jakub Barczyk')
  .argv

/**
 * Maps positional arguments
 */
Object.assign(argv, { case: argv._[0], path: argv._[1] })

const alphanumericCharacter = /^\w+/
const recase = defaultToNoop(Case[argv.case])
const directory = resolve(process.cwd(), argv.path)

/**
 * Renames files in specified directory
 */
readdirAsync(directory)
  .then(handleFiles)
  .catch(handleError)

function noop(_) {
  return _
}

function defaultToNoop(fn = noop) {
  return fn
}

function startsWithAlphanumericCharacter(file) {
  return alphanumericCharacter.test(file)
}

async function isFile(file) {
  return await statAsync(join(directory, file))
    .then((stats) => stats.isFile())
    .then((isFile) => isFile ? file : undefined)
    .catch(handleError)
}

async function casify(file) {
  /**
   * Skips uncommon files, e.g. .gitignore
   */
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
    .then((files) => Promise.all(files.map(casify)))
    .catch(handleError)
}

function handleError(error) {
  console.error(error.message)
}
