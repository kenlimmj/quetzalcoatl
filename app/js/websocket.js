// Set to true to emit verbose output to the console
var debug = true;

// Initialize a stack to hold data from all previous frames
var coordData = [];

if (debug === false) {
    // Initialize a handler for the console element
    var consoleelem = document.getElementById("console");

    // Hide the console if console output is not requested
    consoleelem.style.display = "none";
}

// Set the socket address to match the port which the C# WebSocket Server is broadcasting on
var socketAddress = "ws://localhost:1620/KinectApp";

// Implements the Exponential Backoff Algorithm to spread out reconnection attempts
// so we don't flood the server with too many requests in the event that we go offline
//
// ALGORITHM SCHEMA:
// 1. For k attempts, generate a random interval of time between 0 and 2^k - 1.
// 2. If we are able to reconnect, reset k to 1
// 3. If reconnection fails, k increases by 1 and the process restarts at step 1.
// 4. To truncate the max interval, when a certain number of attempts k has
//    been reached, k stops increasing after each attempt.
//
// Input: Unit
// Output: Unit
function createWebSocket() {
    var attempts = 1;

    if (debug === true) {
        console.log("Initializing connection with " + socketAddress);
    }
    var connection = new WebSocket(socketAddress);

    // First-run logic when the connection to the server is initialized
    connection.onopen = function() {
        // Reset the tries back to 1 since we have a new connection opened
        attempts = 1;

        if (debug === true) {
            console.log("Successfully established connection with server.");
            updateConsoleServer(true);
        }
    };

    // Logic when a message is received from the server
    connection.onmessage = function(event) {
        if (typeof event.data === "string") {
            if (debug === true) {
                console.log("Data of type STRING received from server. Interpreting...");
            }

            // Parse the JSON
            var data = JSON.parse(event.data);

            // Push the new frame onto the stack
            coordData.push(data);

            var averagedData = averageFrames(coordData, Math.min(coordData.length, 3));

            if (debug === true) {
                console.log(data);
                updateConsole([averagedData.lx, averagedData.ly],
                    data.lhandState, [averagedData.rx, averagedData.ry],
                    data.rhandState,
                    data.screenw,
                    data.screenh,
                    averagedData.sx,
                    averagedData.sy);
            }

            // Draw the cursor on the screen
            // Here we're using the frame-averaged data for the hand coordinates and viewport
            // The hand states utilize the current frame data
            reDraw([averagedData.lx, averagedData.ly],
                data.lhandState, [averagedData.rx, averagedData.ry],
                data.rhandState,
                data.screenw,
                data.screenh,
                averagedData.sx,
                averagedData.sy);

            // Store the current data for use in the next round
            prevData = data;
        }
    };

    connection.onclose = function() {
        if (debug === true) {
            console.log("Server connection lost. Retrying...");
            updateConsoleServer(false);
        }

        var time = generateInterval(attempts);

        setTimeout(function() {
            // We've tried to reconnect so increment the attempt counter
            attempts++;

            // Connection has closed so try to reconnect every 10 seconds
            createWebSocket();
        }, time);
    };
}

// An instance generates an back-off interval for making server connections
// Input: Integer of attempts made at connection
// Output: Float of back-off interval (in microseconds)
function generateInterval(k) {
    var maxInterval = (Math.pow(2, k) - 1) * 1000;

    // If the generated interval is more than 30 seconds, truncate it down to 30 seconds
    if (maxInterval > 30 * 1000) {
        maxInterval = 30 * 1000;
    }

    // Generate the interval as a random number between 0 and the maxInterval determined from above
    return Math.random() * maxInterval;
}

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

// Set the initial state of the server to "Disconnected"
updateConsoleServer(false);

// Start the web socket connection
createWebSocket();