#!/usr/bin/env node

const os = require('os');
const fs = require('fs');
const spawnSync = require('child_process').spawnSync;

const npm = os.platform() === 'win32' ? 'npm.cmd' : 'npm';

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = process.exitCode || error.code || 1;
}

function main() {
  const restorers = [];
  try {
    restorers.push(backup('node_modules'));
    restorers.push(backup('package-lock.json'));
    restorers.push(modifyPackageJson());
    runCmd(npm, ['link'], { stdio: 'inherit' });
  } finally {
    restorers.forEach(r => r());
  }
}

function backup(original) {
  if (fs.existsSync(original)) {
    const stats = fs.statSync(original);
    const backup = original + '-backup';
    fs.renameSync(original, backup);
    console.log(`Backed up '${original}' -> ${backup}`);
    return () => {
      try {
        if (fs.existsSync(original)) {
          if (stats.isDirectory()) {
            fs.rmdirSync(original);
          } else {
            fs.unlinkSync(original);
          }
          console.log(`Removed ${original}`);
        }
        fs.renameSync(backup, original);
        console.log(`Restored '${backup}' -> ${original}`);
        return true;
      } catch (error) {
        console.error(`Couldn't restore '${backup}' -> ${original}. ${error.message}`);
        return false;
      }
    }
  } else {
    return () => {};
  }
}

function getPackageJson(keysToRemove = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies', 'scripts']) {
  const string = fs.readFileSync('package.json', 'utf8');
  const json = JSON.parse(string);
  const sansDependencies = {}
  for (const key in json) {
    if (keysToRemove.includes(key)) continue;
    sansDependencies[key] = json[key];
  }
  return { json, sansDependencies, string };
}

function modifyPackageJson() {
  const packageJson = getPackageJson();
  const restore = backup('package.json');
  writePackageJson(packageJson.sansDependencies);
  console.log(`Modified 'package.json'`);
  return restore;
}

function writePackageJson(packageJson, filename = 'package.json', { suffix = '\n', spaces = 2 } = {}) {
  if (typeof packageJson !== 'string') {
    packageJson = JSON.stringify(packageJson, null, spaces) + suffix;
  }
  fs.writeFileSync(filename, packageJson);
}

function runCmd(cmd, args, opts) {
  console.log('Running:', cmd, ...args);
  const { status } = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (status) {
    console.error('Failed!', cmd, ...args);
    process.exitCode = status;
    return false;
  } else {
    console.log('Success!', cmd, ...args);
    return true;
  }
}
