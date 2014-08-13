var AppInterface = (function() {
    "use strict";

    var appViewportName = "Application Viewport",
        circleFill = "#444",
        circleRadius = 2 * window.innerWidth / 100,
        labelAlignment = "left",
        textFill = "#444",
        textSize = window.innerWidth / 100,
        textFamily = "Source Sans Pro";

    var AppInterface = function(width, height, callback) {
        var self = this;

        // Set the width and height of the app to that of the window
        // unless arguments were passed to the constructor
        self.viewport = {
            width: width || window.innerWidth,
            height: height || window.innerHeight
        }

        // Store the callback in the parent object
        // FIXME: This gets around the problem in which it is not possible to
        // directly access the callback variable from within the promise scope
        self.callback = callback;

        // Only proceed if the browser supports HTML imports
        if (Util.supportsImports()) {
            var lockScreenLink = new Promise(function(resolve, reject) {
                var importLink = Util.insertImportLink('kinectLockScreen');

                importLink.onload = function() {
                    // Insert the lock screen only if it doesn't already exist
                    if (document.getElementsByTagName('kinect-lockscreen').length === 0) {
                        // Register the web components in the DOM
                        var overlayTemplate = Util.registerTemplate('kinect-lockscreen', 'kinectLockScreen'),
                            kinectLockScreen = new overlayTemplate();

                        document.body.insertBefore(kinectLockScreen, document.body.firstChild);
                    } else {
                        var kinectLockScreen = document.getElementsByTagName('kinect-lockscreen')[0];
                    }

                    resolve(kinectLockScreen);
                }

                importLink.onerror = function() {
                    reject(Error(importLink));
                }
            });

            lockScreenLink.then(function(kinectLockScreen) {
                // Set an id on the element so it's easy to retrieve later
                kinectLockScreen.id = 'kinectLockScreen';
            });

            var overlayLink = new Promise(function(resolve, reject) {
                var importLink = Util.insertImportLink('kinectAppOverlay');

                importLink.onload = function() {
                    // Insert the control overlay only if it doesn't already exist
                    if (document.getElementsByTagName('kinect-app-overlay').length === 0) {
                        var overlayTemplate = Util.registerTemplate('kinect-app-overlay', 'kinectAppOverlay'),
                            kinectAppOverlay = new overlayTemplate();

                        document.body.insertBefore(kinectAppOverlay, document.getElementsByTagName('kinect-lockscreen')[0]);
                    } else {
                        var kinectAppOverlay = document.getElementsByTagName('kinect-app-overlay')[0];
                    }

                    resolve(kinectAppOverlay);
                }

                importLink.onerror = function() {
                    reject(Error(importLink));
                }
            });

            overlayLink.then(function(kinectAppOverlay) {
                // Set an id on the element so it's easy to retrieve later
                kinectAppOverlay.id = 'kinectAppOverlay';

                // Draw a canvas stage in the interface overlay
                self.overlay = new Kinetic.Stage({
                    container: 'app-overlay',
                    width: self.viewport.width,
                    height: self.viewport.height
                });

                var appViewportLayer = new Kinetic.Layer({
                    hitGraphEnabled: false,
                    listening: false
                });

                // FIXME: Manually set the device ratio so the canvas looks sharp
                // on retina devices. This can be removed once the auto-detection
                // bug in Kinetic JS is fixed
                appViewportLayer.canvas.pixelRatio = window.devicePixelRatio;

                // Draw a circle representing the spine base location in the app's viewport
                var appSpineBase = new Kinetic.Circle({
                    x: self.viewport.width / 2,
                    y: self.viewport.height,
                    radius: circleRadius,
                    fill: circleFill
                });

                // Draw a text label on the bottom-right of the bounding box
                var appViewportLabel = new Kinetic.Text({
                    x: 0.5 * window.innerWidth / 100,
                    y: 0.5 * window.innerWidth / 100,
                    align: labelAlignment,
                    text: appViewportName + "\n" + "x: " + self.viewport.width + "\n" + "y: " + self.viewport.height,
                    fontSize: textSize,
                    fill: textFill,
                    fontFamily: textFamily
                });

                // Expose the canvas layers for easy manipulation
                self.appViewportLayer = appViewportLayer;
                self.appSpineBase = appSpineBase;
                self.appViewportLabel = appViewportLabel;

                // Load shapes into layers and layers into stages
                appViewportLayer.add(appSpineBase, appViewportLabel);
                self.overlay.add(appViewportLayer);

                // Redraw every damn thing under the sun when the viewport dimensions are updated
                Object.observe(self.viewport, function(changes) {
                    changes.forEach(function(change) {
                        appSpineBase.setAbsolutePosition({
                            x: change.object.width / 2,
                            y: change.object.height
                        });

                        appViewportLabel.text(appViewportName + "\n" + "x: " + change.object.width + "\n" + "y: " + change.object.height);

                        self.overlay.setSize(change.object);

                        self.overlay.batchDraw();
                    });
                });
            });
        }

        // Run the callback, if any, once all the async imports have completed
        if (self.callback) {
          Promise.all([overlayLink, lockScreenLink]).then(function() {
              self.callback(self);
          });
        }

        // Request permission from the user to show notifications
        // Side effects: Gets and stores the user's response to the request
        Util.requestNotificationPermission();

        // Check if the browser supports the PageVisiblity API
        var visProp = Util.getHiddenProp();

        if (visProp) {
            var visEvent = visProp.replace(/[H|h]idden/, '') + 'visibilitychange';

            // Set up a listener to lock the screen when the user navigates away
            document.addEventListener(visEvent, function() {
                if (Util.pageIsHidden()) {
                    self.showLockScreen();
                } else {
                    self.hideLockScreen();
                }
            });
        }
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
