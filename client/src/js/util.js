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
        }
    }
})(Util || {});
