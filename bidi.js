// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License

// This stuff is taken from http://closure-library.googlecode.com/svn-history/r27/trunk/closure/goog/docs/closure_goog_i18n_bidi.js.source.html
// with modifications

bidi = {}

/**
 * Directionality enum.
 * @enum {number}
 */
bidi.Dir = {
  RTL: -1,
  UNKNOWN: 0,
  LTR: 1
};

/**
 * Unicode formatting characters and directionality string constants.
 * @enum {string}
 */
bidi.Format = {
  /** Unicode "Left-To-Right Embedding" (LRE) character. */
  LRE: '\u202A',
  /** Unicode "Right-To-Left Embedding" (RLE) character. */
  RLE: '\u202B',
  /** Unicode "Pop Directional Formatting" (PDF) character. */
  PDF: '\u202C',
  /** Unicode "Left-To-Right Mark" (LRM) character. */
  LRM: '\u200E',
  /** Unicode "Right-To-Left Mark" (RLM) character. */
  RLM: '\u200F'
};


/**
 * A practical pattern to identify strong LTR characters. This pattern is not
 * theoretically correct according to the Unicode standard. It is simplified for
 * performance and small code size.
 * @type {string}
 * @private
 */
bidi.ltrChars_ =
    'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF' +
    '\u2C00-\uFB1C\uFE00-\uFE6F\uFEFD-\uFFFF';


/**
 * A practical pattern to identify strong RTL character. This pattern is not
 * theoretically correct according to the Unicode standard. It is simplified
 * for performance and small code size.
 * @type {string}
 * @private
 */
bidi.rtlChars_ = '\u0591-\u07FF\uFB1D-\uFDFF\uFE70-\uFEFC';

/**
 * Regular expressions to check if a piece of text if of LTR directionality
 * on first character with strong directionality.
 * @type {RegExp}
 * @private
 */
bidi.ltrDirCheckRe_ = new RegExp(
    '^[^' + bidi.rtlChars_ + ']*[' + bidi.ltrChars_ + ']');

/**
 * Regular expression to check for LTR characters.
 * @type {RegExp}
 * @private
 */
bidi.ltrCharReg_ = new RegExp('[' + bidi.ltrChars_ + ']');

/**
 * Test whether the given string has any LTR characters in it.
 * @param {string} text The given string that need to be tested.
 * @return {boolean} Whether the string contains LTR characters.
 */
bidi.hasAnyLtr = function(text) {
  return bidi.ltrCharReg_.test(text);
};


/**
 * Regular expressions to check if a piece of text if of RTL directionality
 * on first character with strong directionality.
 * @type {RegExp}
 * @private
 */
bidi.rtlDirCheckRe_ = new RegExp(
    '^[^' + bidi.ltrChars_ + ']*[' + bidi.rtlChars_ + ']');

bidi.rtlRe = bidi.rtlDirCheckRe_;


/**
 * Check whether the first strongly directional character (if any) is RTL.
 * @param {text} str String being checked.
 * @return {boolean} Whether RTL directionality is detected using the first
 *     strongly-directional character method.
 */
bidi.isRtlText = function(text) {
    return bidi.rtlDirCheckRe_.test(text);
}

/**
 * Check whether the first strongly directional character (if any) is LTR.
 * @param {text} str String being checked.
 * @return {boolean} Whether LTR directionality is detected using the first
 *     strongly-directional character method.
 */
bidi.isLtrText = function(text) {
    return bidi.ltrDirCheckRe_.test(text);
}

/**
 * Regular expression to check if a string looks like something that must
 * always be LTR even in RTL text, e.g. a URL. When estimating the
 * directionality of text containing these, we treat these as weakly LTR,
 * like numbers.
 * @type {RegExp}
 * @private
 */
bidi.isRequiredLtrRe_ = /^http:\/\/.*/;

/**
 * Regular expression to check if a string contains any numerals. Used to
 * differentiate between completely neutral strings and those containing
 * numbers, which are weakly LTR.
 * @type {RegExp}
 * @private
 */
bidi.hasNumeralsRe_ = /\d/;

/**
 * Estimates the directionality of a string based on relative word counts.
 * If the number of RTL words is above a certain percentage of the total number
 * of strongly directional words, returns RTL.
 * Otherwise, if any words are strongly or weakly LTR, returns LTR.
 * Otherwise, returns UNKNOWN, which is used to mean "neutral".
 * Numbers are counted as weakly LTR.
 * @param {string} text The string to be checked.
 * @param {number} detectionThreshold A number from 0 to 1 representing the percentage
 * @return {bidi.Dir} Estimated overall directionality of {@code str}.
 */
bidi.estimateDirection = function(text, detectionThreshold) {
  var rtlCount = 0;
  var totalCount = 0;
  var hasWeaklyLtr = false;
  var tokens = text.split(/\s+/);
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    if (bidi.isRtlText(token)) {
      rtlCount++;
      totalCount++;
    } else if (bidi.isRequiredLtrRe_.test(token)) {
      hasWeaklyLtr = true;
    } else if (bidi.hasAnyLtr(token)) {
      totalCount++;
    } else if (bidi.hasNumeralsRe_.test(token)) {
      hasWeaklyLtr = true;
    }
  }

  return totalCount == 0 ?
      (hasWeaklyLtr ? bidi.Dir.LTR : bidi.Dir.UNKNOWN) :
      (rtlCount / totalCount > detectionThreshold ?
          bidi.Dir.RTL : bidi.Dir.LTR);
};

