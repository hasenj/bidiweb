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

    bidiweb.doit('.container *')

If you want more flexibility with less compleity, you can call `doit_css` which will use css classes 'rtl' and 'ltr'.

    bidiweb.doit_css('.container *')

This way you get more control. You can restrict certain elements from being right-aligned via css, like this for example:

    h3.title.rtl {
        text-align: left;
    }

This should be more than enough for 99% of use cases.

### Notes

Does not depend on jQuery or any other library.

Not tested on IE and not developed for it. If it works on IE, it's by accident.

### License

bidi.js is licensed under the MIT license.

proc.js is licensed under the WTFPL.

### Building

run `./build.sh`, it will output to 'bidiweb.js' which you can include in any html page.

See example.html 