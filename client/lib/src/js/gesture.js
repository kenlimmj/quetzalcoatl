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

        gesture.genericLeftPull = new CustomEvent("genericLeftPull", {
            bubbles: true,
            cancelable: true
        });

        gesture.genericRightPull = new CustomEvent("genericRightPull", {
            bubbles: true,
            cancelable: true
        });

        gesture.genericLeftPush = new CustomEvent("genericLeftPush", {
            bubbles: true,
            cancelable: true
        });

        gesture.genericRightPush = new CustomEvent("genericRightPush", {
            bubbles: true,
            cancelable: true
        });

        gesture.elemLeftPull = new CustomEvent("elemLeftPull", {
            bubbles: true,
            cancelable: true
        });

        gesture.elemRightPull = new CustomEvent("elemRightPull", {
            bubbles: true,
            cancelable: true
        });

        gesture.elemLeftPush = new CustomEvent("elemLeftPush", {
            bubbles: true,
            cancelable: true
        });

        gesture.elemRightPush = new CustomEvent("elemRightPush", {
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
                        dispatchEvent(gesture.genericLeftPull)
                        if (leftHandElement) {
                            gesture.elemLeftPull.elem = leftHandElement;
                            leftHandElement.dispatchEvent(gesture.elemLeftPull);
                        }
                        break;
                    case "push":
                        dispatchEvent(gesture.genericLeftPush)
                        if (leftHandElement) {
                            gesture.elemLeftPush.elem = leftHandElement;
                            leftHandElement.dispatchEvent(gesture.elemLeftPush);
                        }
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
                        dispatchEvent(gesture.genericRightPull)
                        if (rightHandElement) {
                            gesture.elemRightPull.elem = rightHandElement;
                            rightHandElement.dispatchEvent(gesture.elemRightPull);
                        }
                        break;;
                    case "push":
                        dispatchEvent(gesture.genericRightPush)
                        if (rightHandElement) {
                            gesture.elemRightPush.elem = rightHandElement;
                            rightHandElement.dispatchEvent(gesture.elemRightPush);
                        }
                        break;;
                    case "zoom":
                        rightHandElement.dispatchEvent(gesture.zoom);
                        break;;
                }
                break;
        }

    }
}
