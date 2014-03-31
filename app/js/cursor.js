// Initialize a new canvas
var c = document.getElementById("cursor"),
    ctx = c.getContext("2d");

// Set the radius of the cursor circles
var open_radius = 25,
    grab_radius = open_radius / 1.618,
    point_radius = grab_radius / 1.618;

// Set the colors for the cursor circles
var leftColor = "#d33682",
    rightColor = "#6c71c4";

// Set the width and height of the canvas to be the size of the window
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;

// Initialize the left hand cursor at the top first-third point of the screen
ctx.beginPath();
ctx.arc(0, 0, open_radius, 0, 2 * Math.PI);
ctx.fillStyle = leftColor;
ctx.fill();
ctx.closePath();

// Initialize the right hand cursor at the top second-third point of the screen
ctx.beginPath();
ctx.arc(window.innerWidth, 0, open_radius, 0, 2 * Math.PI);
ctx.fillStyle = rightColor;
ctx.fill();
ctx.closePath();

// Initialize holders for the coordinates of the cursor circles
var currlcoord = [],
    currrcoord = [];

// Initialize holders for the hand states
var currlstate = null,
    currrstate = null;

// An instance maps Kinect coordinates to Screen coordinates
// Input: Array of float x and float y coordinates of the depth data from the Kinect
// and object literal of coordinates describing the viable space
// Output: Array of Integer x and Integer y coordinates of the screen
function mapCoordinates(arr, screenw, screenh, sx, sy) {
    // Coordinates of the user's screen
    var scoord = {
        xmin: 0,
        xmax: window.innerWidth,
        ymin: 0,
        ymax: window.innerHeight
    };

    // Coordinates of the viable space. The bottom center of the viable space is
    // centered at the user's spine base
    var kcoord = {
        // The leftmost point is one arm length to the left of the spine base
        xmin: sx - screenw / 2,
        // The rightmost point is one arm length to the right of the spine base
        xmax: sx + screenw / 2,
        // The topmost point is the spine base minus the user height
        ymin: sy - screenh,
        // The bottommost point is the spine base
        ymax: sy
    };

    var xcoord = null,
        ycoord = null;

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
        xcoord = arr[0] - kcoord.xmin;
        x = xcoord / (kcoord.xmax - kcoord.xmin) * (scoord.xmax - scoord.xmin);
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
        ycoord = arr[1] - kcoord.ymin;
        y = ycoord / (kcoord.ymax - kcoord.ymin) * (scoord.ymax - scoord.ymin);
    }

    // Round the result to integer values because pixels don't have decimal places.
    return [Math.round(x), Math.round(y)];
}

// An instance updates the console on the bottom right of the screen with cursor coordinates
// Input: Array of float x and float y coordinates of the depth data from the Kinect
// Output: Unit
function updateConsole(larr, lhandState, rarr, rhandState, screenw, screenh, sx, sy) {
    // Initialize handlers for the screen coordinates in the console
    var lscreenx = document.getElementById("lscreenx"),
        lscreeny = document.getElementById("lscreeny"),
        rscreenx = document.getElementById("rscreenx"),
        rscreeny = document.getElementById("rscreeny");

    // Initialize handlers for the hand states in the console
    var lstate = document.getElementById("lhstate"),
        rstate = document.getElementById("rhstate");

    // Map the Kinect coordinates to screen coordinates
    var lcoord = mapCoordinates(larr, screenw, screenh, sx, sy),
        rcoord = mapCoordinates(rarr, screenw, screenh, sx, sy);

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
    arr.forEach(function(entry) {
        result += entry[key];
    });
    return result;
}

// An instance averages coordinate input across the specified number of frames
// Input: (1) A stack of well-formed coordinate data; (2) Number of frames to be averaged
// Output: Object literal (JSON-formatted) of coordinates
function averageFrames(coordData, k) {
    // Initialize a temporary holder for the frame data
    var holdingArr = [];

    // Pop all the required frames off the stack
    for (var i = 0; i < k; i++) {
        holdingArr[i] = coordData.pop();
    }

    var averagedData = {
        lx: sumIter(holdingArr, "lx") / k,
        ly: sumIter(holdingArr, "ly") / k,
        rx: sumIter(holdingArr, "rx") / k,
        ry: sumIter(holdingArr, "ry") / k,
        sx: sumIter(holdingArr, "sx") / k,
        sy: sumIter(holdingArr, "sy") / k
    };

    return averagedData;
}

// An instance redraws the cursor on the overlay layer
// Input: Array of float x and float y coordinates of the depth data from the Kinect
// Output: Unit
function reDraw(larr, lhandState, rarr, rhandState, screenw, screenh, sx, sy) {
    // Map the coordinates from the Kinect depth space to the screen space
    var lcoord = mapCoordinates(larr, screenw, screenh, sx, sy),
        rcoord = mapCoordinates(rarr, screenw, screenh, sx, sy);

    // Clear the canvas
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Initialize the radius of the cursor circle
    var lradius = null,
        rradius = null;

    // Get the left hand state and assign the correct cursor size
    switch (lhandState) {
        case "open":
            lradius = open_radius;
            break;
        case "closed":
            lradius = grab_radius;
            break;
        case "point":
            lradius = point_radius;
            break;
        default:
            lradius = open_radius;
            break;
    }

    // Get the right hand state and assign the correct cursor size
    switch (rhandState) {
        case "open":
            rradius = open_radius;
            break;
        case "closed":
            rradius = grab_radius;
            break;
        case "point":
            rradius = point_radius;
            break;
        default:
            rradius = open_radius;
            break;
    }

    // Draw the cursors at their new location
    // Left Hand
    if (lhandState !== "unknown") {
        ctx.beginPath();
        ctx.arc(lcoord[0], lcoord[1], lradius, 0, 2 * Math.PI);
        ctx.fillStyle = leftColor;
        ctx.fill();
        ctx.closePath();
        if (lhandState === "closed") {
            click(lcoord);
        }
    }

    // Right Hand
    if (rhandState !== "unknown") {
        ctx.beginPath();
        ctx.arc(rcoord[0], rcoord[1], rradius, 0, 2 * Math.PI);
        ctx.fillStyle = rightColor;
        ctx.fill();
        ctx.closePath();
        if (rhandState === "closed") {
            click(rcoord);
        }
    }
}

// Write placeholder variables to the console
updateConsole([0, 0], "N/A", [0, 0], "N/A", window.innerWidth, window.innerHeight, window.innerWidth / 2, window.innerHeight);