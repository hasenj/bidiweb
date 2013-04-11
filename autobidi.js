/**
    (c) 2011 Hasen el Judy
    bidiweb is freedly distributed under the MIT license

    Basic usage:
    Call `bidiweb.process(element)` to automatically detect RTL
    paragraphs/segments inside element and apply `direction:rtl` to them.
    `element` can be anything that is passed to `jQuery()`
*/

if (typeof console === 'undefined') {
  console = { 'log': function() {} };
}
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
            element.className += classes.rtl;
        },
        makeLtr: function(element) {
            element.className += classes.ltr;
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

return module;
})();
