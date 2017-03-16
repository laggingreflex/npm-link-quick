#!/usr/bin/env node

const os = require('os')
const fs = require('fs')
const path = require('path')
const spawn = require('child_process').spawn

const npm = os.platform() === 'win32' ? 'npm.cmd' : 'npm'
const cwd = p => path.join(process.cwd(), p)
cwd.valueOf = process.cwd

const pkg = require(cwd('package.json'))

const pkg_depless = Object.assign({}, pkg, { dependencies: {}, devDependencies: {} })

fs.writeFileSync(cwd('package.json'), JSON.stringify(pkg_depless, null, 2))

try {
  fs.renameSync(cwd('node_modules'), cwd('node_modules-temp'))
} catch (error) {}

spawn(npm, ['link'], { stdio: 'inherit' }).on('close', () => {
  try {

    // fs.unlinkSync(cwd('node_modules'))
    fs.renameSync(cwd('node_modules'), cwd('node_modules-temp_installed'))
  } catch (error) {}

  try {
    fs.renameSync(cwd('node_modules-temp'), cwd('node_modules'))

  } catch (error) {}


  fs.writeFileSync(cwd('package.json'), JSON.stringify(pkg, null, 2))



})
