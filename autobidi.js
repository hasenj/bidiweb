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
function determine_par_base_direction(text)
{
    // TODO: check first character is a unicode dir character!
    var is_word = function(word) {
        return word.length > 0; // && word.match(/\w+/) 
        // wops! \w only matches ascii characters :(
    }
    var words = text.split(' ').filter(is_word);

    var dirs = words.map(get_word_dir);

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
var get_word_dir = function(word) {
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

    @param query: jQuery query; i.e. input to jQuery(...)
    @param method: one of 'inline' or 'class' (defaults to inline)
    @param ltr_class: if you choose 'class' for the method, this is the class
        name that will be added to elements which are detected to be LTR;
        defaults to 'ltr'
    @param rtl_class: if you choose 'class' for the method, this is the class
        name that will be added to elements which are detected to be RTL;
        defaults to 'rtl'
 */
function fix_dir(query, method, ltr_class, rtl_class)
{

    function fix_dir_inline() {
        var e = $(this); // element
        var dir = determine_par_base_direction(e.text());
        if(dir == 'L') {
            e.css('direction', 'ltr').css('text-align', 'left');
        } else if (dir == 'R') {
            e.css('direction', 'rtl').css('text-align', 'right');
        }
    }
    function fix_dir_by_class(ltr_class, rtl_class) {
        ltr_class = ltr_class || 'ltr';
        rtl_class = rtl_class || 'rtl';
        var e = $(this); // element
        var dir = determine_par_base_direction(e.text());
        if(dir == 'L') {
            e.addClass(ltr_class);
        } else if (dir == 'R') {
            e.addClass(rtl_class);
        }
    }

    method = method || 'inline';
    var elements = jQuery(query);
    if(method == 'inline') {
        elements.each(fix_dir_inline);
    } else if (method == 'class') {
        elements.each(fix_dir_by_class);
    } else {
        console.log("Error: autobidi: the specified method is invalid: " + method);
    }
}
