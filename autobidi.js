// Fill in missing functions (for IE)
if (!Array.prototype.filter)
{
  Array.prototype.filter = function(fun /*, thisp*/)
  {
    var len = this.length >>> 0;
    if (typeof fun != "function")
      throw new TypeError();

    var res = [];
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in this)
      {
        var val = this[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, this))
          res.push(val);
      }
    }

    return res;
  };
}

if (!Array.prototype.map)
{
  Array.prototype.map = function(fun /*, thisp*/)
  {
    var len = this.length >>> 0;
    if (typeof fun != "function")
      throw new TypeError();

    var res = new Array(len);
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in this)
        res[i] = fun.call(thisp, this[i], i, this);
    }

    return res;
  };
}

if (typeof console === 'undefined') {
  console = { 'log': function() {} };
}
// namespace
bidiweb = (function(){
var module = {};

/**
    Input: raw text
    Output: The base direction of the paragraph

    @returns: a string, one of: ('R', 'L', 'N')

    If guesstimate is false, returns the direction of the first character.
    If guesstimate is true, it uses the following heuristic:

    - Read the first X words (use 15 for X) of the first line.
    - Use the direction of the first words as the first candidate, call it D,
      and let the other direction be T.
    - If the first line has less than X words, return D as the base.
    - Determine the ratio of T words to D words in the first X words
    - If the T direction occupies more than P% of the words (use 60 for P),
      return it as the base paragraph direction
    - Else, return D as the base paragraph direction

    Notes: 
       - An explicit unicode mark as the first character can be used to override
       this heuristic [NOT-YET]
       - We only return N if the paragraph doesn't seem to have any real words
 */
module.get_direction = function(text, guesstimate)
{
    if (guesstimate == null) guesstimate = false;

    // TODO: check first character is a unicode dir character!
    var is_word = function(word) {
        return word.length > 0; // && word.match(/\w+/) 
        // wops! \w only matches ascii characters :(
    }
    var words = text.split(' ').filter(is_word);

    var dirs = words.map(module.get_word_dir);

    var func_same_direction = function(dir) { 
        return function(d) { return d == dir; }; 
    }
    var is_non_neutral_dir = function(d) { return d != 'N'; };
    var other_direction = function(dir) { return {'L':'R', 'R':'L'}[dir]; };

    // should be really the same as dirs because we already filtered out
    // things that are not words!
    var X = 100;
    var hard_dirs = dirs.filter(is_non_neutral_dir).slice(0, X);

    if (hard_dirs.length == 0) { return 'N'; }
    var candidate = hard_dirs[0];

    if(guesstimate === false) {
        return candidate;
    }

    var DIR_COUNT_THRESHOLD = 10;
    if (hard_dirs.length < DIR_COUNT_THRESHOLD) return candidate;

    var cand_words = hard_dirs.filter(func_same_direction(candidate));
    var other_words = hard_dirs.filter(func_same_direction(other_direction(candidate)));

    if (other_words.length == 0) return candidate;
    var other_dir = other_words[0];

    var MIN_RATIO = 0.4; // P
    var ratio = cand_words.length / other_words.length;
    if (ratio >= MIN_RATIO) {
        return candidate;
    } else {
        return other_dir;
    }
}

/**
    @notes: assumes `word` is already setup properly
 */
module.get_word_dir = function(word) {
    // stolen from google's i18n.bidi
    // regexes to identify ltr and rtl characters
    // TODO: check if CJK are included as ltr or no?
    var ltr_re_ =
        'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF' +
        '\u2C00-\uFB1C\uFE00-\uFE6F\uFEFD-\uFFFF';

    var rtl_re_ = '\u0591-\u07FF\uFB1D-\uFDFF\uFE70-\uFEFC';
    // end of google steal

    var ltr_re = RegExp('[' + ltr_re_ + ']+');
    var rtl_re = RegExp('[' + rtl_re_ + ']+');

    if(ltr_re.exec(word)) {
        return 'L';
    } else if (rtl_re.exec(word)) {
        return 'R';
    } else {
        return 'N';
    }
}

var clean_css = function(element) {
    // element should be a single element, not many elements ..
    element = jQuery(element);
    var clean_prop = function(e, prop) {
        if(e.css(prop) == e.parent().css(prop)) {
            e.css(prop, '');
        }
    }
    clean_prop(element, 'direction');
    clean_prop(element, 'text-align');
    if(element.attr('style') == '') {
        element.removeAttr('style');
    }
}

/**
    High Level API 

    Fix the direction for a given set of elements

    Requires jQuery

    @param container: jQuery query that finds container elements; i.e. input to
        jQuery(...): either a string or a jQuery object
    @param elements: optional: a query to find elements that we want to fix.
        The default is: 'h1, h2, h3, p, ul, ol, blockquote'
    @param extra_elements: optional: if you don't want to replace the default
        elements, you can specify extra elements that you want to process
    @param method: optional, one of 'inline' or 'class' (defaults to inline)
    @param ltr_class: if you choose 'class' for the method, this is the class
        name that will be added to elements which are detected to be LTR;
        defaults to 'ltr'
    @param rtl_class: if you choose 'class' for the method, this is the class
        name that will be added to elements which are detected to be RTL;
        defaults to 'rtl'
    @param clean: don't put extra attributes that are not needed
        For example, if the parent element is already LTR, there's no need to clutter the html/dom with extra css properties
    @param set_align: optional. When using the inline method, should we also
        set the text-align attribute? defaults to `true`
 */
module.process = function (options) {
    // allow the user to just pass the container and count on the defaults
    if(options.container == null){
        options = {'container': options}
    }

    var default_options = {
        'container': '.content',
        'elements': 'h1, h2, h3, p, ul, ol, blockquote, div, span',
        'extra_elements': null,
        'rtl_class': 'rtl',
        'ltr_class': 'ltr',
        'method': 'inline',
        'clean': true,
        'use_guesstimate': false,
        'set_align': false,
        }

    // use default options
    for(key in default_options) {
        if (!(key in options)) options[key] = default_options[key];
    }

    function jq_process_inline() {
        var e = jQuery(this); // element
        var dir = module.get_direction(e.text(), options.use_guesstimate);
        var map = { 
            'L': 'ltr',
            'R': 'rtl'
            }
        if(!(dir in map)) return;
        e.css('direction', map[dir]);
        if(options.set_align) {
            // we might have problems with cleaning after-wards ..
            // so by default, set_aligh is set to false
            e.css('text-align', 'start');
        }

    }

    function jq_process_to_class() {
        var e = jQuery(this); // element
        var dir = module.get_direction(e.text(), options.use_guesstimate);
        var map = {'L': options.ltr_class, 'R': options.rtl_class};
        if(!(dir in map)) return;
        e.addClass(map[dir]);
    }

    var container = jQuery(options.container);
    var elements = container.add(container.find(options.elements)); // add creates a new object; doesn't mutate container
    if(options.extra_elements) {
        elements = elements.add(container.find(options.extra_elements));
    }
    var map = {'inline': jq_process_inline, 'class': jq_process_to_class};
    if (!(options.method in map)) {
        console.log("Warning: autobidi: the specified method is invalid: " + method);
        options.method = default_options.method;
    }
    elements.each(map[options.method])
    if(options.clean) {
        elements.each(function(index, element){
            clean_css(element);
        });
    }
}

return module;
})();
