var XTError, XTInternalError, XTScopeParserError, XTTemplateError;

XTError = function(message) {
  this.name = "GenericError";
  this.message = message;
  return this.stack = (new Error()).stack;
};

XTError.prototype = new Error;

XTTemplateError = function(message) {
  this.name = "TemplateError";
  this.message = message;
  return this.stack = (new Error()).stack;
};

XTTemplateError.prototype = new XTError;

XTScopeParserError = function(message) {
  this.name = "ScopeParserError";
  this.message = message;
  return this.stack = (new Error()).stack;
};

XTScopeParserError.prototype = new XTError;

XTInternalError = function(message) {
  this.name = "InternalError";
  this.properties = {
    explanation: "InternalError"
  };
  this.message = message;
  return this.stack = (new Error()).stack;
};

XTInternalError.prototype = new XTError;

module.exports = {
  XTError: XTError,
  XTTemplateError: XTTemplateError,
  XTInternalError: XTInternalError,
  XTScopeParserError: XTScopeParserError
};
