var UserInterface = (function() {
    "use strict";

    var circleFill = "#444",
        circleRadius = window.innerWidth / 100,
        labelAlignment = "left",
        strokeFill = "#444",
        strokeWidth = 1.618,
        textFamily = "Source Sans Pro",
        textFill = "#444",
        textSize = 0.75 * window.innerWidth / 100,
        userViewportWidth = 350,
        userViewportHeight = 250;

    var UserInterface = function(appInterface, kinectInterface, name, width, height, spineBaseX, spineBaseY) {
        var _ = this,
            name = name || "Unknown User";

        _.viewport = {
            width: width || 0.75 * kinectInterface.viewport.width,
            height: height || 0.75 * kinectInterface.viewport.height
        }

        _.spineBase = {
            x: spineBaseX || _.viewport.width / 2,
            y: spineBaseY || _.viewport.height
        }

        if (Util.supportsImports()) {
            var overlayLink = Util.insertImportLink('kinectUserOverlay');

            overlayLink.onload = function() {
                if (document.getElementsByTagName('kinect-user-overlay').length === 0) {
                    var overlayTemplate = Util.registerTemplate('kinect-user-overlay', 'kinectUserOverlay'),
                        kinectUserOverlay = new overlayTemplate();

                    document.body.insertBefore(kinectUserOverlay, document.getElementById('kinectSensorOverlay'));
                } else {
                    var kinectUserOverlay = document.getElementsByTagName('kinect-user-overlay')[0];
                }

                kinectUserOverlay.id = 'kinectUserOverlay';

                _.overlay = new Kinetic.Stage({
                    container: 'user-overlay',
                    width: window.innerWidth,
                    height: window.innerHeight
                });

                var userViewportLayer = new Kinetic.Layer();
                userViewportLayer.canvas.pixelRatio = window.devicePixelRatio;

                var userBoundingBox = new Kinetic.Rect({
                    x: _.spineBase.x - _.viewport.width / 2 + kinectInterface.sensorBoundingBox.getX(),
                    y: _.spineBase.y - _.viewport.height + kinectInterface.sensorBoundingBox.getY(),
                    width: _.viewport.width,
                    height: _.viewport.height,
                    stroke: strokeFill,
                    strokeWidth: strokeWidth
                });

                var userBoundingBoxLabel = new Kinetic.Text({
                    x: _.spineBase.x - _.viewport.width / 2 + kinectInterface.sensorBoundingBox.getX(),
                    y: _.spineBase.y + kinectInterface.sensorBoundingBox.getY() + 0.25 * window.innerWidth / 100,
                    align: labelAlignment,
                    text: name + "'s Viewport" + "\n" + "x: " + _.viewport.width + "\n" + "y: " + _.viewport.height,
                    fontSize: textSize,
                    fontFamily: textFamily,
                    fill: textFill,
                });

                var userSpineBase = new Kinetic.Circle({
                    x: _.spineBase.x + kinectInterface.sensorBoundingBox.getX(),
                    y: _.spineBase.y + kinectInterface.sensorBoundingBox.getY(),
                    radius: circleRadius,
                    fill: circleFill
                });

                var userSpineConnector = new Kinetic.Line({
                    points: [userSpineBase.getX(), userSpineBase.getY(), appInterface.appSpineBase.getX(), appInterface.appSpineBase.getY()],
                    stroke: strokeFill,
                    strokeWidth: strokeWidth,
                    lineJoin: "round",
                    dash: [10, 5]
                });

                userViewportLayer.add(userBoundingBox, userBoundingBoxLabel, userSpineBase, userSpineConnector);
                _.overlay.add(userViewportLayer);

                Object.observe(kinectInterface.sensorBoundingBox.attrs, function(changes) {
                    changes.forEach(function(change) {
                        userBoundingBox.setAbsolutePosition({
                            x: _.spineBase.x - _.viewport.width / 2 + change.object.x,
                            y: _.spineBase.y - _.viewport.height + change.object.y
                        });

                        userBoundingBoxLabel.setAbsolutePosition({
                            x: _.spineBase.x - _.viewport.width / 2 + change.object.x,
                            y: _.spineBase.y + change.object.y + 0.25 * window.innerWidth / 100
                        });

                        userViewportLayer.batchDraw();
                    });
                });

                Object.observe(_.spineBase, function(changes) {
                    changes.forEach(function(change) {
                        userBoundingBox.setAbsolutePosition({
                            x: change.object.x - _.viewport.width / 2 + kinectInterface.sensorBoundingBox.getX(),
                            y: change.object.y - _.viewport.height + kinectInterface.sensorBoundingBox.getY()
                        });

                        userBoundingBoxLabel.setAbsolutePosition({
                            x: change.object.x - _.viewport.width / 2 + kinectInterface.sensorBoundingBox.getX(),
                            y: change.object.y + kinectInterface.sensorBoundingBox.getY() + 0.25 * window.innerWidth / 100
                        });

                        userSpineBase.setAbsolutePosition({
                            x: change.object.x + kinectInterface.sensorBoundingBox.getX(),
                            y: change.object.y + kinectInterface.sensorBoundingBox.getY()
                        });

                        userSpineConnector.setPoints([userSpineBase.getX(), userSpineBase.getY(), appInterface.appSpineBase.getX(), appInterface.appSpineBase.getY()]);

                        userViewportLayer.batchDraw();
                    });
                });

                Object.observe(_.viewport, function(changes) {
                    changes.forEach(function(change) {
                        userBoundingBox.setAbsolutePosition({
                            x: _.spineBase.x - change.object.width / 2 + kinectInterface.sensorBoundingBox.getX(),
                            y: _.spineBase.y - change.object.height + kinectInterface.sensorBoundingBox.getY()
                        });

                        userBoundingBox.setSize({
                          width: change.object.width,
                          height: change.object.height
                        });

                        userBoundingBoxLabel.setAbsolutePosition({
                            x: _.spineBase.x - change.object.width / 2 + kinectInterface.sensorBoundingBox.getX(),
                            y: _.spineBase.y + kinectInterface.sensorBoundingBox.getY() + 0.25 * window.innerWidth / 100
                        });

                        userBoundingBoxLabel.text(name + "'s Viewport" + "\n" + "x: " + change.object.width + "\n" + "y: " + change.object.height);

                        userViewportLayer.batchDraw();
                    });
                });

                Object.observe(appInterface.viewport, function(changes) {
                    changes.forEach(function(change) {
                        userSpineBase.setAbsolutePosition({
                          x: _.spineBase.x + kinectInterface.sensorBoundingBox.getX(),
                          y: _.spineBase.y + kinectInterface.sensorBoundingBox.getY()
                        });

                        userSpineConnector.setPoints([userSpineBase.getX(), userSpineBase.getY(), appInterface.appSpineBase.getX(), appInterface.appSpineBase.getY()]);

                        userViewportLayer.batchDraw();
                    });
                });
            }
        }
    };

    UserInterface.prototype = {
        setWidth: function(width) {
            this.viewport.width = width;

            return this.overlay;
        },
        setHeight: function(height) {
            this.viewport.height = height;

            return this.overlay;
        },
        getWidth: function() {
            return this.viewport.width;
        },
        getHeight: function() {
            return this.viewport.height;
        },
        setSpineBase: function(x, y) {
            this.spineBase.x = x;
            this.spineBase.y = y;

            return this.spineBase;
        },
        getSpineBase: function() {
            return this.spineBase;
        },
        showViewport: function() {
            $('#kinectUserOverlay').velocity({
                opacity: 1
            }, {
                display: "block"
            });
        },
        hideViewport: function() {
            $('#kinectUserOverlay').velocity({
                opacity: 0
            }, {
                display: "none"
            });
        }
    }

    return UserInterface;
})(UserInterface || {});

var user = new UserInterface(foo, kinect);
