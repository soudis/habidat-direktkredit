var DocUtils, Errors, ScopeManager;

DocUtils = require('./docUtils');

Errors = require("./errors");

module.exports = ScopeManager = (function() {
  function ScopeManager(arg) {
    this.tags = arg.tags, this.scopePath = arg.scopePath, this.usedTags = arg.usedTags, this.scopeList = arg.scopeList, this.parser = arg.parser, this.moduleManager = arg.moduleManager, this.nullGetter = arg.nullGetter, this.delimiters = arg.delimiters;
    this.moduleManager.scopeManager = this;
  }

  ScopeManager.prototype.loopOver = function(tag, callback, inverted) {
    var value;
    if (inverted == null) {
      inverted = false;
    }
    value = this.getValue(tag);
    return this.loopOverValue(value, callback, inverted);
  };

  ScopeManager.prototype.loopOverValue = function(value, callback, inverted) {
    var i, j, len, scope, type;
    if (inverted == null) {
      inverted = false;
    }
    type = Object.prototype.toString.call(value);
    if (inverted) {
      if (value == null) {
        return callback(this.scopeList[this.num]);
      }
      if (!value) {
        return callback(this.scopeList[this.num]);
      }
      if (type === '[object Array]' && value.length === 0) {
        callback(this.scopeList[this.num]);
      }
      return;
    }
    if (value == null) {
      return;
    }
    if (type === '[object Array]') {
      for (i = j = 0, len = value.length; j < len; i = ++j) {
        scope = value[i];
        callback(scope);
      }
    }
    if (type === '[object Object]') {
      callback(value);
    }
    if (value === true) {
      return callback(this.scopeList[this.num]);
    }
  };

  ScopeManager.prototype.getValue = function(tag, num) {
    var err, error, error1, error2, parser, result, scope;
    this.num = num != null ? num : this.scopeList.length - 1;
    scope = this.scopeList[this.num];
    try {
      parser = this.parser(tag);
    } catch (error1) {
      error = error1;
      err = new Errors.XTScopeParserError("Scope parser compilation failed");
      err.properties = {
        id: "scopeparser_compilation_failed",
        tag: tag,
        explanation: "The scope parser for the tag " + tag + " failed to compile"
      };
      throw err;
    }
    try {
      result = parser.get(scope);
    } catch (error2) {
      error = error2;
      err = new Errors.XTScopeParserError("Scope parser execution failed");
      err.properties = {
        id: "scopeparser_execution_failed",
        explanation: "The scope parser for the tag " + tag + " failed to execute",
        scope: scope,
        tag: tag
      };
      throw err;
    }
    if ((result == null) && this.num > 0) {
      return this.getValue(tag, this.num - 1);
    }
    return result;
  };

  ScopeManager.prototype.getValueFromScope = function(tag) {
    var result, value;
    result = this.getValue(tag);
    if (result != null) {
      if (typeof result === 'string') {
        this.useTag(tag, true);
        value = result;
      } else if (typeof result === "number") {
        value = String(result);
      } else {
        value = result;
      }
    } else {
      this.useTag(tag, false);
      return null;
    }
    return value;
  };

  ScopeManager.prototype.useTag = function(tag, val) {
    var i, j, len, ref, s, u;
    if (val) {
      u = this.usedTags.def;
    } else {
      u = this.usedTags.undef;
    }
    ref = this.scopePath;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      s = ref[i];
      if (u[s] == null) {
        u[s] = {};
      }
      u = u[s];
    }
    if (tag !== "") {
      return u[tag] = true;
    }
  };

  return ScopeManager;

})();
