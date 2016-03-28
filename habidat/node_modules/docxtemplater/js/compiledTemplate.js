var CompiledTemplate, Errors;

Errors = require("./errors");

CompiledTemplate = CompiledTemplate = (function() {
  function CompiledTemplate() {
    this.compiled = [];
    this;
  }

  CompiledTemplate.prototype.prependText = function(text) {
    this.compiled.unshift(text);
    return this;
  };

  CompiledTemplate.prototype.appendTag = function(compiledTag) {
    var err;
    if (!compiledTag) {
      err = new Errors.XTInternalError("Compiled tag empty");
      err.properties.id = "tag_appended_empty";
      throw err;
    }
    this.compiled = this.compiled.concat(compiledTag.compiled);
    return this;
  };

  CompiledTemplate.prototype.appendRaw = function(tag) {
    this.compiled.push({
      type: 'raw',
      tag: tag
    });
    return this;
  };

  CompiledTemplate.prototype.appendText = function(text) {
    if (text !== '') {
      this.compiled.push(text);
    }
    return this;
  };

  CompiledTemplate.prototype.appendSubTemplate = function(subTemplate, tag, inverted) {
    var err;
    if (!subTemplate) {
      err = new Errors.XTInternalError("Subtemplate empty");
      err.properties.id = "subtemplate_appended_empty";
      throw err;
    }
    return this.compiled.push({
      type: 'loop',
      tag: tag,
      inverted: inverted,
      template: subTemplate
    });
  };

  return CompiledTemplate;

})();

module.exports = CompiledTemplate;
