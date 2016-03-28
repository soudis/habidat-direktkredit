
/*
PptxGen.coffee
Created by @contextmatters, based on DocxGen by Edgar HIPP
 */
var DocxGen, PptXTemplater, PptxGen,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

DocxGen = require('./docxgen');

PptXTemplater = require('./pptxTemplater');

PptxGen = PptxGen = (function(superClass) {
  extend(PptxGen, superClass);

  function PptxGen() {
    return PptxGen.__super__.constructor.apply(this, arguments);
  }

  PptxGen.prototype.getTemplateClass = function() {
    return PptXTemplater;
  };

  PptxGen.prototype.getTemplatedFiles = function() {
    var slideTemplates;
    slideTemplates = this.zip.file(/ppt\/(slides|slideMasters)\/(slide|slideMaster)\d+\.xml/).map(function(file) {
      return file.name;
    });
    return slideTemplates.concat(["ppt/presentation.xml"]);
  };

  PptxGen.prototype.getFullText = function(path) {
    if (path == null) {
      path = "ppt/slides/slide1.xml";
    }
    return PptxGen.__super__.getFullText.call(this, path);
  };

  return PptxGen;

})(DocxGen);

module.exports = PptxGen;
