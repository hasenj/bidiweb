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

    bidiweb.style('.container *')

If you want more flexibility with less complexity, you can call `css` which will use css classes 'rtl' and 'ltr'.

    bidiweb.css('.container *')

This way you get more control. You can restrict certain elements from being right-aligned via css, like this for example:

    h3.title.rtl {
        text-align: left;
    }

This should be more than enough for 99% of use cases.

### Processing the content of a specific node

It should be noted that `bidiweb.style`, `bidiweb.css`, and `bidiweb.process` also accept a node list as an argument instead of a query.

A node list is what you get when you call `DOMNode.querySelectorAll('.content *')`.

You can also pass in a single node directly. This is useful for automatically adjusting the directionality of form elements. For example, you can listen to 'input' events on an `input` or `textarea` elements and call `bidiweb.style(field)` as a response to changing user input. This will cause the input element to automatically adjust it's directionality based on its content (value actually).

### Direct html-text processing

Sometimes it's handy to be able to fix the direction of elements in a plain-text html string. The most obvious use-case for this is processing the html string generated by a markdown parser. You could in theory render the resulting string to the DOM and then call the css or style function on the inserted node afterwards. This however creates a suboptimal user experience, where the element appears LTR for a split second before turning to RTL.

A much better user experience would be to process the resulting html *before* inserting it to the DOM.

To achieve this effect, you can use `bidiweb.html_css` and `bidiweb.html_style`, which take as input an html-string, and return a string reprsenting the processed html.

Here's a function that uses Pagedown.js to sanitize and parse markdown, then uses bidiweb to automatically adjust RTL sections:

    /**
        Parse markdown with a sanitizer and a bidi processor
     */
    markdown2html = function(text) {
        var converter = Markdown.getSanitizingConverter();
        var html = converter.makeHtml(text);
        return bidiweb.html_css(html);
    }

Note that this function returns a string, not DOM nodes.

### Notes

* Supports AMD via requirejs (optional)
* Does not depend on jQuery or any other library.
* Not tested on IE and not developed for it. If it works on IE, it's by accident.

### License

bidi_helpers.js is licensed under the Apache license.
bidiweb.js is licensed under the WTFPL.

### Usage

See example.html

Include "bidiweb.build.js"

#### For AMD/requirejs:

require bidiweb, and make sure bidi_helpers is available (bidiweb will require it).
