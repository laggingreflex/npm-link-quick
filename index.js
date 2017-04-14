#!/usr/bin/env node

const os = require('os')
const fs = require('fs')
const path = require('path')
const spawn = require('child_process').spawn

const npm = os.platform() === 'win32' ? 'npm.cmd' : 'npm'
const cwd = p => path.join(process.cwd(), p || '.')
const tmp = p => path.join(os.tmpdir(), 'npm-link-quick-' + (p || '') + '_' + Number(Date.now()))

const pkg = require(cwd('package.json'))
const orgPkg = fs.readFileSync(cwd('package.json'), 'utf8');

const keysToRemove = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies', 'scripts']

keysToRemove.forEach(k => modifyPkgJsonKey(pkg, k));

fs.writeFileSync(cwd('package.json'), JSON.stringify(pkg, null, 2))

try {
  fs.renameSync(cwd('node_modules'), cwd('node_modules-original'))
} catch (error) {}

spawn(npm, ['link'], { stdio: 'inherit' }).on('close', () => {
  let err = null

  try {
    fs.unlinkSync(cwd('node_modules'))
  } catch (error) {
    fs.renameSync(cwd('node_modules'), cwd('node_modules-remove-me'))
    const tmpdir = tmp(pkg.name)
    try {
      // console.log(tmpdir);
      fs.renameSync(cwd('node_modules-remove-me'), tmpdir)
      try {
        fs.unlinkSync(tmpdir)
      } catch (error) {
        err = true
        console.warn(`Warning: Couldn't remove temporary node_modules dir:`, tmpdir, '\n', error.message, '\n Kindly remove it yourself.');
      }
    } catch (error) {
      err = true
      console.warn(`Warning: Couldn't remove temporary node_modules dir:`, cwd('node_modules-remove-me'), '\n', error.message, '\n Kindly remove it yourself.');
    }
  }

  try {
    fs.renameSync(cwd('node_modules-original'), cwd('node_modules'))
  } catch (error) {}

  fs.writeFileSync(cwd('package.json'), orgPkg)

  console.log('Done!');

})


function modifyPkgJsonKey(pkg, key) {
  let tmp = key + '_npm_quick_link_tmp';
  if (pkg[key]) {
    pkg[tmp] = pkg[key];
    delete pkg[key];
  }
}
