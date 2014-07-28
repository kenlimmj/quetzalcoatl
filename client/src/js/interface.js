var Interface = (function() {
    var templateDirectory = '';

    var templatePrototypeGenerator = function(elementId) {
        var link = document.querySelector('link[rel="import"]').import;
        template = link.getElementById(elementId),
        content = template.content,
        contentNode = document.importNode(content, true);

        return Object.create(HTMLElement.prototype, {
            createdCallback: {
                value: function() {
                    this.createShadowRoot().appendChild(contentNode);
                }
            }
        });
    };

    var registerTemplate = function(tagName, templateId) {
        return document.registerElement(tagName, {
            prototype: templatePrototypeGenerator(templateId)
        });
    };

    var supportsImports = function() {
        return 'import' in document.createElement('link');
    }

    var insertImportLink = function(templateName) {
        var linkNode = document.createElement('link');
        linkNode.setAttribute('rel', 'import');
        linkNode.setAttribute('async', 'true');
        linkNode.setAttribute('href', templateDirectory + templateName + '.html');
        document.head.appendChild(linkNode);

        return linkNode;
    };

    var requestNotificationPermission = function() {
        window.addEventListener('load', function() {
            Notification.requestPermission(function(status) {
                if (Notification.permission !== status) {
                    Notification.permission = status;
                }
            });
        });
    }

    var notify = function(title, body, tag, duration) {
        var duration = duration || 5000,
            body = body || "",
            tag = tag || "kinectNotification";

        if (window.Notification && Notification.permission === "granted") {
            var message = new Notification(title, {
                body: body,
                tag: tag
            });
        }

        message.onshow = function() {
            setTimeout(function() {
                message.close();
            }, duration);
        }

        return message;
    };

    var Interface = function(width, height) {
        var _ = this;

        // Set the width and height of the app to that of the window
        // unless arguments were passed to the constructor
        this.viewport = {
            width: width || window.innerWidth,
            height: height || window.innerHeight
        }

        // Only proceed if the browser supports HTML imports
        if (supportsImports) {
            var templateLink = insertImportLink('kinectNavOverlay');

            // Defer all actions until the template import finishes
            templateLink.onload = function() {
                // Insert the control overlay if it doesn't already exist
                if (document.getElementsByTagName('kinect-nav-overlay').length === 0) {
                    // Register the web components in the DOM
                    var overlayTemplate = registerTemplate('kinect-nav-overlay', 'kinectNavOverlay'),
                        kinectNavOverlay = new overlayTemplate();

                    document.body.insertBefore(kinectNavOverlay, document.body.firstChild);
                } else {
                    var kinectNavOverlay = document.getElementsByTagName('kinect-nav-overlay')[0];
                }

                // Draw a canvas stage in the interface overlay
                _.overlay = new Kinetic.Stage({
                    container: kinectNavOverlay,
                    width: width,
                    height: height
                });

                // Update the stage whenever the viewport dimensions are changed
                Object.observe(this.viewport, function(changes) {
                    changes.forEach(function(change) {
                        _.overlay.setWidth(change.object.width);
                        _.overlay.setHeight(change.object.height);
                    });
                });
            }
        }

        // Request permission from the user to show notifications
        // Side effects: Gets and stores the user's response to the request
        requestNotificationPermission();
    };

    Interface.prototype = {
        notifyRecognizedUser: function(name) {
            return notify("User Detected", "Welcome back, " + name + ". You have full control.", "userRecognition");
        },
        notifyUnknownUser: function() {
            return notify("Unknown User Detected", "Quetzalcoatl will not unlock unless switched to generic user mode.", "userRecognition");
        },
        notifyConnectionEstablished: function() {
            return notify("Connection Established", "Quetzalcoatl is now receiving data from the Kinect connected to this computer.", "connectionStatus");
        },
        notifyConnectionLost: function() {
            return notify("Connection Lost", "Please check the status of the Kinect connected to this computer.", "connectionStatus")
        },
        setX: function(width) {
            this.viewport.width = width;

            return this.overlay;
        },
        setY: function(height) {
            this.viewport.height = height;

            return this.overlay;
        },
        getX: function() {
            return this.viewport.width;
        },
        getY: function() {
            return this.viewport.height;
        },
        drawViewport: function() {
            var appSpineBase = new Kinetic.Circle({
                x: this.width / 2,
                y: this.height,
                radius: circleRadius * 1.618,
                fill: circleFill
            });

            var appSpineBaseLabel = new Kinetic.Text({

            });
        },
        hideLockScreen: function() {

        },
        showLockScreen: function() {

        }
    };

    return Interface;
})(Interface || {});

var foo = new Interface();
