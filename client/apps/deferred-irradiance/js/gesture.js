var gesture = {
    debug: false,

    leftHand: null,
    rightHand: null,
    swipeState: null,

    gestureList: [{
        name: "cursorMove"
    }, {
        name: "closedCursorMove"
    }, {
        name: "genericLeftPull"
    }, {
        name: "genericRightPull"
    }, {
        name: "genericLeftPush"
    }, {
        name: "genericRightPush"
    }, {
        name: "genericSwipeLeft"
    }, {
        name: "genericSwipeRight"
    }, {
        name: "genericSwipeUp"
    }, {
        name: "genericSwipeDown"
    }, {
        name: "elemLeftPull"
    }, {
        name: "elemRightPull"
    }, {
        name: "elemLeftPush"
    }, {
        name: "elemRightPush"
    }, {
        name: "elemSwipeLeft"
    }, {
        name: "elemSwipeRight"
    }, {
        name: "elemSwipeUp"
    }, {
        name: "elemSwipeDown"
    }, {
        name: "genericZoom"
    }, {
        name: "elemZoom"
    }],

    // Initializes all gesture events
    init: function() {
        this.gestureList.forEach(function(item) {
            var gestureItem = eval("gesture." + item.name + " = new CustomEvent(item.name)");

            gestureItem.pageX = nav.sWidth;
            gestureItem.pageY = nav.sHeight;
        });
    },

    // Setter for the left hand state
    setLeftHand: function(handState) {
        gesture.leftHand = handState;
    },

    // Setter for the right hand state
    setRightHand: function(handState) {
        gesture.rightHand = handState;
    },

    // Setter for the swipe state
    setSwipeState: function(swipeVal) {
        gesture.swipeState = swipeVal;
    },

    // State machine for gesture detection and recognition
    process: function() {
        // Get the DOM elements under the cursor location
        var leftHandElement = cursor.getElement(cursor.leftX, cursor.leftY);
        var rightHandElement = cursor.getElement(cursor.rightX, cursor.rightY);

        // Prioritize swipes
        switch (gesture.swipeState) {
            case "left":
                // Dispatch the generic swipe event
                dispatchEvent(gesture.genericSwipeLeft);

                // Dispatch the swipe event directly on any elements
                if (leftHandElement) {
                    gesture.genericSwipeLeft.elem = leftHandElement;
                    leftHandElement.dispatchEvent(gesture.genericSwipeLeft);
                }
                if (rightHandElement) {
                    gesture.genericSwipeLeft.elem = rightHandElement;
                    rightHandElement.dispatchEvent(gesture.genericSwipeLeft);
                }
                break;
            case "right":
                // Dispatch the generic swipe event
                dispatchEvent(gesture.genericSwipeRight);

                // Dispatch the swipe event directly on any elements
                if (leftHandElement) {
                    gesture.genericSwipeRight.elem = leftHandElement;
                    leftHandElement.dispatchEvent(gesture.genericSwipeRight);
                }
                if (rightHandElement) {
                    gesture.genericSwipeRight.elem = rightHandElement;
                    rightHandElement.dispatchEvent(gesture.genericSwipeRight);
                }
                break;
            case "up":
                // Dispatch the generic swipe event
                dispatchEvent(gesture.genericSwipeUp);

                // Dispatch the swipe event directly on any elements
                if (leftHandElement) {
                    gesture.genericSwipeUp.elem = leftHandElement;
                    leftHandElement.dispatchEvent(gesture.genericSwipeUp);
                }
                if (rightHandElement) {
                    gesture.genericSwipeUp.elem = rightHandElement;
                    rightHandElement.dispatchEvent(gesture.genericSwipeUp);
                }
                break;
            case "down":
                // Dispatch the generic swipe event
                dispatchEvent(gesture.genericSwipeDown);

                // Dispatch the swipe event directly on any elements
                if (leftHandElement) {
                    gesture.genericSwipeDown.elem = leftHandElement;
                    leftHandElement.dispatchEvent(gesture.genericSwipeDown);
                }
                if (rightHandElement) {
                    gesture.genericSwipeDown.elem = rightHandElement;
                    rightHandElement.dispatchEvent(gesture.genericSwipeDown);
                }
                break;
            case "none":
            default:
                // Map the left and right hand coordinates from the user viewport to the Kinect viewport
                var mappedLeftCoord = cursor.map(cursor.leftX, cursor.leftY),
                    mappedRightCoord = cursor.map(cursor.rightX, cursor.rightY);

                switch (gesture.leftHand) {
                    case "closed":
                        gesture.closedCursorMove.leftX = mappedLeftCoord[0];
                        gesture.closedCursorMove.leftY = mappedLeftCoord[1];
                        dispatchEvent(gesture.closedCursorMove);
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
                        leftHandElement.dispatchEvent(gesture.genericZoom);
                        break;
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
                }

                switch (gesture.rightHand) {
                    case "closed":
                        gesture.closedCursorMove.rightX = mappedRightCoord[0];
                        gesture.closedCursorMove.rightY = mappedRightCoord[1];
                        dispatchEvent(gesture.closedCursorMove);
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
                        break;
                    case "push":
                        dispatchEvent(gesture.genericRightPush)
                        if (rightHandElement) {
                            gesture.elemRightPush.elem = rightHandElement;
                            rightHandElement.dispatchEvent(gesture.elemRightPush);
                        }
                        break;
                    case "zoom":
                        rightHandElement.dispatchEvent(gesture.genericZoom);
                        break;
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
                }
                break
        }
    }
}
