var KinectInterface = (function() {
    "use strict";

    var depthSensorHeight = 484,
        depthSensorWidth = 512,
        labelAlignment = "left",
        sensorBoundingBoxName = "Kinect Viewport",
        strokeFill = "#444",
        strokeWidth = 1.618,
        textFamily = "Source Sans Pro",
        textFill = "#444",
        textSize = 0.825 * window.innerWidth / 100;

    var KinectInterface = function(appInterface, width, height) {
        var _ = this;

        // Set the width and height of the Kinect depth sensor default
        // unless arguments were passed to the constructor
        _.viewport = {
            width: width || depthSensorWidth,
            height: height || depthSensorHeight
        }

        if (Util.supportsImports()) {
            var overlayLink = Util.insertImportLink('kinectSensorOverlay');

            // Defer all actions until the template import finishes
            overlayLink.onload = function() {
                if (document.getElementsByTagName('kinect-sensor-overlay').length === 0) {
                    var overlayTemplate = Util.registerTemplate('kinect-sensor-overlay', 'kinectSensorOverlay'),
                        kinectSensorOverlay = new overlayTemplate();

                    document.body.insertBefore(kinectSensorOverlay, document.getElementById('kinectAppOverlay'));
                } else {
                    var kinectSensorOverlay = document.getElementsByTagName('kinect-sensor-overlay')[0];
                }

                kinectSensorOverlay.id = 'kinectSensorOverlay';

                _.overlay = new Kinetic.Stage({
                    container: 'sensor-overlay',
                    width: window.innerWidth,
                    height: window.innerHeight
                });

                var sensorViewportLayer = new Kinetic.Layer();
                sensorViewportLayer.canvas.pixelRatio = window.devicePixelRatio;

                var sensorBoundingBox = new Kinetic.Rect({
                    x: appInterface.getWidth() / 2 - _.viewport.width / 2,
                    y: appInterface.getHeight() / 2 - _.viewport.height / 2,
                    width: _.viewport.width,
                    height: _.viewport.height,
                    stroke: strokeFill,
                    strokeWidth: strokeWidth
                });

                _.sensorBoundingBox = sensorBoundingBox;

                var sensorBoundingBoxLabel = new Kinetic.Text({
                    x: appInterface.getWidth() / 2 - _.viewport.width / 2,
                    y: appInterface.getHeight() / 2 + _.viewport.height / 2 + 0.5 * window.innerWidth / 100,
                    align: labelAlignment,
                    text: sensorBoundingBoxName + "\n" + "x: " + _.viewport.width + "\n" + "y: " + _.viewport.height,
                    fontSize: textSize,
                    fontFamily: textFamily,
                    fill: textFill
                });

                sensorViewportLayer.add(sensorBoundingBox, sensorBoundingBoxLabel);
                _.overlay.add(sensorViewportLayer);

                Object.observe(appInterface.viewport, function(changes) {
                    changes.forEach(function(change) {
                        sensorBoundingBox.setAbsolutePosition({
                            x: change.object.width / 2 - _.viewport.width / 2,
                            y: change.object.height / 2 - _.viewport.height / 2
                        });

                        sensorBoundingBoxLabel.setAbsolutePosition({
                            x: change.object.width / 2 - _.viewport.width / 2,
                            y: change.object.height / 2 + _.viewport.height / 2 + 0.5 * window.innerWidth / 100
                        });

                        sensorViewportLayer.batchDraw();
                    });
                });

                Object.observe(_.viewport, function(changes) {
                    changes.forEach(function(change) {
                        sensorBoundingBox.setAbsolutePosition({
                          x: appInterface.getWidth() / 2 - change.object.width / 2,
                          y: appInterface.getHeight() / 2 - change.object.height / 2
                        });

                        sensorBoundingBox.setSize({ width: change.object.width, height: change.object.height });

                        sensorBoundingBoxLabel.setAbsolutePosition({
                          x: appInterface.getWidth() / 2 - change.object.width / 2,
                          y: appInterface.getHeight() / 2 + change.object.height / 2 + 0.375 * window.innerWidth / 100
                        });

                        sensorBoundingBoxLabel.text(sensorBoundingBoxName + "\n" + "x: " + change.object.width + "\n" + "y: " + change.object.height);

                        sensorViewportLayer.batchDraw();
                    });
                });
            }
        }
    };

    KinectInterface.prototype = {
        setWidth: function(width) {
            var width = width || depthSensorWidth;

            this.viewport.width = width;

            return this.overlay;
        },
        setHeight: function(height) {
            var height = height || depthSensorHeight;

            this.viewport.height = height;

            return this.overlay;
        },
        getWidth: function() {
            return this.viewport.width;
        },
        getHeight: function() {
            return this.viewport.height;
        },
        showViewport: function() {
            $('#kinectSensorOverlay').velocity({
                opacity: 1
            }, {
                display: "block"
            });
        },
        hideViewport: function() {
            $('#kinectSensorOverlay').velocity({
                opacity: 0
            }, {
                display: "none"
            });
        }
    };

    return KinectInterface;
})(KinectInterface || {});

// FIXME: Temporary initialization code for testing
var kinect = new KinectInterface(foo);
