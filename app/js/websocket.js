/**
 * The main backbone of the Quetzalcoatl front-end. This code must be used in
 * conjunction with the WebSocket server interfacing with the Kinect for Windows
 * API found at /server, and the Kinect for Windows V2.
 *
 * @module quetzalcoatl
 * @author Lim Mingjie, Kenneth
 * @author Leart Albert Ulaj
 * @requires jQuery, HTML5 WebSocket API, HTML5 Canvas
 */

/**
 * Provides the websocket class. Data coming from the Kinect is received by
 * listening on a WebSocket server running either locally or at an exposed address.
 * This class provides core functions for connecting to and disconnecting from
 * the server, as well as helper methods for parsing incoming data.
 *
 * @class websocket
 */

/**
 * A toggle to switch the program to debugging mode.
 * True if debug mode is on and false otherwise.
 *
 * @property debug
 * @type Boolean
 * @default false
 */
var debug = true;

/**
 * An array-backed stack that holds all previous frame data
 *
 * @property coordData
 * @type Array
 */
var coordData = [];

/**
 * A tracker for the current status of a pull gesture on the left hand
 * True if we are in the middle of a pull gesture, and false otherwise.
 *
 * @property lpullState
 * @type Boolean
 * @default false
 */
var lpullState = false;

/**
 * A tracker for the current status of a pull gesture on the right hand
 * True if we are in the middle of a pull gesture, and false otherwise.
 *
 * @property rpullState
 * @type Boolean
 * @default false
 */
var rpullState = false;

/**
 * A tracker for the current status of a push gesture on the left hand
 * True if we are in the middle of a push gesture, and false otherwise.
 *
 * @property lpushState
 * @type Boolean
 * @default false
 */
var lpushState = false;

/**
 * A tracker for the current status of a push gesture on the right hand
 * True if we are in the middle of a push gesture, and false otherwise.
 *
 * @property rpushState
 * @type Boolean
 * @default false
 */
var rpushState = false;

/**
 * The address which the Kinect server is broadcasting on.
 *
 * @property socketAddress
 * @type String
 * @default ws://localhost:1620/KinectApp
 * @final
 */
var socketAddress = "ws://localhost:1620/KinectApp";

if (debug === false) {
    // Initialize a handler for the console element
    var consoleelem = document.getElementById("console");

    // Hide the console since console output is not requested
    consoleelem.style.display = "none";
} else {
    // Set the initial state of the server to "Disconnected"
    updateConsoleServer(false);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Starts or stops a WebSocket connection to the Kinect server, and handles incoming data.
 * This function implements the [Exponential Backoff](http://en.wikipedia.org/wiki/Exponential_backoff)
 * Algorithm to spread out reconnection attempts so we don't flood the server with too many
 * requests in the event that we go offline.
 *
 * ALGORITHM SCHEMA:
 * 1. For k attempts, generate a random interval of time between 0 and 2^k - 1.
 * 2. If we are able to reconnect, reset k to 1
 * 3. If reconnection fails, k increases by 1 and the process restarts at step 1.
 * 4. To truncate the max interval, when a certain number of attempts k has
 *    been reached, k stops increasing after each attempt.
 *
 * @method createWebSocket
 * @static
 */
function createWebSocket() {
    var attempts = 1;

    if (debug === true) {
        console.log("Initializing connection with " + socketAddress);
        document.getElementById("serverstatus").innerText = "Initializing";
    }

    var connection = new WebSocket(socketAddress);

    /**
     * Fired when a new connection to the server is opened
     *
     * @event onopen
     */
    connection.onopen = function() {
        // Reset the tries back to 1 since we have a new connection opened
        attempts = 1;

        if (debug === true) {
            console.log("Successfully established connection with server.");
            updateConsoleServer(true);
        }
    };

    /**
     * Fired when a new message is received from the server
     *
     * @event onmessage
     */
    connection.onmessage = function(event) {
        if (typeof event.data === "string") {
            // Parse the JSON
            var data = JSON.parse(event.data);

            // Push the new frame onto the stack
            coordData.push(data);

            // Average the data over a pair of frames for increased accuracy
            // FIXME: Dynamically change the framerate depending on what the user is doing
            var averagedData = averageFrames(coordData, 2);

            // Calculate the precision threshold value for each hand
            var lthreshold = cursorThreshold(averagedData.lhandState),
                rthreshold = cursorThreshold(averagedData.rhandState);

            // Map the coordinates from the Kinect space to screen space
            var lcoord = mapCoordinates([averagedData.lx, averagedData.ly], [data.screenw, data.screenh], [data.sx, data.sy], lthreshold),
                rcoord = mapCoordinates([averagedData.rx, averagedData.ry], [data.screenw, data.screenh], [data.sx, data.sy], rthreshold);

            if (debug === true) {
                // Update the output on the screen console
                updateConsole(lcoord, data.lhandState, rcoord, data.rhandState);
            }

            // FIXME: Temporary code to enable the pull gestures. Will eventually be
            // abstracted to something more robust
            if (lpullState === false) {
                if (data.lpull === true) {
                    pull(lcoord);
                    lpullState = true;
                }
            } else {
                if (data.lpull === false) {
                    lpullState = false;
                }
            }

            if (rpullState === false) {
                if (data.rpull === true) {
                    pull(rcoord);
                    rpullState = true;
                }
            } else {
                if (data.rpull === false) {
                    rpullState = false;
                }
            }

            if (lpushState === false) {
                if (data.lpush === true) {
                    push(lcoord);
                    lpushState = true;
                }
            } else {
                if (data.lpush === false) {
                    lpushState = false;
                }
            }

            if (rpushState === false) {
                if (data.rpush === true) {
                    push(rcoord);
                    rpushState = true;
                }
            } else {
                if (data.rpush === false) {
                    rpushState = false;
                }
            }

            // Draw the cursor on the screen
            // Only redraw if there are no pull gestures being executed on-screen
            // if (lpullState === false && rpullState === false && lpushState === false && rpushState === false) {
            reDraw(lcoord, averagedData.lhandState, rcoord, averagedData.rhandState);
            // }
        }
    };

    /**
     * Fired when the connection to the server is closed
     *
     * @event onclose
     */
    connection.onclose = function() {
        var time = generateInterval(attempts);

        if (debug === true) {
            console.log("Server connection lost. Retrying in " + time);
            updateConsoleServer(false);
        }

        setTimeout(function() {
            // We've tried to reconnect so increment the attempt counter
            attempts++;

            // Connection has closed so try to reconnect every 10 seconds
            createWebSocket();
        }, time);
    };
}

/**
 * Generates a back-off interval for making server connections.
 *
 * @method generateInterval
 * @static
 * @param {Number} k Number of connection attempts.
 * @return {Number} Back-off interval duration (in micro-seconds).
 */
function generateInterval(k) {
    var maxInterval = (Math.pow(2, k) - 1) * 5000;

    // If the generated interval is more than 30 seconds, truncate it down to 30 seconds
    if (maxInterval > 30 * 5000) {
        maxInterval = 30 * 5000;
    }

    // Generate the interval as a random number between 0 and the maxInterval determined from above
    return Math.random() * maxInterval;
}

/**
 * Updates the on-screen console with the connection status
 *
 * @method updateConsoleServer
 * @static
 * @param {String} state The connection state of the front-end to the server (Connected|Disconneted).
 */
// An instance updates the console on the bottom right of the screen with the server status
// Input: Boolean of server state (connected: true | closed: false)
// Output: Unit
function updateConsoleServer(state) {
    var serverstatus = document.getElementById("serverstatus");
    if (state === true) {
        // If the server is connected, display "Connected" in green
        serverstatus.innerText = "Connected";
        serverstatus.style.color = "#859900";
    } else {
        // If the server is disconnected, display "Disconnected" in red
        serverstatus.innerText = "Disconnected";
        serverstatus.style.color = "#dc322f";
    }
}

/**
 * Averages incoming frame data across the specified number of frames. If more frames
 * than requested are available, averaging will be performed over all available frames
 * in the stack. The hand state that is returned will be that of the most recent frame,
 * unless the current hand state is unknown, in which case the most commonly occurring
 * hand state across the averaged frames will be returned.
 *
 * @method averageFrames
 * @static
 * @param {Object} coordData A stack of frames
 * @param {Number} k The number of frames to be averaged over
 *
 * @return {Object} An object literal representing a frame
 */
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

// Starts the websocket server when Shift + C is pressed
Mousetrap.bind('shift+c', function() {
    createWebSocket();
});
