var _ = require('lodash');

function Config () {
}

Config.prototype.clone = function () {
  return _.deepCopy(this);
};

Config.prototype.toString = function () {
  return JSON.stringify(this, null, 4);
};

module.exports = Config;
