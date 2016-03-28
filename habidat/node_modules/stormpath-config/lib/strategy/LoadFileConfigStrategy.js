'use strict';

var fs = require('fs');
var path = require('path');
var extend = require('cloneextend').extend;
var expandHomeDir = require('expand-home-dir');
var parsers = require('./../parser');

/**
 * Load File Config Strategy
 * Represents a strategy that loads configuration from either a JSON or YAML file into the configuration.
 * @constructor
 */
function LoadFileConfigStrategy (filePath, mustExist, encoding) {
  this.filePath = expandHomeDir(filePath);
  this.mustExist = mustExist || false;
  this.encoding = encoding || 'utf8';
}

LoadFileConfigStrategy.prototype.process = function (config, callback) {
  var outerScope = this;

  var filePath = this.filePath;
  var mustExist = this.mustExist;
  var extension = path.extname(filePath).substring(1);

  var parser = parsers[extension];

  if (!parser) {
    return callback(new Error("Unable to load file '" + filePath + "'. Extension '" + extension + "' not supported."));
  }

  fs.exists(this.filePath, function (exists) {
    if (!exists) {
      if (mustExist) {
        callback(new Error("Config file '" + filePath + "' doesn't exist."));
      } else {
        callback(null, config);
      }
    } else {
      fs.readFile(filePath, { encoding: outerScope.encoding }, function (err, result) {
        if (err) {
          return callback(err);
        }

        parser(result, function (err, data) {
          if (err) {
            return callback(new Error("Error parsing file '" + filePath + "'.\nDetails: " + err));
          }

          if (data) {
            extend(config, data);
          }

          callback(null, config);
        });
      });
    }
  });
};

module.exports = LoadFileConfigStrategy;
