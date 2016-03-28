'use strict';

var extend = require('cloneextend').extend;

/**
 * Represents a strategy that extends the configuration.
 *
 * @class
 */
function ExtendConfigStrategy (extendWith) {
  this.extendWith = extendWith;
}

ExtendConfigStrategy.prototype.process = function (config, callback) {
  extend(config, this.extendWith);

  // TODO: FIX HACK! Resolve this in a more generic/re-usable way, perhaps
  // using a different object extension library.
  if(this.extendWith && this.extendWith.cacheOptions && this.extendWith.cacheOptions.client){
    config.cacheOptions.client = this.extendWith.cacheOptions.client;
  }

  callback(null, config);
};

module.exports = ExtendConfigStrategy;
