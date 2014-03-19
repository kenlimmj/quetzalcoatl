// Initialize a new canvas
var c = document.getElementById("cursor"),
    ctx = c.getContext("2d");

// Set the radius of the
var open_radius = 25;
// var grab_radius = 10;
// var point_radius = 5;

// Set the width and height of the canvas to be the size of the window
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;

// Set the opacity of the cursor layer to 0.5
ctx.globalAlpha = 0.5;

// Draw the cursor circle on the screen
ctx.beginPath();
ctx.arc(0, 0, open_radius, 0, 2 * Math.PI);
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
function updateConsole(arr) {
    var screenx = document.getElementById("screenx"),
        screeny = document.getElementById("screeny");

    var kinectx = document.getElementById("kinectx"),
        kinecty = document.getElementById("kinecty");

    kinectx.innerText = arr[0] + "/512";
    kinecty.innerText = arr[1] + "/424";

    var coord = mapCoordinates(arr);

    screenx.innerText = coord[0] + "/" + window.innerWidth;
    screeny.innerText = coord[1] + "/" + window.innerHeight;
}

updateConsole([0, 0]);