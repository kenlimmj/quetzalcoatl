var gesture = {
    debug: false,

    leftHand: null,
    rightHand: null,

    init: function() {
        gesture.pull = new CustomEvent("pull", {
            detail: {
                value: "10"
            },
            bubbles: true,
            cancelable: true
        });

        gesture.push = new CustomEvent("push", {
            detail: {
                value: "10"
            },
            bubbles: true,
            cancelable: true
        });

        gesture.zoom = new CustomEvent("zoom", {
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
            case "closed":
                cursor.updateLeftHand();
                break;
            case "pull":
                leftHandElement.dispatchEvent(gesture.pull);
                break;
            case "push":
                leftHandElement.dispatchEvent(gesture.push);
                break;
            case "zoom":
                leftHandElement.dispatchEvent(gesture.zoom);
                break;
            default:
                cursor.updateLeftHand();
                break;
        }

        var rightHandElement = cursor.getElement(cursor.rightX, cursor.rightY);
        switch (gesture.rightHand) {
            case "open":
            case "point":
                cursor.updateRightHand();
                break;
            case "closed":
                cursor.updateRightHand();
                break;
            case "pull":
                rightHandElement.dispatchEvent(gesture.pull);
                break;;
            case "push":
                rightHandElement.dispatchEvent(gesture.push);
                break;;
            case "zoom":
                rightHandElement.dispatchEvent(gesture.zoom);
                break;;
            default:
                cursor.updateRightHand();
                break;
        }
    }
}
