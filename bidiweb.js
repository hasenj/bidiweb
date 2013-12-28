// bidiweb.js
// Hasen el Judy
// This file is licensed under the WTFPL.
(function(factory){
  // Support module loading scenarios
  if (typeof define === 'function' && define.amd){
    // AMD Anonymous Module
    define('bidiweb', ['bidi_helpers'], factory);
  } else {
    // No module loader (plain <script> tag) - put directly in global namespace
    window.bidiweb = factory(bidi_helpers);
  }
})(function(bidi_helpers){
/*
    Hasen el Judy

    Automatically set the direction of paragraphs in RTL languages.

    The simplest way to use this module is to call:

        bidiweb.style(query)

    Where `query` is a selector string that will be passed to
    document.querySelectorAll.  Any element maching this query will have its
    text content inspected, and the 'direction' and 'text-align' attributes
    will be set according to whether the text in this element is RTL or LTR.

    The following will fix the direction of all elements inside
    '.content'

        bidiweb.style('.content *');

    `style` is actually a convenience function that calls `bidiweb.process_style`,
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
*/

var module = {};

// processor interface - for documentation purposes only
var IProcessor = {
    makeRtl: function(element) { },
    makeLtr: function(element) { }
}

// processor based on css classes
// @param classes: a dictionary with 2 keys: 'rtl' and 'ltr', each specifying a css class to be used
// returns: a css based processors that uses the given class names
var css_processor = function(classes) {
    return {
        makeRtl: function(element) {
            element.classList.add(classes.rtl);
        },
        makeLtr: function(element) {
            element.classList.add(classes.ltr);
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

// take a node and wrap it in a NodeList like object
var nodeListMock = function(node) {
    var list = [node];
    list.item = function(i) {
        return list[i];
    }
    return list;
}

/**
    Fix the directionality of elements matching `query` using the processor `processor`.

    `query` must conform to the selector api, as we use document.selectQueryAll(), and not jQuery.

    `query` may also be a NodeList

    `query` may also be a Node

    `processor` is an object that conforms to the processor interface; namely it must provide:
        makeRtl(element)
        makeLtr(element)

    @returns the processed elements
 */
module.process = function (query, processor) {
    var elements;
    if(query instanceof NodeList) {
        elements = query;
    } else if (query instanceof Node) {
        elements = nodeListMock(query);
    } else {
        elements = document.querySelectorAll(query);
    }
    module.process_elements(elements, processor);
    return elements;
}

/**
    Lowest level core

    Fix the directionality of given elements using the processor `processor`.

    `elements` must be a NodeList
        see https://developer.mozilla.org/en-US/docs/DOM/NodeList

    `processor` is an object that conforms to the processor interface; namely it must provide:
        makeRtl(element)
        makeLtr(element)
 */
module.process_elements = function(elements, processor) {
    for (var index = 0; index < elements.length; index++) {
        var element = elements.item(index);
        // for normal elements, we get textContent
        // for form fields, we get the value, then placeholder if value is empty
        // and we put the last || "" so we never get a null or undefined
        var text = element.textContent || element.value || element.placeholder || "";
        var dir = bidi_helpers.estimateDirection(text, 0.4);
        if(dir == bidi_helpers.Dir.RTL) {
            processor.makeRtl(element);
        } else if(dir == bidi_helpers.Dir.LTR) {
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
    return module.process(query, proc);
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
    return module.process(query, proc);
}

/**
    The simplest and most straight forward interface: just fix the given
    elements using the style processor
 */
module.style = function(query) {
    return module.process_style(query, true);
}

/**
    The second simplest way to do it: just like do it, but instead of fixing
    the style attributes, apply css classes 'rtl' or 'ltr'
 */
module.css = function(query) {
    return module.process_css(query, {rtl: 'rtl', ltr: 'ltr'});
}

// helpers
/**
    Takes raw html and encapsulates it in a div

    Helper
 */
module.htmlToElement = function(html) {
    var container = document.createElement('div');
    container.innerHTML = html;
    return container
}

/**
    Process html text, i.e. when you need to process stuff before inserting it into the DOM

    Note: all actual text must be inside html tags. Any text not inside a tag will be removed.

    @returns: the html processed, with rtl/ltr tags added to elements.
 */
module.html_css = function(html) {
    var container = module.htmlToElement(html);
    var nodes = container.querySelectorAll('*');
    module.css(nodes);
    return container.innerHTML;
}

/**
    Process html text, i.e. when you need to process stuff before inserting it into the DOM

    Note: all actual text must be inside html tags. Any text not inside a tag will be removed.

    @returns: the html processed, with rtl/ltr tags added to elements.
 */
module.html_style = function(html) {
    var container = module.htmlToElement(html);
    var nodes = container.querySelectorAll('*');
    module.style(nodes);
    return container.innerHTML;
}

return module;
})
