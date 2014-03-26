// Initialize a new canvas
var c = document.getElementById("cursor"),
    ctx = c.getContext("2d");

// Set the radius of the cursor circles
var open_radius = 25;
var grab_radius = open_radius / 1.618;
var point_radius = grab_radius / 1.618;

// Set the width and height of the canvas to be the size of the window
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;

// Initialize the left hand cursor at the top first-third point of the screen
ctx.beginPath();
ctx.arc(window.innerWidth / 3, 0, open_radius, 0, 2 * Math.PI);
ctx.fillStyle = "#dc322f";
ctx.fill();
ctx.closePath();

// Initialize the right hand cursor at the top second-third point of the screen
ctx.beginPath();
ctx.arc(2 / 3 * window.innerWidth, 0, open_radius, 0, 2 * Math.PI);
ctx.fillStyle = "#268bd2";
ctx.fill();
ctx.closePath();

// An instance sets up the mapping from the Kinect space to the Screen space
// Input: Array of float x and float y coordinates of the depth data from the Kinect
// corresponding to a start frame, and a string describing whether the hand is
// "left" or "right"
// Output: ?
function setMapping(arr, parity) {
    if (parity === "left") {

    } else {

    }
}

// An instance maps Kinect coordinates to Screen coordinates
// Input: Array of float x and float y coordinates of the depth data from the Kinect
// Output: Array of float x and float y coordinates of the screen
function mapCoordinates(arr) {
    // Coordinates of the user's screen
    var scoord = {
        xmax: window.innerWidth,
        xmin: 0,
        ymax: window.innerHeight,
        ymin: 0
    };

    // Coordinates of the Kinect depth data
    // This information comes from the Kinect V2 Specifications
    var kcoord = {
        xmax: 512,
        xmin: 0,
        ymax: 424,
        ymin: 0
    };

    // Scale the input coordinates to the size of the user's screen
    var x = arr[0] / (kcoord.xmax - kcoord.xmin) * (scoord.xmax - scoord.xmin),
        y = arr[1] / (kcoord.xmax - kcoord.xmin) * (scoord.xmax - scoord.xmin);

    return [x, y];
}

// An instance updates the console on the bottom right of the screen with cursor coordinates
// Input: Array of float x and float y coordinates of the depth data from the Kinect
// Output: Unit
function updateConsole(larr, lhandState, rarr, rhandState) {
    // Initialize handlers for the screen coordinates in the console
    var lscreenx = document.getElementById("lscreenx"),
        lscreeny = document.getElementById("lscreeny"),
        rscreenx = document.getElementById("rscreenx"),
        rscreeny = document.getElementById("rscreeny");

    // Initialize handlers for the kinect coordinates in the console
    // var lkinectx = document.getElementById("lkinectx"),
    //     lkinecty = document.getElementById("lkinecty"),
    //     rkinectx = document.getElementById("rkinectx"),
    //     rkinecty = document.getElementById("rkinecty");

    // Initialize handlers for the hand states in the console
    var lstate = document.getElementById("lhstate"),
        rstate = document.getElementById("rhstate");

    // Write the Kinect coordinates
    // lkinectx.innerText = larr[0] + "/512";
    // lkinecty.innerText = larr[1] + "/424";

    // rkinectx.innerText = rarr[0] + "/512";
    // rkinecty.innerText = rarr[1] + "/424";

    // Map the Kinect coordinates to screen coordinates
    var lcoord = mapCoordinates(larr),
        rcoord = mapCoordinates(rarr);

    // Write the screen coordinates
    lscreenx.innerText = Math.round(lcoord[0]) + "/" + window.innerWidth;
    lscreeny.innerText = Math.round(lcoord[1]) + "/" + window.innerHeight;

    rscreenx.innerText = Math.round(rcoord[0]) + "/" + window.innerWidth;
    rscreeny.innerText = Math.round(rcoord[1]) + "/" + window.innerHeight;

    // Write the hand states
    lstate.innerText = lhandState;
    rstate.innerText = rhandState;
}

// An instance redraws the cursor on the overlay layer
// Input: Array of float x and float y coordinates of the depth data from the Kinect
// Output: Unit
function reDraw(larr, lhandState, rarr, rhandState) {
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

    // Map the coordinates from the Kinect depth space to the screen space
    var lcoord = mapCoordinates(larr),
        rcoord = mapCoordinates(rarr);

    // Draw the cursors at their new location
    ctx.beginPath();
    // Left Hand
    ctx.arc(lcoord[0], lcoord[1], lradius, 0, 2 * Math.PI);
    ctx.fillStyle = "#dc322f";
    ctx.fill();
    // Right Hand
    ctx.arc(rcoord[0], rcoord[1], rradius, 0, 2 * Math.PI);
    ctx.fillStyle = "#268bd2";
    ctx.fill();
}

// An instance mimics a click on the object below the cursor circle
// Input: Array of float x and float y coordinates of the mapped screen coordinates
function click(arr) {
    // Get the DOM Node below the current cursor location
    var elem = document.elementFromPoint(arr[0], arr[1]);

    // Call a click event on the node;
    elem.click();
}

updateConsole([0, 0], "open", [0, 0], "open");