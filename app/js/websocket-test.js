var ws = {
    socketAddress: "ws://localhost:1620/KinectApp",
    connectionAttempts: 1,
    frameData: [],
    debug: false,

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
            nav.drawKinectView();
            nav.drawScreenView();
            nav.drawUserView();

            // FIXME: Testing code. To be deleted
            // nav.setUserSpineBase(nav.uSpineX, nav.uSpineY);
            // nav.setUserView(nav.uWidth, nav.uHeight);

            // Draw the cursor reticules on the overlay
            cursor.init();
        }

        connection.onmessage = function(packet) {
            if (typeof(packet.data) === string) {
                // Parse the JSON
                var data = JSON.parse(packet.data);

                // Push the new frame onto the stack (for reference)
                ws.frameData.push(data);

                // Update the location of the user's spine base
                nav.setUserSpineBase(data.sx, data.sy);

                // Update the dimensions of the user viewport
                nav.setUserView(data.screenw, data.screenh);

                // Update the left-hand location
                cursor.setLeftCursor(data.lx, data.ly);

                // Update the right-hand location
                cursor.setRightCursor(data.rx, data.ry);

                cursor.update("left");

                cursor.update("right");

                // Pass control to the gesture detection state machine

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
