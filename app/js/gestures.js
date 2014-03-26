// Initialize a boolean to keep track of the zoom state of the main block
// True if the block is zoomed in, and false otherwise
var zoomState = false;

// Initialize a boolean to keep track of the highlight state of the side block
// True if text is highlighted, and false otherwise
var highlightState = false;

// Initialize a boolean to keep track of the collapse state of the side block
// True if the block is collapsed, and false otherwise
var collapseState = false;

// Get the DOM Node for the main block
container = document.querySelector("main");

////////////////////////////////////////////////////////////////////////////////

// An instance calls a pull gesture on the canvas
// A pull gesture is a negative change in the z-axis made with a closed hand
// - Pulling on the main block zooms into the item under the cursor
// - Pulling on the side block highlights the text under the cursor and fades all other
// Input: Array of float x and float y coordinates of the mapped screen coordinates
function pull(arr) {
    // Get the DOM Node below the current cursor location
    var elem = document.elementFromPoint(arr[0], arr[1]);

    if (jQuery.contains(container, elem)) {
        // Only do something if we're not currently zoomed in
        if (zoomState === false) {
            // Dynamically mimic a click event on the element
            // The behavior that causes the zoom/highlight is coded separately
            elem.click();

            // If the element the cursor is currently over is in the main block, we've
            // zoomed into an item, and zoomState is now true
            zoomState = true;
        }
    } else {
        // Only do something if we're not currently highlighted
        if (highlightState === false) {
            // Dynamically mimic a click event on the element
            // The behavior that causes the zoom/highlight is coded separately
            elem.click();

            // Otherwise, the cursor must be over an element in the side block, and we've
            // highlighted an item, so highlightState is now true
            highlightState = true;
        }
    }
}

// An instance calls a push gesture on the canvas
// A push gesture is a positive change in the z-axis made with a closed hand
// - Pushing anywhere on the main block zooms out to the panel view
// - Pushing anywhere on the side block un-highlights any highlighted text
// Input: Array of float x and float y coordinates of the mapped screen coordinates
function push(arr) {

}

// An instance calls a swipe left gesture on the canvas
// A swipe left gesture is a negative change in the x-axis made with a closed hand
// - Swiping left on the main block advances to the next item if the block is currently
//   in a zoomed state. If the block is not zoomed, swiping does nothing.
// - Swiping left on the side block collapses the side block if the block is currently
//   expanded. If the block is not expanded, swiping does nothing.
// Input: Array of float x and float y coordinates of the mapped screen coordinates
function swipeleft(arr) {
    // Get the DOM Node below the current cursor location
    var elem = document.elementFromPoint(arr[0], arr[1]);

    if (jQuery.contains(container, elem)) {
        if (zoomState === true) {
            // Initialize a handler to the "Previous" button
            var elem = document.getElementById("zoomNext");

            // Mimic a click on the button
            // FIXME: This is a very hacky method for interfacing with the Zoomoz API
            elem.click();
        }
    } else {
        // Expand the side block
    }
}

// An instance calls a swipe right gesture on the canvas
// A swipe right gesture is a positive change in the x-axis made with a closed hand
// - Swiping right on the main block backtracks to the previous item if the block is currently
//   in a zoomed state. If the block is not zoomed, swiping does nothing.
// - Swiping right on the side block expands the side block if the block is currently
//   collapsed. If the block is not collapsed, swiping does nothing.
// Input: Array of float x and float y coordinates of the mapped screen coordinates
function swiperight(arr) {
    // Get the DOM Node below the current cursor location
    var elem = document.elementFromPoint(arr[0], arr[1]);

    if (jQuery.contains(container, elem)) {
        if (zoomState === true) {
            // Initialize a handler to the "Next" button
            var elem = document.getElementById("zoomPrev");

            // Mimic a click on the button
            // FIXME: This is a very hacky method for interfacing with the Zoomoz API
            elem.click();
        }
    } else {
        // Collapse the side block
    }
}

// An instance calls a swipe up gesture on the canvas
// A swipe up gesture is a positive change in the y-axis made with a closed hand
// - Swiping up on the side block highlights the next section of text under the cursor
// Input: Array of float x and float y coordinates of the mapped screen coordinates
function swipeUp(arr) {

}

// An instance calls a swipe down gesture on the canvas
// A swipe down gesture is a negative change in the y-axis made with a closed hand
// - Swiping down on the side block highlights the previous section of text under the cursor
// Input: Array of float x and float y coordinates of the mapped screen coordinates
function swipeDown(arr) {

}