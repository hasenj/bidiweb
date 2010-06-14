// namespace
if(typeof bidiweb === 'undefined') {
    bidiweb = {};
}

/**
    Input: raw text
    Output: The base direction of the paragraph

    @returns: a string, one of: ('R', 'L', 'N')

    The heuristic is as follows:

    - Read the first X words (use 15 for X) of the first line.
    - Use the direction of the first words as the first candidate, call it D,
      and let the other direction be T.
    - If the first line has less than X words, return D as the base.
    - Determine the ratio of T words to D words in the first X words
    - If the T direction occupies more than P% of the words (use 60 for P),
      return it as the base paragraph direction
    - Else, return D as the base paragraph direction

    Notes: 
       - An explicit unicode mark as the first character can be used to verride
       this heuristic [NOT-YET]
       - We only return N if the paragraph doesn't seem to have any real words
 */
bidiweb.par_direction = function(text)
{
    // TODO: check first character is a unicode dir character!
    var is_word = function(word) {
        return word.length > 0; // && word.match(/\w+/) 
        // wops! \w only matches ascii characters :(
    }
    var words = text.split(' ').filter(is_word);

    var dirs = words.map(bidiweb.get_word_dir);

    var func_same_direction = function(dir) { 
        return function(d) { return d == dir; }; 
    }
    var is_non_neutral_dir = function(d) { return d != 'N'; };
    var other_direction = function(dir) { return {'L':'R', 'R':'L'}[dir]; };

    // should be really the same as dirs because we already filtered out
    // things that are not words!
    var X = 10;
    var hard_dirs = dirs.filter(is_non_neutral_dir).slice(0, X);

    if (hard_dirs.length == 0) { return 'N'; }
    var candidate = hard_dirs[0];

    var DIR_COUNT_THRESHOLD = 6;
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
bidiweb.get_word_dir = function(word) {
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
    @param set_align: optional. When using the inline method, should we also
        set the text-align attribute? defaults to `true`
 */
function fix_dir(options) {
    // allow the user to just pass the container and count on the defaults
    if(typeof options === 'string'){
        options = {'container': options}
    }

    var default_options = {
        'container': '.content',
        'elements': 'h1, h2, h3, p, ul, ol, blockquote',
        'extra_elements': null,
        'rtl_class': 'rtl',
        'ltr_class': 'ltr',
        'method': 'inline',
        'set_align': true
        }

    // use default options
    for(key in default_options) {
        if (!(key in options)) options[key] = default_options[key];
    }

    function j_fix_dir_inline() {
        var e = jQuery(this); // element
        var dir = bidiweb.par_direction(e.text());
        var map = { 
            'L': { 'direction': 'ltr', 'text-align': 'left' },
            'R': { 'direction': 'rtl', 'text-align': 'right' }
            }
        e.css('direction', map[dir]['direction']);
        if(options.set_align) {
            e.css('text-align', map[dir]['text-align']);
        }
    }

    function j_fix_dir_by_class() {
        var e = jQuery(this); // element
        var dir = bidiweb.par_direction(e.text());
        var map = {'L': options.ltr_class, 'R': options.rtl_class};
        e.addClass(map[dir]);
    }

    var container = jQuery(options.container);
    var elements = jQuery(options.elements, container);
    if(options.extra_elements) {
        elements = elements.add(jQuery(extra_elements, container));
    }
    var map = {'inline': j_fix_dir_inline, 'class': j_fix_dir_by_class};
    if (!(options.method in map))
        console.log("Error: autobidi: the specified method is invalid: " + method);
    elements.each(map[options.method])
}

