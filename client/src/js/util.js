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
