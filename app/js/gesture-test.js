var gesture = {
    debug: false,

    leftHand: null,
    rightHand: null,

    limitRate: 1000,

    init: function() {
        gesture.cursorMove = new CustomEvent("cursorMove", {
            bubbles: true,
            cancelable: true
        });

        gesture.leftPull = new CustomEvent("leftPull", {
            bubbles: true,
            cancelable: true
        });

        gesture.rightPull = new CustomEvent("rightPull", {
            bubbles: true,
            cancelable: true
        });

        gesture.leftPush = new CustomEvent("leftPush", {
            bubbles: true,
            cancelable: true
        });

        gesture.rightPush = new CustomEvent("rightPush", {
            bubbles: true,
            cancelable: true
        });

        gesture.zoom = new CustomEvent("zoom", {
            bubbles: true,
            cancelable: true
        });
    },

    setLeftHand: function(handState) {
        gesture.leftHand = handState;
    },

    setRightHand: function(handState) {
        gesture.rightHand = handState;
    },

    debounce: function(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this,
                args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            }, wait);
            if (immediate && !timeout) func.apply(context, args);
        };
    },

    process: function() {
        var leftHandElement = cursor.getElement(cursor.leftX, cursor.leftY);
        switch (gesture.leftHand) {
            case "open":
            case "point":
            case "closed":
            default:
                gesture.cursorMove.leftX = cursor.leftX;
                gesture.cursorMove.leftY = cursor.leftY;
                leftHandElement.dispatchEvent(gesture.cursorMove);
                cursor.updateLeftHand();
                break;
            case "pull":
                debounce(function() {
                    leftHandElement.dispatchEvent(gesture.leftPull);
                }, gesture.limitRate);
                break;
            case "push":
                debounce(function() {
                    leftHandElement.dispatchEvent(gesture.leftPush);
                }, gesture.limitRate);
                break;
            case "zoom":
                debounce(function() {
                    leftHandElement.dispatchEvent(gesture.zoom);
                }, gesture.limitRate);
                break;
        }

        var rightHandElement = cursor.getElement(cursor.rightX, cursor.rightY);
        switch (gesture.rightHand) {
            case "open":
            case "point":
            case "closed":
            default:
                gesture.cursorMove.rightX = cursor.rightX;
                gesture.cursorMove.rightY = cursor.rightY;
                rightHandElement.dispatchEvent(gesture.cursorMove);
                cursor.updateRightHand();
                break;
            case "pull":
                debounce(function() {
                    rightHandElement.dispatchEvent(gesture.rightPull);
                }, gesture.limitRate);
                break;;
            case "push":
                debounce(function() {
                    rightHandElement.dispatchEvent(gesture.rightPush);
                }, gesture.limitRate);
                break;;
            case "zoom":
                debounce(function() {
                    rightHandElement.dispatchEvent(gesture.zoom);
                }, gesture.limitRate);
                break;;
        }
    }
}
