var DocUtils, XmlUtil;

DocUtils = require('./docUtils');

XmlUtil = {};

XmlUtil.getListXmlElements = function(text, start, end) {
  var i, innerCurrentTag, innerLastTag, j, justOpened, lastTag, len, result, tag, tags;
  if (start == null) {
    start = 0;
  }
  if (end == null) {
    end = text.length - 1;
  }

  /*
  	get the different closing and opening tags between two texts (doesn't take into account tags that are opened then closed (those that are closed then opened are returned)):
  	returns:[{"tag":"</w:r>","offset":13},{"tag":"</w:p>","offset":265},{"tag":"</w:tc>","offset":271},{"tag":"<w:tc>","offset":828},{"tag":"<w:p>","offset":883},{"tag":"<w:r>","offset":1483}]
   */
  tags = DocUtils.pregMatchAll("<(\/?[^/> ]+)([^>]*)>", text.substr(start, end));
  result = [];
  for (i = j = 0, len = tags.length; j < len; i = ++j) {
    tag = tags[i];
    if (tag[1][0] === '/') {
      justOpened = false;
      if (result.length > 0) {
        lastTag = result[result.length - 1];
        innerLastTag = lastTag.tag.substr(1, lastTag.tag.length - 2);
        innerCurrentTag = tag[1].substr(1);
        if (innerLastTag === innerCurrentTag) {
          justOpened = true;
        }
      }
      if (justOpened) {
        result.pop();
      } else {
        result.push({
          tag: '<' + tag[1] + '>',
          offset: tag.offset
        });
      }
    } else if (tag[2][tag[2].length - 1] !== '/') {
      result.push({
        tag: '<' + tag[1] + '>',
        offset: tag.offset
      });
    }
  }
  return result;
};

module.exports = XmlUtil;
