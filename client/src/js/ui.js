var Interface = (function() {
    var templatePrototypeGenerator = function(elementId) {
        var template = document.querySelector('link[rel="import"]').import,
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

    var Interface = function() {

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
        }
    };

    return Interface;
})(Interface || {});
