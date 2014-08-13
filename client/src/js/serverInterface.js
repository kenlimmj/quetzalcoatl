var ServerInterface = (function() {
    "use strict";

    var defaultSocketAddress = "localhost",
        defaultSocketPort = 1620,
        connectionAttempts = 1;

    var generateInterval = function(k, maxDuration) {
        // Cap the retry interval at 1 seconds
        var maxDuration = maxDuration || 1;

        return Math.random() * Math.min((Math.pow(2, k) - 1) * 5000, maxDuration * 5000);
    }

    var ServerInterface = function(appName, socketAddress, socketPort) {
        var appName = appName || Util.generateUUID(),
            socketAddress = socketAddress || defaultSocketAddress,
            socketPort = socketPort || defaultSocketPort;

        // Choose the connection protocol depending on
        // the current level of page security
        switch (location.protocol) {
            case "https:":
                var protocol = "wss";
                break;
            case "http:":
            default:
                var protocol = "ws";
                break;
        }

        // Concatenate variables together to form the server address
        var serverAddress = protocol + "://" + socketAddress + ":" + socketPort + "/" + appName;

        // Attempt a connection, and print the stack trace if the connection fails
        var initConnection = function() {
            try {
                var connection = new WebSocket(serverAddress);
            } catch (err) {
                console.error(err);
            }

            if (connection) {
                connection.onopen = function() {
                    // Reset the attempt count on successful connection
                    connectionAttempts = 1;

                    var app = new AppInterface(window.innerWidth, window.innerHeight, function() {
                        app.hideLockScreen();
                    }),
                        kinect = new KinectInterface(app);

                    // Inject the interfaces into the global namespace
                    window.app = app;
                    window.kinect = kinect;
                }

                connection.onmessage = function(packet) {
                    if (typeof(packet.data === 'string')) {
                        var data = JSON.parse(packet.data);

                        var activeUser = new UserInterface(app, kinect, data.activeUser.name),
                            activeUserCursor = new CursorInterface(app, kinect, activeUser);
                    }
                }

                connection.onclose = function() {
                    if (window.app) {
                        app.showLockScreen();
                    }

                    // If the connection fails, retry with exponential backoff
                    var time = generateInterval(connectionAttempts);

                    setTimeout(function() {
                        connectionAttempts++;

                        initConnection();
                    }, time);
                }
            }
        }

        initConnection();
    }

    return ServerInterface;
})(ServerInterface || {});
