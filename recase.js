#! /usr/bin/env node

const { join, resolve } = require('path')
const { stat, readdir, rename } = require('fs')
const { promisify } = require('util')

const statAsync = promisify(stat)
const readdirAsync = promisify(readdir)
const renameAsync = promisify(rename)

const casey = require('casey-js')

const noop = (_) => _

const Case = {
  lower: casey.toLowerCase,
  upper: casey.toUpperCase,
  camel: casey.toCamelCase,
  kebab: casey.toKebabCase,
  snake: casey.toSnakeCase,
  train: casey.toTrainCase
}

/**
 * TODO: use yargs to handle arguments
 */
const pathArg = resolve(__dirname, process.argv[2])
const caseArg = Case[process.argv[3]] || noop

/**
 * Recaser
 */
readdirAsync(pathArg)
  .then(handleFiles)
  .catch(handleError)

/**
 * TODO: try to filter inside the isFile function
 */
async function isFile(path) {
  return await statAsync(join(pathArg, path))
    .then((stats) => stats.isFile())
    .then((isFile) => isFile ? path : undefined)
    .catch(handleError)
}

function fragment(file) {
  const fragments = file.split('.')
  return {
    raw: file,
    name: fragments[0],
    ext: fragments.slice(1).join('.')
  }
}

async function casify(file) {
  const oldName = join(pathArg, file.raw)
  /**
   * TODO: extract the following transformation to a dedicated function
   */
  const newName = join(pathArg, caseArg(file.name).concat('.').concat(file.ext))
  return await renameAsync(oldName, newName)
}

function handleFiles(files) {
  return Promise
    .all(files.map((file) => isFile(file)))
    .then((files) => files.filter((file) => file))
    .then((files) => files.map((file) => fragment(file)))
    .then((files) => Promise.all(files.map(casify)))
    .catch(handleError)
}

function handleError(error) {
  console.error(error.message)
}
