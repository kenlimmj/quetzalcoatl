var Util = (function() {
    "use strict";

    var templateDirectory = '';

    var templatePrototypeGenerator = function(elementId) {
        var link = document.querySelector('link[rel="import"][data-id=' + elementId + ']').import,
            template = link.getElementById(elementId),
            content = template.content,
            contentNode = document.importNode(content, true);

        return Object.create(HTMLElement.prototype, {
            createdCallback: {
                value: function() {
                    this.appendChild(contentNode);
                }
            }
        });
    };

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

    return {
        generateUUID: function() {
            var self = {};
            var lut = [];
            for (var i = 0; i < 256; i++) {
                lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
            }
            self.generate = function() {
                var d0 = Math.random() * 0xffffffff | 0;
                var d1 = Math.random() * 0xffffffff | 0;
                var d2 = Math.random() * 0xffffffff | 0;
                var d3 = Math.random() * 0xffffffff | 0;
                return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
                    lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
                    lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
                    lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
            }
            return self.generate();
        },
        registerTemplate: function(tagName, templateId) {
            return document.registerElement(tagName, {
                prototype: templatePrototypeGenerator(templateId)
            });
        },
        supportsImports: function() {
            return 'import' in document.createElement('link');
        },
        insertImportLink: function(templateName, asyncState) {
            var asyncState = asyncState || true,
                linkNode = document.createElement('link');

            linkNode.dataset.id = templateName;
            linkNode.setAttribute('rel', 'import');
            linkNode.setAttribute('async', asyncState.toString());
            linkNode.setAttribute('href', templateDirectory + templateName + '.html');
            document.head.appendChild(linkNode);

            return linkNode;
        },
        requestNotificationPermission: function() {
            window.addEventListener('load', function() {
                Notification.requestPermission(function(status) {
                    if (Notification.permission !== status) {
                        Notification.permission = status;
                    }
                });
            });
        },
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
        getHiddenProp: function() {
            // FIXME: To be removed one day when the world goes prefixless
            var prefixes = ['webkit', 'moz', 'ms', 'o'];

            // If 'hidden' is natively supported, return it
            if ('hidden' in document) return 'hidden';

            // Otherwise loop over all the known prefixes until we find one
            for (var i = 0; i < prefixes.length; i++) {
                if ((prefixes[i] + 'Hidden') in document)
                    return prefixes[i] + 'Hidden';
            }

            // Otherwise it's not supported
            return null;
        },
        pageIsHidden: function() {
            // Check if the page supports the PageVisibility API
            var prop = Util.getHiddenProp();

            // If it doesn't, the page is never hidden. If it does, return the status
            return !prop ? false : document[prop];
        }
    }
})(Util || {});
