'use strict';

var extend = require('cloneextend').extend;

/**
 * Represents a strategy that validates the configuration (post loading).
 *
 * @class
 */
function ValidateClientConfigStrategy () {
}

ValidateClientConfigStrategy.prototype.process = function (config, callback) {
  var newError = function (err) {
    callback(new Error(err));
  };

  if (!config) {
    return newError("Configuration not instantiated.");
  }

  var client = config.client;

  if (!client) {
    return newError("Client cannot be empty.");
  }

  var apiKey = client.apiKey;

  if (!apiKey) {
    return newError("API key cannot be empty.");
  } if (!apiKey.id || !apiKey.secret) {
    return newError("API key ID and secret is required.");
  }

  var application = config.application;

  if (!application) {
    return newError("Application cannot be empty.");
  }

  if (application.href && application.href.indexOf('/applications/') === -1) {
    return newError("Application HREF '" + application.href + "' is not a valid Stormpath Application HREF.");
  }

  callback(null, config);
};

module.exports = ValidateClientConfigStrategy;
