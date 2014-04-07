var textContainer = document.querySelector("aside"),
    textList = document.querySelectorAll("aside li");

/**
 * Highlights a block of text in the side block. If the element passed in as input
 * is not in the side block, this function does nothing. If the element is already
 * highlighted, it remains highlighted.
 *
 * @class highlight
 * @static
 * @beta
 * @param {Object} [elem] An object corresponding to a DOM element
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
 * @class unHighlight
 * @static
 */
function unHighlight() {
    for (var i = 0; i < textList.length; i++) {
        textList[i].className = "";
    }
}