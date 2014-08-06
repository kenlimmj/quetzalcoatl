var AppInterface = (function() {
    "use strict";

    var appViewportName = "Application Viewport",
        circleFill = "#444",
        circleRadius = 2 * window.innerWidth / 100,
        labelAlignment = "left",
        textFill = "#444",
        textSize = window.innerWidth / 100,
        textFamily = "Source Sans Pro";

    var AppInterface = function(width, height) {
        var _ = this;

        // Set the width and height of the app to that of the window
        // unless arguments were passed to the constructor
        _.viewport = {
            width: width || window.innerWidth,
            height: height || window.innerHeight
        }

        // Only proceed if the browser supports HTML imports
        if (Util.supportsImports()) {
            // Schedule async imports
            var lockScreenLink = Util.insertImportLink('kinectLockScreen'),
                overlayLink = Util.insertImportLink('kinectAppOverlay');

            // Defer all actions until the template import finishes
            lockScreenLink.onload = function() {
                // Insert the lock screen only if it doesn't already exist
                if (document.getElementsByTagName('kinect-lockscreen').length === 0) {
                    // Register the web components in the DOM
                    var overlayTemplate = Util.registerTemplate('kinect-lockscreen', 'kinectLockScreen'),
                        kinectLockScreen = new overlayTemplate();

                    document.body.insertBefore(kinectLockScreen, document.body.firstChild);
                } else {
                    var kinectLockScreen = document.getElementsByTagName('kinect-lockscreen')[0];
                }

                // Set an id on the element so it's easy to retrieve later
                kinectLockScreen.id = 'kinectLockScreen';
            }

            // Defer all actions until the template import finishes
            overlayLink.onload = function() {
                // Insert the control overlay only if it doesn't already exist
                if (document.getElementsByTagName('kinect-app-overlay').length === 0) {
                    var overlayTemplate = Util.registerTemplate('kinect-app-overlay', 'kinectAppOverlay'),
                        kinectAppOverlay = new overlayTemplate();

                    document.body.insertBefore(kinectAppOverlay, document.getElementsByTagName('kinect-lockscreen')[0].nextSibling);
                } else {
                    var kinectAppOverlay = document.getElementsByTagName('kinect-app-overlay')[0];
                }

                // Set an id on the element so it's easy to retrieve later
                kinectAppOverlay.id = 'kinectAppOverlay';

                // Draw a canvas stage in the interface overlay
                _.overlay = new Kinetic.Stage({
                    container: 'app-overlay',
                    width: _.viewport.width,
                    height: _.viewport.height
                });

                var appViewportLayer = new Kinetic.Layer();
                // FIXME: Manually set the device ratio so the canvas looks sharp
                // on retina devices. This can be removed once the auto-detection
                // bug in Kinetic JS is fixed
                appViewportLayer.canvas.pixelRatio = window.devicePixelRatio;

                // Draw a circle representing the spine base location in the app's viewport
                var appSpineBase = new Kinetic.Circle({
                    x: _.viewport.width / 2,
                    y: _.viewport.height,
                    radius: circleRadius,
                    fill: circleFill
                });

                _.appSpineBase = appSpineBase;

                // Draw a text label on the bottom-right of the bounding box
                var appViewportLabel = new Kinetic.Text({
                    x: 0.5*window.innerWidth / 100,
                    y: 0.5*window.innerWidth / 100,
                    align: labelAlignment,
                    text: appViewportName + "\n" + "x: " + _.viewport.width + "\n" + "y: " + _.viewport.height,
                    fontSize: textSize,
                    fill: textFill,
                    fontFamily: textFamily
                });

                // Load shapes into layers and layers into stages
                appViewportLayer.add(appSpineBase, appViewportLabel);
                _.overlay.add(appViewportLayer);

                // Redraw every damn thing under the sun when the viewport dimensions are updated
                Object.observe(_.viewport, function(changes) {
                    changes.forEach(function(change) {
                        appSpineBase.setAbsolutePosition({
                            x: change.object.width / 2,
                            y: change.object.height
                        });

                        appViewportLabel.text(appViewportName + "\n" + "x: " + change.object.width + "\n" + "y: " + change.object.height);

                        _.overlay.setSize(change.object);

                        _.overlay.batchDraw();
                    });
                });

                // FIXME: Temporary commands for testing
                _.hideLockScreen();
                _.showViewport();
            }
        }


        // Request permission from the user to show notifications
        // Side effects: Gets and stores the user's response to the request
        Util.requestNotificationPermission();
    };

    AppInterface.prototype = {
        setWidth: function(width) {
            var width = width || window.innerWidth;

            this.viewport.width = width;

            return this.overlay;
        },
        setHeight: function(height) {
            var height = height || window.innerHeight;

            this.viewport.height = height;

            return this.overlay;
        },
        getWidth: function() {
            return this.viewport.width;
        },
        getHeight: function() {
            return this.viewport.height;
        },
        hideViewport: function() {
            $('#kinectAppOverlay').velocity({
                opacity: 0
            }, {
                display: "none"
            });
        },
        showViewport: function() {
            $('#kinectAppOverlay').velocity({
                opacity: 1
            }, {
                display: "block"
            });
        },
        hideLockScreen: function() {
            $('#kinectLockScreen').velocity({
                opacity: 0
            }, {
                display: "none"
            });
        },
        showLockScreen: function() {
            $('#kinectLockScreen').velocity({
                opacity: 1
            }, {
                display: "block"
            });
        }
    };

    return AppInterface;
})(AppInterface || {});
