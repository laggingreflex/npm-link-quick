#!/usr/bin/env node

const os = require('os')
const fs = require('fs')
const path = require('path')
const spawn = require('child_process').spawn

const npm = os.platform() === 'win32' ? 'npm.cmd' : 'npm'
const cwd = p => path.join(process.cwd(), p || '.')
const tmp = p => path.join(os.tmpdir(), 'npm-link-quick-' + (p || '') + '_' + Number(Date.now()))

const pkg = require(cwd('package.json'))
const orgPkg = fs.readFileSync(cwd('package.json'), 'utf8')

const keysToRemove = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies', 'scripts']

keysToRemove.forEach(k => modifyPkgJsonKey(pkg, k))

fs.writeFileSync(cwd('package.json'), JSON.stringify(pkg, null, 2))

let renamedOldNodeModules
try {
  fs.renameSync(cwd('node_modules'), cwd('node_modules-original'))
  renamedOldNodeModules = true
} catch (error) {}

spawn(npm, ['link'], { stdio: 'inherit' }).on('close', () => {
  let err = null

  if (renamedOldNodeModules) {
    let removedTempNodeModules
    try {
      fs.rmdirSync(cwd('node_modules'))
      removedTempNodeModules = true
    } catch (error) {
      // // console.error(error.message)
      // console.warn(`Warning: Couldn't remove temporary node_modules dir.`, error.message)
      // console.warn(`Please remove 'node_modules'`)
      // console.warn(`And rename 'node_modules-original' => 'node_modules'`)
    }

    try {
      fs.renameSync(cwd('node_modules-original'), cwd('node_modules'))
    } catch (error) {
      // console.error(error.message)
      console.warn(`Warning: Couldn't restore original node_modules dir.`, error.message)
      console.warn(`Please rename 'node_modules-original' => 'node_modules'`)
    }

  }

  try {
    fs.writeFileSync(cwd('package.json'), orgPkg)
  } catch (error) {
    // console.error(error.message)
    console.warn(`Warning: Couldn't restore original package.json.`, error.message)
    console.warn(`Please restore from git repo if possible`)
  }

  console.log('Done!')
})


function modifyPkgJsonKey(pkg, key) {
  let tmp = key + '_npm_quick_link_tmp'
  if (pkg[key]) {
    pkg[tmp] = pkg[key]
    delete pkg[key]
  }
}
