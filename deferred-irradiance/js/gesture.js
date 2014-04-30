var gesture = {
    debug: false,

    leftHand: null,
    rightHand: null,
    swipeState: null,

    init: function() {
        gesture.cursorMove = new CustomEvent("cursorMove", {
            bubbles: true,
            cancelable: true
        });

        gesture.closedMove = new CustomEvent("closedCursorMove", {
            bubbles: true,
            cancelable: true
        })

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

        gesture.swipeLeft = new CustomEvent("swipeLeft", {
            bubbles: true,
            cancelable: true
        });

        gesture.swipeRight = new CustomEvent("swipeRight", {
            bubbles: true,
            cancelable: true
        });

        gesture.swipeUp = new CustomEvent("swipeUp", {
            bubbles: true,
            cancelable: true
        });

        gesture.swipeDown = new CustomEvent("swipeDown", {
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

    setSwipeState: function(swipeVal) {
        gesture.swipeState = swipeVal;
    },

    process: function() {
        switch (gesture.swipeState) {
            case "left":
                dispatchEvent(gesture.swipeLeft);
                break;
            case "right":
                dispatchEvent(gesture.swipeRight);
                break;
            case "up":
                dispatchEvent(gesture.swipeUp);
                break;
            case "down":
                dispatchEvent(gesture.swipeDown);
                break;
            case "none":
            default:
                var leftHandElement = cursor.getElement(cursor.leftX, cursor.leftY);
                var mappedLeftCoord = cursor.map(cursor.leftX, cursor.leftY);
                switch (gesture.leftHand) {
                    case "open":
                    case "point":
                    default:
                        gesture.cursorMove.leftX = mappedLeftCoord[0];
                        gesture.cursorMove.leftY = mappedLeftCoord[1];
                        dispatchEvent(gesture.cursorMove);
                        if (cursor.drawLeft === true) {
                            cursor.updateLeftHand();
                        }
                        break;
                    case "closed":
                        gesture.closedMove.leftX = mappedLeftCoord[0];
                        gesture.closedMove.leftY = mappedLeftCoord[1];
                        dispatchEvent(gesture.closedMove);
                        if (cursor.drawLeft === true) {
                            cursor.updateLeftHand();
                        }
                        break;
                    case "pull":
                        leftHandElement.dispatchEvent(gesture.leftPull);
                        break;
                    case "push":
                        leftHandElement.dispatchEvent(gesture.leftPush);
                        break;
                    case "zoom":
                        leftHandElement.dispatchEvent(gesture.zoom);
                        break;
                }

                var rightHandElement = cursor.getElement(cursor.rightX, cursor.rightY);
                var mappedRightCoord = cursor.map(cursor.rightX, cursor.rightY);
                switch (gesture.rightHand) {
                    case "open":
                    case "point":
                    default:
                        gesture.cursorMove.rightX = mappedRightCoord[0];
                        gesture.cursorMove.rightY = mappedRightCoord[1];
                        dispatchEvent(gesture.cursorMove);
                        if (cursor.drawRight === true) {
                            cursor.updateRightHand();
                        }
                        break;
                    case "closed":
                        gesture.closedMove.rightX = mappedRightCoord[0];
                        gesture.closedMove.rightY = mappedRightCoord[1];
                        dispatchEvent(gesture.closedMove);
                        if (cursor.drawRight === true) {
                            cursor.updateRightHand();
                        }
                        break;
                    case "pull":
                        rightHandElement.dispatchEvent(gesture.rightPull);
                        break;;
                    case "push":
                        rightHandElement.dispatchEvent(gesture.rightPush);
                        break;;
                    case "zoom":
                        rightHandElement.dispatchEvent(gesture.zoom);
                        break;;
                }
                break;
        }

    }
}
