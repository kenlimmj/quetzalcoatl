/**
 * Provides the text class. The text block is located on the left-hand side of
 * the UI, and displays texts, lists, quotes, code, or equations that annotate
 * content in the main block. This class contains helper functions for manipulating
 * the text content in various ways.
 *
 * @class text
 */

/**
 * A handle to the text block.
 *
 * @property textContainer
 * @type Object
 * @default document.querySelector("aside")
 * @final
 */
var textContainer = document.querySelector("aside");

/**
 * A handle to the items in the text block.
 *
 * @property textList
 * @type Object
 * @default document.querySelector("aside li")
 * @final
 */
var textList = document.querySelectorAll("aside li");

/**
 * Highlights a block of text in the side block. If the element passed in as input
 * is not in the side block, this function does nothing. If the element is already
 * highlighted, it remains highlighted.
 *
 * @method highlight
 * @static
 * @beta
 * @param {Object} elem An object corresponding to a DOM element
 */
function highlight(elem) {
    // Only do something if the element is in the text block
    if (jQuery.contains(textContainer, elem)) {
        // Go through every item in the text block and:
        // 1. Highlight the desired item
        // 2. Fade everything else
        for (var i = 0; i < textList.length; i++) {
            if (textList[i] === elem) {
                textList[i].className = "text--active";
            } else {
                textList[i].className = "text--inactive";
            }
        }
    }
}

/**
 * Removes highlights from all blocks of text in the side block. If nothing is
 * currently highlighted, this function does nothing.
 *
 * @method unHighlight
 * @static
 */
function unHighlight() {
    for (var i = 0; i < textList.length; i++) {
        textList[i].className = "";
    }
}
