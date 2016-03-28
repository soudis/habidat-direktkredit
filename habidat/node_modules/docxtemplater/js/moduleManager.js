var ModuleManager;

module.exports = ModuleManager = (function() {
  function ModuleManager() {
    this.modules = [];
  }

  ModuleManager.prototype.attachModule = function(module) {
    this.modules.push(module);
    module.manager = this;
    return this;
  };

  ModuleManager.prototype.sendEvent = function(eventName, data) {
    var i, len, m, ref, results;
    ref = this.modules;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      m = ref[i];
      results.push(m.handleEvent(eventName, data));
    }
    return results;
  };

  ModuleManager.prototype.get = function(value) {
    var aux, i, len, m, ref, result;
    result = null;
    ref = this.modules;
    for (i = 0, len = ref.length; i < len; i++) {
      m = ref[i];
      aux = m.get(value);
      result = aux !== null ? aux : result;
    }
    return result;
  };

  ModuleManager.prototype.handle = function(type, data) {
    var aux, i, len, m, ref, result;
    result = null;
    ref = this.modules;
    for (i = 0, len = ref.length; i < len; i++) {
      m = ref[i];
      if (result !== null) {
        return;
      }
      aux = m.handle(type, data);
      result = aux !== null ? aux : result;
    }
    return result;
  };

  ModuleManager.prototype.getInstance = function(obj) {
    return this[obj];
  };

  return ModuleManager;

})();
