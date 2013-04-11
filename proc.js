/**
    Hasen el Judy

    Automatically set the direction of paragraphs in RTL languages.

    The simplest way to use this module is to call:

        bidiweb.doit(query)

    Where `query` is a selector string that will be passed to
    document.querySelectorAll.  Any element maching this query will have its
    text content inspected, and the 'direction' and 'text-align' attributes
    will be set according to whether the text in this element is RTL or LTR.

    The following will fix the direction of all elements inside
    '.content'

        bidiweb.doit('.content *');

    `doit` is actually a convenience function that calls `bidiweb.process_style`,
    which is itself a convenience function that calls `bidiweb.process`.

    The `process` function takes a selection query string and a processor. A
    processor is an object that knows how to "fix" a certain element to make
    it RTL or LTR.

    The reason we have a processor object is that there are different ways of
    processing an element:

    - Setting the values for the 'direction' and 'text-align' attributes
      directly.

    - Set only the direction, but not the text-align.

      Sometimes text alignment is part of the design and not related to the
      direction of the text. It's not uncommon for English text to be
      right-aligned or for Arabic text to be left-aligned.

    - Giving the element a css class that takes care of these attributes, along
      with other attributes.

      Perhaps the direction is not the only thing you want to change for RTL
      paragraphs. Maybe you want to use a different font, or change their size
      or color, or any number of things; depending on what's required by the
      design.

    If you don't care about any of that and just want to fix the paragraphs
    inside a specific container, just call do it with '.container *'

    Does not depend on jQuery or any other library.

    Not tested on IE and not developed for it. If it works on IE, it's by accident.

    This file is licensed under the WTFPL.
*/

// namespace
bidiweb = (function(){
var module = {};

// processor interface - for documentation purposes only
IProcessor = {
    makeRtl: function(element) { },
    makeLtr: function(element) { }
}

// processor based on css classes
// @param classes: a dictionary with 2 keys: 'rtl' and 'ltr', each specifying a css class to be used
// returns: a css based processors that uses the given class names
var css_processor = function(classes) {
    return {
        makeRtl: function(element) {
            element.className += " " + classes.rtl;
        },
        makeLtr: function(element) {
            element.className += " " + classes.ltr;
        }
    }
}

// processor that changes the style inline
// @param falign: a boolean indicating whether align is to be set
// @returns: an inline processor
var style_processor = function(falign) {
    return {
        makeRtl: function(element) {
            element.style.direction = "rtl";
            if(falign) {
                element.style.textAlign = "right";
            }
        },
        makeLtr: function(element) {
            element.style.direction = "ltr";
            if(falign) {
                element.style.textAlign = "left";
            }
        }
    }
}

module.processors = {
    css: css_processor,
    style: style_processor
}

/**
    Fix the directionality of elements matching `query` using the processor `processor`.

    `query` must conform to the selector api, as we use document.selectQueryAll() instead of jQuery.

    `processor` is an object that conforms to the processor interface; namely it must provide:
        makeRtl(element)
        makeLtr(element)
 */
module.process = function (query, processor) {
    elements = document.querySelectorAll(query);
    for (var index = 0; index < elements.length; index++) {
        var element = elements.item(index);
        var text = element.textContent;
        var dir = bidi.estimateDirection(text, 0.4);
        if(dir == bidi.Dir.RTL) {
            processor.makeRtl(element);
        } else if(dir == bidi.Dir.LTR) {
            processor.makeLtr(element);
        }
    };
}

/**
    Example usage:

        bidiweb.process_css(".content *", {rtl: 'rtl', ltr: 'ltr'})
 */
module.process_css = function(query, classes) {
    var proc = module.processors.css(classes);
    module.process(query, proc);
}

/**
    Example usage:

        // fix direction attribute but not text-align attribute
        bidiweb.process_style(".headers *", false);

        // fix both direction and text-align attribute
        bidiweb.process_style(".content *", true);
 */
module.process_style = function(query, falign) {
    var proc = module.processors.style(falign);
    module.process(query, proc);
}

/**
    The simplest and most straight forward interface: just fix the given
    elements using the style processor
 */
module.doit = function(query) {
    module.process_style(query, true);
}

/**
    The second simplest way to do it: just like do it, but instead of fixing
    the style attributes, apply css classes 'rtl' or 'ltr'
 */
module.doit_css = function(query) {
    module.process_css(query, {rtl: 'rtl', ltr: 'ltr'});
}

return module;
})();
