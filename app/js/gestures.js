/**
 * A tracker for the zoom state of the main block.
 * True if the block is zoomed in and false otherwise
 *
 * @property zoomState
 * @type Boolean
 * @default false
 * @required
 */
var zoomState = false;

/**
 * A tracker for the highlight state of the side block.
 * True if the block is highlighted and false otherwise
 *
 * @property highlightState
 * @type Boolean
 * @default false
 * @required
 */
var highlightState = false;

/**
 * A tracker for the collapse state of the side block.
 * True if the block is collapsed and false otherwise
 *
 * @property collapseState
 * @type Boolean
 * @default false
 * @required
 */
var collapseState = false;

/**
 * A handle to the "Previous" button in the main block.
 *
 * @property prevButton
 * @type Object
 * @default document.getElementById("zoomPrev")
 * @required
 * @final
 */
var prevButton = document.getElementById("zoomPrev");

/**
 * A handle to the "Next" button in the main block.
 *
 * @property nextButton
 * @type Object
 * @default document.getElementById("zoomNext")
 * @required
 * @final
 */
var nextButton = document.getElementById("zoomNext");

/**
 * A handle to the main block itself.
 *
 * @property container
 * @type Object
 * @default document.querySelector("main")
 * @required
 * @final
 */
container = document.querySelector("main");

////////////////////////////////////////////////////////////////////////////////

/**
 * Mimics a mouse click on the DOM object below the cursor circle
 *
 * @class click
 * @static
 * @param {Array} [arr] An array containing x and y coordinates in the screen viewport
 */
function click(arr) {
    // Get the DOM Node below the current cursor location
    var elem = document.elementFromPoint(arr[0], arr[1]);

    // Call a click event on the node;
    if (elem !== null) {
        elem.click();
    }
}

/**
 * Performs a "pull" gesture on the DOM object below the cursor circle.
 * A pull gesture is a negative change in the z-axis made with a closed hand
 * - Pulling on the main block zooms into the item under the cursor
 * - Pulling on the side block highlights the text under the cursor and fades all others
 *
 * @class pull
 * @static
 * @param {Array} [arr] An array containing x and y coordinates in the screen viewport
 */
function pull(arr) {
    // Get the DOM Node below the current cursor location
    var elem = document.elementFromPoint(arr[0], arr[1]);

    if (jQuery.contains(container, elem)) {
        // Only do something if we're not currently zoomed in
        if (zoomState === false) {
            // Dynamically mimic a click event on the element
            // The behavior that causes the zoom is coded separately
            if (elem !== null) {
                elem.click();
            }

            // If the element the cursor is currently over is in the main block, we've
            // zoomed into an item, and zoomState is now true
            zoomState = true;
        }
    } else {
        // Only do something if we're not currently highlighted
        if (highlightState === false) {
            // Dynamically mimic a click event on the element
            // The behavior that causes the highlight is coded separately
            highlight(elem);

            // Otherwise, the cursor must be over an element in the side block, and we've
            // highlighted an item, so highlightState is now true
            highlightState = true;
        }
    }
}

/**
 * Performs a "push" gesture on the DOM object below the cursor circle.
 * A push gesture is a positive change in the z-axis made with a closed hand
 * - Pushing anywhere on the main block zooms out to the panel view
 * - Pushing anywhere on the side block un-highlights any highlighted text
 *
 * @class pull
 * @static
 * @param {Array} [arr] An array containing x and y coordinates in the screen viewport
 */
function push(arr) {
    // Get the DOM Node below the current cursor location
    var elem = document.elementFromPoint(arr[0], arr[1]);

    if (jQuery.contains(container, elem)) {
        // Only do something if we're currently zoomed in
        if (zoomState === true) {
            // Dynamically mimic a click event on the element
            // The behavior that causes the zoom is coded separately
            if (elem !== null) {
                elem.click();
            }

            // If the element the cursor is currently over is in the main block, we've
            // zoomed out of an item, and zoomState is now false
            zoomState = false;
        }
    } else {
        // Only do something if we're currently highlighted
        if (highlightState === true) {
            // Dynamically mimic a click event on the element
            // The behavior that causes the highlight is coded separately
            unHighlight();

            // Otherwise, the cursor must be over an element in the side block, and we've
            // un-highlighted an item, so highlightState is now false
            highlightState = false;
        }
    }
}

/**
 * Performs a "swipe left" gesture on the DOM object below the cursor circle.
 * A swipe left gesture is a negative change in the x-axis made with an open hand
 * - Swiping left on the main block advances to the next item if the block is currently
 *   in a zoomed state. If the block is not zoomed, swiping does nothing.
 * - Swiping left on the side block collapses the side block if the block is currently
 *   expanded. If the block is not expanded, swiping does nothing.
 *
 * @class swipeLeft
 * @static
 * @beta
 * @param {Array} [arr] An array containing x and y coordinates in the screen viewport
 */
function swipeleft(arr) {
    // Get the DOM Node below the current cursor location
    var elem = document.elementFromPoint(arr[0], arr[1]);

    if (jQuery.contains(container, elem)) {
        if (zoomState === true) {
            // Mimic a click on the button
            // FIXME: This is a very hacky method for interfacing with the Zoomoz API
            nextButton.click();
        }
    }
}

/**
 * Performs a "swipe right" gesture on the DOM object below the cursor circle.
 * A swipe left gesture is a positive change in the x-axis made with an open hand
 * - Swiping right on the main block backtracks to the previous item if the block is currently
 *   in a zoomed state. If the block is not zoomed, swiping does nothing.
 * - Swiping right on the side block expands the side block if the block is currently
 *   collapsed. If the block is not collapsed, swiping does nothing.
 *
 * @class swipeRight
 * @static
 * @beta
 * @param {Array} [arr] An array containing x and y coordinates in the screen viewport
 */
function swiperight(arr) {
    // Get the DOM Node below the current cursor location
    var elem = document.elementFromPoint(arr[0], arr[1]);

    if (jQuery.contains(container, elem)) {
        if (zoomState === true) {
            // Mimic a click on the button
            // FIXME: This is a very hacky method for interfacing with the Zoomoz API
            prevButton.click();
        }
    }
}

/**
 * Performs a "swipe up" gesture on the DOM object below the cursor circle.
 * A swipe up gesture is a positive change in the y-axis made with an open hand
 * - Swiping up on the main block scrolls downwards
 * - Swiping up on the side block highlights the next section of text under the cursor
 *
 * @class swipeUp
 * @static
 * @beta
 * @param {Array} [arr] An array containing x and y coordinates in the screen viewport
 */
function swipeUp(arr) {

}

/**
 * Performs a "swipe down" gesture on the DOM object below the cursor circle.
 * A swipe up gesture is a negative change in the y-axis made with an open hand
 * - Swiping up on the main block scrolls upwards
 * - Swiping up on the side block highlights the previous section of text under the cursor
 *
 * @class swipeDown
 * @static
 * @beta
 * @param {Array} [arr] An array containing x and y coordinates in the screen viewport
 */
function swipeDown(arr) {

}