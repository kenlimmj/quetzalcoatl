var ServerInterface = (function() {
    var appName = "quetzalcoatl",
        socketAddress = "//localhost:1620/" + appName,
        connectionAttempts = 1;

    var generateInterval = function(k, maxDuration) {
        // Cap the retry interval at 30 seconds
        var maxDuration = maxDuration || 30;

        return Math.random() * Math.min((Math.pow(2, k) - 1) * 5000, maxDuration * 5000);
    }

    var ServerInterface = function(url) {
        switch (location.protocol) {
            case "https:":
                var serverAddress = url || "wss:" + socketAddress
                break;
            case "http:":
            default:
                var serverAddress = url || "ws:" + socketAddress;
                break;
        }

        try {
            var connection = new WebSocket(serverAddress);
        } catch (err) {
            console.log(err);
        }

        if (connection) {
            connection.onopen = function() {
                // Reset the attempt count on successful connection
                connectionAttempts = 1;

                var app = new AppInterface(),
                    kinect = new KinectInterface(app);

                window.app = app;
                window.kinect = kinect;
            }

            connection.onmessage = function(packet) {
                if (typeof(packet.data === 'string') {
                    var data = JSON.parse(packet.data);

                    var activeUser = new UserInterface(app, kinect, data.activeUser.name),
                        activeUserCursor = new CursorInterface(app, kinect, activeUser);
                });
            }

            connection.onclose = function() {
                // If the connection fails, retry with exponential backoff
                var time = generateInterval(connectionAttempts);

                setTimeout(function() {
                    connectionAttempts++;

                    Server.init(serverAddress);
                }, time);
            }

            return connection;
        }
    }

    return ServerInterface;
})(ServerInterface || {});
