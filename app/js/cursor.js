/**
 * Provides the cursor class. The cursor is displayed on-screen as a pair of circles
 *
 * @class cursor
 */

/**
 * A handle to the canvas element that draws the cursor
 *
 * @property c
 * @type Object
 * @default document.getElementById("cursor")
 * @final
 */
var c = document.getElementById("cursor");
var ctx = c.getContext("2d");

/**
 * The radius of the cursor circle when the hand is in an "open" state
 *
 * @property open_radius
 * @type Number
 * @default 25
 * @final
 */
var open_radius = 25;

/**
 * The radius of the cursor circle when the hand is in a "closed" state.
 *
 * @property grab_radius
 * @type Number
 * @default 15.45
 * @final
 */
var grab_radius = open_radius / 1.618;

/**
 * The radius of the cursor circle when the hand is in a "pointing/lasso" state.
 *
 * @property point_radius
 * @type Number
 * @default 9.55
 * @final
 */
var point_radius = grab_radius / 1.618;


/**
 * The color of the left hand cursor circle. This color is taken from the
 * 5-color palette from the Solarized color scheme.
 *
 * @property leftColor
 * @type String
 * @default "#d33682"
 * @final
 */
var leftColor = "#d33682";

/**
 * The color of the right hand cursor circle. This color is taken from the
 * 5-color palette from the Solarized color scheme.
 *
 * @property rightColor
 * @type String
 * @default "#6c71c4"
 * @final
 */
var rightColor = "#6c71c4";

/**
 * The dimensions of the user's screen, which we call the screen viewport.
 *
 * @property scoord
 * @type Object
 * @final
 */
var scoord = {
    xmin: 0,
    xmax: window.innerWidth,
    ymin: 0,
    ymax: window.innerHeight
};

// Set the width and height of the canvas to be the size of the window
ctx.canvas.width = scoord.xmax - scoord.xmin;
ctx.canvas.height = scoord.ymax - scoord.ymin;

/**
 * Rounds a number such that it is a multiple of the provided number. This function
 * comes in handy for stabilizing cursor jitter (by rounding the mapped coordinates).
 *
 * @method stabilizer
 * @static
 * @param {Number} x A number to be rounded.
 * @param {Number} factor A number which represents a multiple to which x will be rounded.
 * @return {Number} A rounded number.
 *
 * @example
 *      stabilizer(92,6) = 96
 */
function stabilizer(x, factor) {
    return x - (x % factor) + (x % factor > 0 && factor);
}

/**
 * Maps a pair of coordinates from the Kinect's viewport to the screen viewport.
 * This function first creates the user's viewport via the following method:
 * 1. A box is defined using the user viewport width and height. This data comes
 *    from the Kinect, which calculates the width as the distance from the midpoint
 *    of the left elbow-wrist joint to the the midpoint of the right elbow-wrist joint.
 *    The height is the distance from the top of the head to the spine base.
 * 2. As a result of (1), the user viewport is created around the user, centered
 *    at the user's spine base. When the user's spine base moves, the user viewport moves.
 * Next, the function looks at the coordinates of the hand in the Kinect viewport and
 * does one of two things:
 * 1. If the coordinates are within the user viewport, it does a straightforward linear
 * mapping from the user's viewport to the screen viewport.
 * 2. If the coordinates are outside the user viewport, it maps the
 *
 * @method mapCoordinates
 * @static
 * @param {Array} arr A set of coordinates (x,y) in the Kinect viewport
 * @param {Array} screenarr A tuple (width,height) of the width and height of the user viewport
 * @param {Array} spinearr A set of coordinates (x,y) of the user's spine base in the Kinect viewport
 * @param {Number} threshold A value to which the final coordinates are rounded.
 * This value can be obtained from ```cursorThreshold```
 * @return {Array} A set of coordinates (x,y) in the user viewport
 *
 * @example
 *      mapCoordinates([300,300],[250,250],[400,300],1/100) = [154, 808]
 */
// An instance maps Kinect coordinates to Screen coordinates
// Input: Array of float x and float y coordinates of the depth data from the Kinect
// and object literal of coordinates describing the user viewport
// Output: Array of Integer x and Integer y coordinates of the screen viewport
function mapCoordinates(arr, screenarr, spinearr, threshold) {
    // Coordinates of the user viewport. The bottom center of the user viewport is
    // centered at the user's spine base
    var kcoord = {
        // The leftmost point is one arm length to the left of the spine base
        xmin: spinearr[0] - screenarr[0] / 2,
        // The rightmost point is one arm length to the right of the spine base
        xmax: spinearr[0] + screenarr[0] / 2,
        // The topmost point is the spine base minus the user height
        ymin: spinearr[1] - screenarr[1],
        // The bottommost point is the spine base
        ymax: spinearr[1]
    };

    var x = null,
        y = null;

    // Calculate the coordinate space for the incoming x-coordinate
    if (arr[0] < kcoord.xmin) {
        // If the hand is too far to the left, clip to the left edge of the screen
        x = 0;
    } else if (arr[0] > kcoord.xmax) {
        // If the hand is too far to the right, clip to the right edge of the screen
        x = window.innerWidth;
    } else {
        // Otherwise, translate it so it fits within the viable space
        x = (arr[0] - kcoord.xmin) / (kcoord.xmax - kcoord.xmin) * (scoord.xmax - scoord.xmin);
    }

    // Calculate the coordinate space for the incoming y-coordinate
    if (arr[1] < kcoord.ymin) {
        // If the hand is too high up, clip it to the top edge of the screen
        y = 0;
    } else if (arr[1] > kcoord.ymax) {
        // If the hand is too low down, clip it to the bottom edge of the screen
        y = window.innerHeight;
    } else {
        // Otherwise, translate it so it fits within the viable space
        y = (arr[1] - kcoord.ymin) / (kcoord.ymax - kcoord.ymin) * (scoord.ymax - scoord.ymin);
    }

    // Threshold the result to minimize jitter
    var xcoord = stabilizer(x, Math.round(threshold * window.innerWidth)),
        ycoord = stabilizer(y, Math.round(threshold * window.innerHeight));

    return [xcoord, ycoord];
}

// An instance updates the console on the bottom right of the screen with cursor coordinates
// Input: Array of float x and float y mapped coordinates
// Output: Unit
function updateConsole(lcoord, lhandState, rcoord, rhandState) {
    // Initialize handlers for the screen coordinates in the console
    var lscreenx = document.getElementById("lscreenx"),
        lscreeny = document.getElementById("lscreeny"),
        rscreenx = document.getElementById("rscreenx"),
        rscreeny = document.getElementById("rscreeny");

    // Initialize handlers for the hand states in the console
    var lstate = document.getElementById("lhstate"),
        rstate = document.getElementById("rhstate");

    // Write the screen coordinates
    lscreenx.innerText = lcoord[0] + "/" + window.innerWidth;
    lscreeny.innerText = lcoord[1] + "/" + window.innerHeight;

    rscreenx.innerText = rcoord[0] + "/" + window.innerWidth;
    rscreeny.innerText = rcoord[1] + "/" + window.innerHeight;

    // Write the hand states
    lstate.innerText = lhandState;
    rstate.innerText = rhandState;
}

// An instance sums the values corresponding to object keys in an array of objects
// Precondition: Assumes the value at each key is a number (integer/float)
// Input: (1) Array of object literals; (2) Valid key referenced in object literal
// Output: Sum of values
function sumIter(arr, key) {
    var result = 0;

    // Go through every element in the array and add its value to the result
    arr.forEach(function(entry) {
        result += entry[key];
    });

    return result;
}

// An instance counts the number of occurrences of each hand state and returns the
// state with the highest frequency of occurrence
// Precondition: Assumes that the value at the key provided is a valid hand state
// Input: (1) Array of object literals; (2) Valid key referenced in object literal
// Output: Hand state
function selectState(arr, key) {
    // Initialize counters for each hand state
    var openCount = 0,
        closedCount = 0,
        pointCount = 0,
        unknownCount = 0;

    // Go through the list and count the number of occurrences of each hand state
    arr.forEach(function(entry) {
        switch (entry[key]) {
            case "open":
                openCount++;
                break;
            case "closed":
                closedCount++;
                break;
            case "point":
                pointCount++;
                break;
            case "unknown":
                unknownCount++;
                break;
            default:
                break;
        }
    });

    // Return the state with the highest occurrence
    if (openCount > closedCount && openCount > pointCount && openCount > unknownCount) {
        return "open";
    } else if (closedCount > pointCount && closedCount > unknownCount) {
        return "closed";
    } else if (pointCount > unknownCount) {
        return "point";
    } else {
        return "unknown";
    }
}

// An instance looks up a precision threshold value for the hand state
function cursorThreshold(state) {
    if (state === "point") {
        return 1 / 100;
    } else {
        return 1 / 100;
    }
}

// An instance averages coordinate input across the specified number of frames
// If more frames are requested than available, we use all available frames in the stack
// Input: (1) A stack of well-formed coordinate data; (2) Number of frames to be averaged
// Output: Object literal (JSON-formatted) of coordinates
function averageFrames(coordData, k) {
    // Initialize a temporary holder for the frame data
    var holdingArr = [];

    // Initialize temporary holders for the left and right hand states
    var avglhandstate = null,
        avgrhandstate = null;

    // Use all available frames in the stack if more frames are requested than available
    k = Math.min(coordData.length, k);

    // Pop all the required frames off the stack
    for (var i = 0; i < k; i++) {
        holdingArr[i] = coordData[coordData.length - i - 1];
    }

    // If the current left hand state is unknown, average the states and return the result
    // Otherwise, return the hand state from the most recent frame
    if (coordData[coordData.length - 1].lhandState === "unknown") {
        avglhandstate = selectState(holdingArr, "lhandState");
    } else {
        avglhandstate = coordData[coordData.length - 1].lhandState;
    }

    // If the current right hand state is unknown, average the states and return the result
    // Otherwise, return the hand state from the most recent frame
    if (coordData[coordData.length - 1].rhandState === "unknown") {
        avgrhandstate = selectState(holdingArr, "rhandState");
    } else {
        avgrhandstate = coordData[coordData.length - 1].rhandState;
    }

    var averagedData = {
        lx: sumIter(holdingArr, "lx") / k,
        ly: sumIter(holdingArr, "ly") / k,
        rx: sumIter(holdingArr, "rx") / k,
        ry: sumIter(holdingArr, "ry") / k,
        sx: sumIter(holdingArr, "sx") / k,
        sy: sumIter(holdingArr, "sy") / k,
        lhandState: avglhandstate,
        rhandState: avgrhandstate
    };

    return averagedData;
}

// An instance assigns the appropriate radius depending on the hand state
// Input: A valid hand state
// Output: A float radius value
function assignRadius(state) {
    switch (state) {
        case "open":
            return open_radius;
        case "closed":
            return grab_radius;
        case "point":
            return point_radius;
        default:
            return open_radius;
    }
}

// An instance redraws the cursor on the overlay layer
// Input: Array of float x and float y mapped coordinates
// Output: Unit
function reDraw(lcoord, lhandState, rcoord, rhandState) {
    // Initialize the radius of the cursor circle
    var lradius = assignRadius(lhandState),
        rradius = assignRadius(rhandState);

    // Clear the entire canvas
    // TODO: Only clear the part of the canvas that contains the old cursor circles
    // In addition, only do it on a per-hand basis, rather than for both circles
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Draw the cursors at their new location
    // Left Hand
    // if (lhandState !== "unknown") {
    ctx.beginPath();
    ctx.arc(lcoord[0], lcoord[1], lradius, 0, 2 * Math.PI);
    ctx.fillStyle = leftColor;
    ctx.fill();
    ctx.closePath();
    // }

    // Right Hand
    // if (rhandState !== "unknown") {
    ctx.beginPath();
    ctx.arc(rcoord[0], rcoord[1], rradius, 0, 2 * Math.PI);
    ctx.fillStyle = rightColor;
    ctx.fill();
    ctx.closePath();
    // }
}

// Write placeholder variables to the console
updateConsole([0, 0], "N/A", [0, 0], "N/A", window.innerWidth, window.innerHeight, window.innerWidth / 2, window.innerHeight);
