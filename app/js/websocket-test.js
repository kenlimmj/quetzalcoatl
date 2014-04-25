var ws = {
    debug: false,

    socketAddress: "ws://localhost:1620/KinectApp",
    connectionAttempts: 1,
    frameData: [],

    init: function() {
        try {
            var connection = new WebSocket(this.socketAddress);
        } catch (err) {
            console.log(err);
        }

        connection.onopen = function() {
            // Reset the tries back to 1 since we have a new connection opened
            ws.connectionAttempts = 1;

            // Initialize the navigation overlay
            nav.init();

            if (debug === true) {
                nav.drawKinectView();
                nav.drawScreenView();
                nav.drawUserView();
            }

            // Draw the cursor reticules on the overlay
            cursor.init();

            // Initialize gesture detection
            gesture.init();
        }

        connection.onmessage = function(packet) {
            if (typeof(packet.data) === "string") {
                // Parse the JSON
                var data = JSON.parse(packet.data);

                // Push the new frame onto the stack (for reference)
                ws.frameData.push(data);

                // Update the location of the user's spine base
                nav.setUserSpineBase(data.sx, data.sy);

                // Update the dimensions of the user viewport
                nav.setUserView(data.screenw, data.screenh);

                if (debug === true) {
                    // Update the user view
                    nav.updateUserView();
                }

                // Update the left-hand data and draw it
                cursor.setLeftHand(data.lx, data.ly);
                gesture.setLeftHand(data.lhandState);

                // Update the right-hand data and draw it
                cursor.setRightHand(data.rx, data.ry);
                gesture.setRightHand(data.rhandState);

                // Pass control to the gesture detection state machine
                gesture.process();
            }
        }

        connection.onclose = function() {
            var time = ws.generateInterval(ws.connectionAttempts);

            setTimeout(function() {
                // We've tried to reconnect so increment the attempt counter
                ws.connectionAttempts++;

                // Connection has closed so try to reconnect every 10 seconds
                ws.init();
            }, time);
        }
    },

    generateInterval: function(k) {
        var maxInterval = (Math.pow(2, k) - 1) * 5000;

        // If the generated interval is more than 30 seconds, truncate it down to 30 seconds
        if (maxInterval > 30 * 5000) {
            maxInterval = 30 * 5000;
        }

        // Generate the interval as a random number between 0 and the maxInterval determined from above
        return Math.random() * maxInterval;
    }
}

// Start the server when Shift + C is pressed
Mousetrap.bind('shift+c', function() {
    ws.init();
});
