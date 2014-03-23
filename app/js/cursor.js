// Initialize a new canvas
var c = document.getElementById("cursor"),
    ctx = c.getContext("2d");

// Set the radius of the
var open_radius = 25;
var grab_radius = 15.451174289;
var point_radius = 9.549551477;

// Set the width and height of the canvas to be the size of the window
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;

// Set the opacity of the cursor layer to 0.5
ctx.globalAlpha = 0.5;

// Initialize the left and right cursor circles on the screen
ctx.beginPath();
// Left Hand: Top left of the screen
ctx.arc(0, 0, open_radius, 0, 2 * Math.PI);
ctx.fillStyle = "#dc322f";
ctx.fill();
// Right Hand: Top right of the screen
ctx.arc(window.innerWidth, 0, open_radius, 0, 2 * Math.PI);
ctx.fillStyle = "#268bd2";
ctx.fill();

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
    var lscreenx = document.getElementById("lscreenx"),
        lscreeny = document.getElementById("lscreeny"),
        rscreenx = document.getElementById("rscreenx"),
        rscreeny = document.getElementById("rscreeny");

    var lkinectx = document.getElementById("lkinectx"),
        lkinecty = document.getElementById("lkinecty"),
        rkinectx = document.getElementById("rkinectx"),
        rkinecty = document.getElementById("rkinecty");

    var lstate = document.getElementById("lhstate"),
        rstate = document.getElementById("rhstate");

    lkinectx.innerText = larr[0] + "/512";
    lkinecty.innerText = larr[1] + "/424";

    rkinectx.innerText = rarr[0] + "/512";
    rkinecty.innerText = rarr[1] + "/424";

    var lcoord = mapCoordinates(larr),
        rcoord = mapCoordinates(rarr);

    lscreenx.innerText = lcoord[0] + "/" + window.innerWidth;
    lscreeny.innerText = lcoord[1] + "/" + window.innerHeight;

    rscreenx.innerText = rcoord[0] + "/" + window.innerWidth;
    rscreeny.innerText = rcoord[1] + "/" + window.innerHeight;

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

updateConsole([0, 0], "open", [0, 0], "open");