'use strict';

const fs = require('fs');
const path = require('path');

class DependencyCheckPlugin {
  constructor({ statsOptions, statsFile, checkOptions } = {}) {
    this.statsOptions = statsOptions;

    if (isString(statsFile)) {
      this.generateStatsFile = true;
      this.statsFilename = statsFile;
    } else if (statsFile === true) {
      this.generateStatsFile = true;
      this.statsFilename = 'stats.json';
    } else {
      this.generateStatsFile = false;
      this.statsFilename = '';
    }

    this.checkOptions = checkOptions;
  }

  apply(compiler) {
    let statsOptions = this.statsOptions;
    let statsFilename = this.statsFilename;
    let checkOptions = this.checkOptions;
    let onDoneCallback = onDone(statsOptions, statsFilename, checkOptions);

    compiler.hooks.done.tap('Dependency Check Plugin', onDoneCallback);
  }
}

module.exports = DependencyCheckPlugin;

function onDone(statsOptions, statsFilename, checkOptions) {
  return function (stats) {
    if (!isObject(statsOptions)) {
      statsOptions = {
        all: false,
        modules: true,
        reasons: true,
        modulesSort: 'index',
        orphanModules: true, // Webpack 5
      };
    }
    checkOptions = Object.assign(
      {
        moduleFilter: isRootLib,
        checkKeys: 'dependencies',
        onDone: noop,
      },
      checkOptions,
    );

    let statsData = stats.toJson(statsOptions);
    if (statsFilename) {
      fs.writeFileSync(statsFilename, JSON.stringify(statsData, null, 2));
    }

    let { moduleFilter } = checkOptions;
    let bundledMap = {};
    let bundled = [];
    statsData.modules.forEach((module) => {
      let result = moduleFilter(module);
      if (result === false) return;

      let name = getLibName(module.name);
      if (!bundledMap[name]) {
        bundledMap[name] = result;
        bundled.push(name);
      }
    });
    let padLen = getMaxLen(bundled) + 4;
    console.log('\n');
    console.log(`Bundled dependencies:\n${bundled.map((name) => ('* ' + name).padEnd(padLen) + bundledMap[name]).join('\n')}`);

    let { checkKeys } = checkOptions;
    checkKeys = isArray(checkKeys) ? checkKeys : [checkKeys];
    let jsonObj = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    let pronounced = checkKeys.reduce(function (arr, key) {
      arr = arr.concat(Object.keys(jsonObj[key] || {}));
      return arr;
    }, []);
    let missing = bundled.filter((name) => !pronounced.includes(name));
    let unused = pronounced.filter((name) => !bundled.includes(name));
    if (missing.length > 0) console.log(`Missing dependencies:\n${missing.map((name) => '* ' + name).join('\n')}`);
    if (unused.length > 0) console.log(`Unused dependencies:\n${unused.map((name) => '* ' + name).join('\n')}`);
    console.log('\n');

    let { onDone } = checkOptions;
    onDone(missing, unused, bundled);
  };
}

/**
 * param example:
 * "name": "./node_modules/throttle-debounce/esm/index.js",
 */
/*
function getLibName(name) {
  let file = isString(name) && name.split('!').shift();
  let tag = 'node_modules/';
  let dirname = file;
  while ((dirname = path.dirname(dirname))) {
    if (fs.existsSync(path.join(dirname, 'package.json'))) {
      // 法一:
      let index;
      while ((index = dirname.indexOf(tag)) > -1) {
        dirname = dirname.slice(index + tag.length);
      }

      // 法二: 既然都找到 package.json 了, 直接读取 name 字段它不香么...
      break;
    }
  }
  return dirname;
}
*/
function getLibName(modules) {
  let file = isString(modules) && modules.split('!').shift();
  let dirname = file;
  while ((dirname = path.dirname(dirname))) {
    try {
      let name = JSON.parse(fs.readFileSync(path.join(dirname, 'package.json'), 'utf8')).name;
      if (name) return name;
    } catch (error) {}
  }
  return null;
}
function isRootLib(module) {
  let result = false;
  return (
    isLibName(module.name) &&
    isArray(module.issuerPath) &&
    module.issuerPath.some((p) => isHostName(p.name)) &&
    isArray(module.reasons) &&
    module.reasons.some((r) => {
      if (isReasonHostName(r.moduleName)) {
        let reason = r.moduleName.split('!').pop();
        let match = reason.match(/^([^?]+)/);
        result = match ? match[0] : reason;
        return true;
      } else {
        return false;
      }
    }) &&
    result
  );
}
function isLibName(name) {
  if (!isString(name)) return false;
  name = name.split('!').shift();
  if (!isString(name)) return false;
  return name.indexOf('./node_modules/') === 0 && /\.js$/.test(name);
}
function isHostName(name) {
  if (!isString(name)) return false;
  name = name.split('!').shift();
  if (!isString(name)) return false;
  return name.indexOf('./node_modules/') < 0 && /\.js$/.test(name);
}
function isReasonHostName(name) {
  if (!isString(name)) return false;
  name = name.split('!').pop();
  if (!isString(name)) return false;
  return name.indexOf('./node_modules/') < 0 && (/\.js$/.test(name) || name.includes('type=script'));
}

function getMaxLen(arr) {
  return Math.max.apply(
    null,
    arr.map((str) => str.length),
  );
}

function isArray(value) {
  return Object.prototype.toString.call(value) === '[object Array]';
}
function isObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}
function isString(value) {
  return typeof value === 'string';
}

function noop() {}
