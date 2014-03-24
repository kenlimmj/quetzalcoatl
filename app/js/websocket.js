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

    console.log("Initializing connection with " + socketAddress);
    var connection = new WebSocket(socketAddress);

    connection.onopen = function() {
        // Reset the tries back to 1 since we have a new connection opened
        attempts = 1;

        console.log("Successfully established connection with server.");
        updateConsoleServer(true);

        connection.send("test");
    };

    connection.onmessage = function(event) {
        if (typeof event.data === "string") {
            console.log("Kinect data received. Interpreting...");

            // console.log("Server sent message: " + event.data);

            // 1. Parse the JSON
            var data = JSON.parse(event.data);

            console.log(data);
            // updateConsole(larr, lhandState, rarr, rhandState);
        }
    };

    connection.onclose = function() {
        console.log("Server connection lost. Retrying...");
        updateConsoleServer(false);
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
        serverstatus.innerText = "Connected";
    } else {
        serverstatus.innerText = "Disconnected";
    }
}

updateConsoleServer(false);
// createWebSocket();