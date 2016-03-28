var DocUtils, Errors,
  slice = [].slice;

Errors = require("./errors");

DocUtils = {};

DocUtils.escapeRegExp = function(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};

DocUtils.defaults = {
  nullGetter: function(tag, props) {
    if (props.tag === "simple") {
      return "undefined";
    }
    if (props.tag === "raw") {
      return "";
    }
    return "";
  },
  parser: function(tag) {
    return {
      'get': function(scope) {
        if (tag === '.') {
          return scope;
        } else {
          return scope[tag];
        }
      }
    };
  },
  intelligentTagging: true,
  delimiters: {
    start: '{',
    end: '}'
  }
};

DocUtils.charMap = {
  '&': "&amp;",
  "'": "&apos;",
  "<": "&lt;",
  ">": "&gt;"
};

DocUtils.wordToUtf8 = function(string) {
  var endChar, ref, startChar;
  if (typeof string !== "string") {
    string = string.toString();
  }
  ref = DocUtils.charMap;
  for (endChar in ref) {
    startChar = ref[endChar];
    string = string.replace(new RegExp(DocUtils.escapeRegExp(startChar), "g"), endChar);
  }
  return string;
};

DocUtils.utf8ToWord = function(string) {
  var endChar, ref, startChar;
  if (typeof string !== "string") {
    string = string.toString();
  }
  ref = DocUtils.charMap;
  for (startChar in ref) {
    endChar = ref[startChar];
    string = string.replace(new RegExp(DocUtils.escapeRegExp(startChar), "g"), endChar);
  }
  return string;
};

DocUtils.clone = function(obj) {
  var flags, key, newInstance;
  if ((obj == null) || typeof obj !== 'object') {
    return obj;
  }
  if (typeof obj === "Date") {
    return new Date(obj.getTime());
  }
  if (typeof obj === "RegExp") {
    flags = '';
    if (obj.global != null) {
      flags += 'g';
    }
    if (obj.ignoreCase != null) {
      flags += 'i';
    }
    if (obj.multiline != null) {
      flags += 'm';
    }
    if (obj.sticky != null) {
      flags += 'y';
    }
    return new RegExp(obj.source, flags);
  }
  newInstance = new obj.constructor();
  for (key in obj) {
    newInstance[key] = DocUtils.clone(obj[key]);
  }
  return newInstance;
};

DocUtils.convertSpaces = function(s) {
  return s.replace(new RegExp(String.fromCharCode(160), "g"), " ");
};

DocUtils.pregMatchAll = function(regex, content) {

  /*regex is a string, content is the content. It returns an array of all matches with their offset, for example:
  	regex=la
  	content=lolalolilala
  	returns: [{0:'la',offset:2},{0:'la',offset:8},{0:'la',offset:10}]
   */
  var matchArray, replacer;
  if (typeof regex !== 'object') {
    regex = new RegExp(regex, 'g');
  }
  matchArray = [];
  replacer = function() {
    var i, match, offset, pn, string;
    match = arguments[0], pn = 4 <= arguments.length ? slice.call(arguments, 1, i = arguments.length - 2) : (i = 1, []), offset = arguments[i++], string = arguments[i++];
    pn.unshift(match);
    pn.offset = offset;
    return matchArray.push(pn);
  };
  content.replace(regex, replacer);
  return matchArray;
};

DocUtils.sizeOfObject = function(obj) {
  var key, size;
  size = 0;
  for (key in obj) {
    size++;
  }
  return size;
};

DocUtils.encode_utf8 = function(s) {
  return unescape(encodeURIComponent(s));
};

DocUtils.decode_utf8 = function(s) {
  var e, err, error;
  try {
    if (s === void 0) {
      return void 0;
    }
    return decodeURIComponent(escape(DocUtils.convert_spaces(s)));
  } catch (error) {
    e = error;
    err = new Errors.XTError('Could not decode utf8');
    err.properties = {
      toDecode: s,
      baseErr: e
    };
    throw err;
  }
};

DocUtils.base64encode = function(b) {
  return btoa(unescape(encodeURIComponent(b)));
};

DocUtils.tags = DocUtils.defaults.delimiters;

DocUtils.defaultParser = DocUtils.defaults.parser;

DocUtils.convert_spaces = DocUtils.convertSpaces;

DocUtils.preg_match_all = DocUtils.pregMatchAll;

module.exports = DocUtils;
