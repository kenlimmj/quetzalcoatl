var gesture = {
    debug: false,

    leftHand: null,
    rightHand: null,

    init: function() {
        gesture.pullEvent = new CustomEvent("pull", {
            detail: {
                value: "10"
            },
            bubbles: true,
            cancelable: true
        });

        gesture.pushEvent = new CustomEvent("push", {
            detail: {
                value: "10"
            },
            bubbles: true,
            cancelable: true
        });

        gesture.zoomEvent = new CustomEvent("zoom", {
            detail: {
                value: "10"
            },
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

    process: function() {
        var leftHandElement = cursor.getElement(cursor.leftX, cursor.leftY);
        switch (gesture.leftHand) {
            case "open":
            case "point":
                cursor.updateLeftHand();
                break;
            case "grab":
                cursor.updateLeftHand();
                break;
            case "pull":
                leftHandElement.dispatchEvent("pull");
                break;
            case "push":
                leftHandElement.dispatchEvent("push");
                break;
            case "zoom":
                leftHandElement.dispatchEvent("zoom");
                break;
            default:
        }

        var rightHandElement = cursor.getElement(cursor.rightX, cursor.rightY);
        switch (gesture.rightHand) {
            case "open":
            case "point":
                cursor.updateRightHand();
                break;
            case "grab":
                cursor.updateRightHand();
                break;
            case "pull":
                rightHandElement.dispatchEvent("pull");
                break;;
            case "push":
                rightHandElement.dispatchEvent("push");
                break;;
            case "zoom":
                rightHandElement.dispatchEvent("zoom");
                break;;
            default:
        }
    }
}
