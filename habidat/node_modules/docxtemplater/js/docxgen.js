
/*
Docxgen.coffee
Created by Edgar HIPP
 */
var DocUtils, DocxGen;

DocUtils = require('./docUtils');

DocxGen = DocxGen = (function() {
  function DocxGen(content, options) {
    this.moduleManager = new DocxGen.ModuleManager();
    this.moduleManager.gen = this;
    this.templateClass = this.getTemplateClass();
    this.setOptions({});
    if (content != null) {
      this.load(content, options);
    }
  }

  DocxGen.prototype.attachModule = function(module) {
    this.moduleManager.attachModule(module);
    return this;
  };

  DocxGen.prototype.setOptions = function(options1) {
    var defaultValue, key, ref;
    this.options = options1 != null ? options1 : {};
    ref = DocUtils.defaults;
    for (key in ref) {
      defaultValue = ref[key];
      this[key] = this.options[key] != null ? this.options[key] : defaultValue;
    }
    return this;
  };

  DocxGen.prototype.getTemplateClass = function() {
    return DocxGen.DocXTemplater;
  };

  DocxGen.prototype.getTemplatedFiles = function() {
    var slideTemplates;
    slideTemplates = this.zip.file(/word\/(header|footer)\d+\.xml/).map(function(file) {
      return file.name;
    });
    return slideTemplates.concat(["word/document.xml"]);
  };

  DocxGen.prototype.load = function(content, options) {
    this.moduleManager.sendEvent('loading');
    if (content.file != null) {
      this.zip = content;
    } else {
      this.zip = new DocxGen.JSZip(content, options);
    }
    this.moduleManager.sendEvent('loaded');
    this.templatedFiles = this.getTemplatedFiles();
    return this;
  };

  DocxGen.prototype.renderFile = function(fileName) {
    var currentFile;
    this.moduleManager.sendEvent('rendering-file', fileName);
    currentFile = this.createTemplateClass(fileName);
    this.zip.file(fileName, currentFile.render().content);
    return this.moduleManager.sendEvent('rendered-file', fileName);
  };

  DocxGen.prototype.render = function() {
    var fileName, i, len, ref;
    this.moduleManager.sendEvent('rendering');
    ref = this.templatedFiles;
    for (i = 0, len = ref.length; i < len; i++) {
      fileName = ref[i];
      if (this.zip.files[fileName] != null) {
        this.renderFile(fileName);
      }
    }
    this.moduleManager.sendEvent('rendered');
    return this;
  };

  DocxGen.prototype.getTags = function() {
    var currentFile, fileName, i, len, ref, usedTags, usedTemplateV;
    usedTags = [];
    ref = this.templatedFiles;
    for (i = 0, len = ref.length; i < len; i++) {
      fileName = ref[i];
      if (!(this.zip.files[fileName] != null)) {
        continue;
      }
      currentFile = this.createTemplateClass(fileName);
      usedTemplateV = currentFile.render().usedTags;
      if (DocUtils.sizeOfObject(usedTemplateV)) {
        usedTags.push({
          fileName: fileName,
          vars: usedTemplateV
        });
      }
    }
    return usedTags;
  };

  DocxGen.prototype.setData = function(tags) {
    this.tags = tags;
    return this;
  };

  DocxGen.prototype.getZip = function() {
    return this.zip;
  };

  DocxGen.prototype.createTemplateClass = function(path) {
    var _, key, obj, ref, usedData;
    usedData = this.zip.files[path].asText();
    obj = {
      tags: this.tags,
      moduleManager: this.moduleManager
    };
    ref = DocUtils.defaults;
    for (key in ref) {
      _ = ref[key];
      obj[key] = this[key];
    }
    return new this.templateClass(usedData, obj);
  };

  DocxGen.prototype.getFullText = function(path) {
    if (path == null) {
      path = "word/document.xml";
    }
    return this.createTemplateClass(path).getFullText();
  };

  return DocxGen;

})();

DocxGen.DocUtils = require('./docUtils');

DocxGen.DocXTemplater = require('./docxTemplater');

DocxGen.JSZip = require('jszip');

DocxGen.Errors = require('./errors');

DocxGen.ModuleManager = require('./moduleManager');

DocxGen.XmlTemplater = require('./xmlTemplater');

DocxGen.XmlMatcher = require('./xmlMatcher');

DocxGen.XmlUtil = require('./xmlUtil');

DocxGen.SubContent = require('./subContent');

module.exports = DocxGen;
