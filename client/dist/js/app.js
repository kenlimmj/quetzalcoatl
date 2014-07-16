var nav = (function() {
    // Declare flags
    var debug = false,
        engaged = false;

    // Declare drawing variables
    var navOverlayName = "kinectNavOverlay",
        kinectViewportName = "Kinect Viewport",
        userViewportName = "User Viewport",
        appViewportName = "App Viewport",
        strokeWidth = 1.618,
        strokeFill = "#444",
        circleFill = "#444",
        circleRadius = 8.09,
        textFill = "#444",
        textSize = 14,
        labelOffset = 5,
        labelAlignment = "right";

    // Declare objects, dimensions and parameters
    var kinectSensor = {
        width: 512,
        height: 424
    },
        app = {
            width: window.innerWidth,
            height: window.innerHeight
        },
        user = {
            spineBase: {
                x: null,
                y: null
            },
            viewport: {
                xMin: null,
                xMax: null,
                yMin: null,
                yMax: null,
                width: null,
                height: null
            }
        };

    return {
        init: function() {
            // Check if the nav element has already been inserted into the
            if (!document.getElementById(this.navOverlayName)) {
                // Create and insert a overlay HTML node
                var navElement = document.createElement("div");
                navElement.setAttribute("id", this.navOverlayName);

                // Set styles on the overlay
                navElement.style.position = "absolute";
                navElement.style.top = 0;
                navElement.style.left = 0;

                navElement.style.width = "100%";
                navElement.style.height = "100%";

                navElement.style.pointerEvents = "none";
                navElement.style.zIndex = 999;

                // Insert the overlay at the top of the body
                document.body.insertBefore(navElement, document.body.firstChild);
            } else {
                var navElement = document.getElementById(this.navOverlayName);
            }

            debugger;

            // Draw a canvas in the nav overlay
            this.overlay = new Kinetic.Stage({
                container: navOverlayName,
                width: navElement.offsetWidth,
                height: navElement.offsetHeight
            });

            if (this.debug) {
                this.userViewportLayer = new Kinetic.Layer();
                this.kinectViewportLayer = new Kinetic.Layer();
                this.appViewportLayer = new Kinetic.Layer();
            }
        },
        setAppViewport: function(width, height) {
            var width = width || window.innerWidth,
                height = height || window.innerHeight;

            this.app.width = width;
            this.app.height = height;

            return this.app;
        },
        setKinectViewport: function(width, height) {
            var width = width || 512,
                height = height || 424;

            this.kinectSensor.width = width;
            this.kinectSensor.height = height;

            return this.kinectSensor;
        },
        setUserViewport: function(width, height) {
            var width = width || this.kinectSensor.width,
                height = height || this.kinectSensor.height;

            this.user.viewport.width = width;
            this.user.viewport.height = height;

            this.user.viewport.xMin = this.user.spineBase.x - width / 2;
            this.user.viewport.xMax = this.user.spineBase.x + width / 2;
            this.user.viewport.yMin = this.user.spineBase.y - height;
            this.user.viewport.yMax = this.user.spineBase.y;

            return this.user.viewport;
        },
        setUserSpineBase: function(x, y) {
            var x = x || this.kinectSensor.width / 2,
                y = y || 0;

            this.user.spineBase.x = x;
            this.user.spineBase.y = y;

            return this.user.spineBase;
        },
        drawKinectViewport: function() {
            // Draw a bounding box representing the size of the Kinect viewport
            this.kinectViewport = new Kinetic.Rect({
                x: this.app.width / 2 - this.kinectSensor.width / 2,
                y: this.app.height / 2 - this.kinectSensor.height / 2,
                width: this.kinectSensor.width,
                height: this.kinectSensor.height,
                stroke: strokeFill,
                strokeWidth: strokeWidth
            });

            // Draw a text label beneath the bounding box
            this.kinectViewportLabel = new Kinetic.Text({
                x: this.app.width / 2 - this.kinectSensor.width / 2,
                y: this.app.height / 2 + this.kinectSensor.height / 2 + labelOffset,
                width: this.kinectSensor.width,
                align: labelAlignment,
                text: kinectViewportName + "\n" + this.kinectSensor.width + "x" + this.kinectSensor.height,
                fontSize: textSize,
                fill: textFill
            });

            // Add the bounding box and label to the layer
            this.kinectViewportLayer
                .add(this.kinectViewport)
                .add(this.kinectViewportLabel);

            // Add the layer to the canvas
            this.overlay
                .add(this.kinectViewportLayer);

            return this.kinectViewportLayer;
        },
        drawUserViewport: function() {
            // Draw a bounding box representing the size of the user's viewport
            this.userViewport = new Kinetic.Rect({
                x: this.user.spineBase.x - this.user.viewport.width / 2 + this.kinectViewport.getX(),
                y: this.user.spineBase.y - this.user.viewport.height + this.kinectViewport.getY(),
                width: this.user.viewport.width,
                height: this.user.viewport.height,
                stroke: strokeFill,
                strokeWidth: strokeWidth
            });

            // Draw a circle representing the spine base location in the user's viewport
            this.userSpineBase = new Kinetic.Circle({
                x: this.user.spineBase.x + this.kinectViewport.getX(),
                y: this.user.spineBase.y + this.kinectViewport.getY(),
                radius: circleRadius,
                fill: circleFill
            });

            // Draw a line between the spine base location in the user's viewport
            // and the spine location in the app viewport
            this.userSpineConnector = new Kinetic.Line({
                points: [this.userSpineBase.getX(), this.userSpineBase.getY(), this.appSpineBase.getX(), this.appSpineBase.getY()],
                stroke: strokeFill,
                strokeWidth: strokeWidth,
                lineJoin: "round",
                dash: [10, 5]
            });

            // Draw a text label beneath the bounding box
            this.userViewportLabel = new Kinetic.Text({
                x: this.user.spineBase.x - this.user.viewport.width / 2 + this.kinectViewport.getX(),
                y: this.user.spineBase.y + this.kinectViewport.getY() + 5,
                width: this.user.viewport.width,
                align: labelAlignment,
                text: userViewportName + this.user.viewport.width + "x" + this.user.viewport.height,
                fontSize: textSize,
                fill: textFill
            });

            // Add the bounding box, spine point, connecting line and label to the layer
            this.userViewportLayer
                .add(this.userViewport)
                .add(this.userSpineBase)
                .add(this.userSpineConnector)
                .add(this.userViewportLabel);

            // Add the layer to the canvas
            this.overlay
                .add(this.userViewportLayer);

            return this.userViewportLayer;
        },
        updateUserViewport: function() {
            // Update the location of the user's viewport
            this.userViewport.setX(this.user.spineBase.x - this.user.viewport.width / 2 + this.kinectViewport.getX());
            this.userViewport.setY(this.user.spineBase.y - this.user.viewport.height + this.kinectViewport.getY());
            this.userViewport.setWidth(this.user.viewport.width);
            this.userViewport.setHeight(this.user.viewport.height);

            // Update the location of the user's spine base
            this.userSpineBase.setX(this.user.spineBase.x + this.kinectViewport.getX());
            this.userSpineBase.setY(this.user.spineBase.y + this.kinectViewport.getY());

            // Update the line connecting the spine base to the bottom of the screen
            this.userSpineConnector.setPoints([this.userSpineBase.getX(), this.userSpineBase.getY(), this.appSpineBase.getX(), this.appSpineBase.getY()]);

            // Update the label
            this.userViewportLabel.setX(this.user.spineBase.x - this.user.viewport.width / 2 + nav.kinectViewport.getX());
            this.userViewportLabel.setY(this.user.spineBase.y + this.kinectViewport.getY() + 5);
            this.userViewportLabel.setWidth(nav.uWidth);
            this.userViewportLabel.setText(userViewportName + "\n" + this.user.viewport.width + "x" + this.user.viewport.height);

            // Draw everything at one go
            this.userViewportLayer.batchDraw();

            return this.userViewportLayer;
        },
        drawAppViewport: function() {
            // Draw a circle representing the spine base location in the app's viewport
            this.appSpineBase = new Kinetic.Circle({
                x: this.app.width / 2,
                y: this.app.height,
                radius: circleRadius * 1.618,
                fill: circleFill
            });

            // Draw a text label on the bottom-right of the bounding box
            this.appViewportLabel = new Kinetic.Text({
                x: 0,
                y: this.app.height - 30,
                width: this.app.width - 10,
                align: labelAlignment,
                text: appViewportName + "\n" + this.app.width + "x" + this.app.height,
                fontSize: textSize,
                fill: textFill
            });

            // Add the spine circle and viewport label to the layer
            this.appViewportLayer
                .add(this.appSpineBase)
                .add(this.appViewportLabel);

            // Add the layer to the canvas
            this.overlay
                .add(this.appViewportLayer);
        }
    }
})();
