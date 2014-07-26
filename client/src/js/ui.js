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
    }

    var Interface = function(width, height) {
        // Set the width and height of the app to that of the window
        // unless arguments were passed to the constructor
        this.width = width || window.innerWidth;
        this.height = height || window.innerHeight;

        var templateLink = insertImportLink('kinectNavOverlay');

        // Defer all actions until the template import finishes
        templateLink.onload = function() {
          // Register the web components in the DOM
          var overlayTemplate = registerTemplate('kinect-nav-overlay', 'kinectNavOverlay');

          // Insert the control overlay if it doesn't already exist
          if (document.getElementsByTagName('kinect-nav-overlay').length === 0) {
            var kinectNavOverlay = new overlayTemplate();

            document.body.insertBefore(kinectNavOverlay, document.body.firstChild);
          } else {
            var kinectNavOverlay = document.getElementsByTagName('kinect-nav-overlay');
          }

          return kinectNavOverlay;
        }
    };

    Interface.prototype = {
        notify: function(msg) {
            if (Notification.permission === "granted") {
                return new Notification(msg);
            } else if (Notification.permission !== "denied") {
                Notification.requestPermission(function(permission) {
                    if (!('permission' in Notification)) {
                        Notification.permission = permission;
                    }

                    if (permission === "granted") {
                        return new Notification(msg);
                    }
                });
            }
        },
        getX: function() {
          return this.width;
        },
        getY: function() {
          return this.height;
        }
    };

    return Interface;
})(Interface || {});
