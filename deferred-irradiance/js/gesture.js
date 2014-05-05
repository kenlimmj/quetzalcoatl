var gesture = {
    debug: false,

    leftHand: null,
    rightHand: null,
    swipeState: null,

    // Initializes all gesture events
    init: function() {
        // Open hand movement
        gesture.cursorMove = new CustomEvent("cursorMove");
        gesture.cursorMove.pageX = nav.sWidth;
        gesture.cursorMove.pageY = nav.sHeight;
        gesture.cursorMove.leftX = null;
        gesture.cursorMove.leftY = null;

        // Closed hand movement
        gesture.closedCursorMove = new CustomEvent("closedCursorMove");
        gesture.closedCursorMove.pageX = nav.sWidth;
        gesture.closedCursorMove.pageY = nav.sHeight;
        gesture.closedCursorMove.leftX = null;
        gesture.closedCursorMove.leftY = null;

        // Left pull gesture
        gesture.genericLeftPull = new CustomEvent("genericLeftPull");
        gesture.genericLeftPull.pageX = nav.sWidth;
        gesture.genericLeftPull.pageY = nav.sHeight;

        // Right pull gesture
        gesture.genericRightPull = new CustomEvent("genericRightPull");
        gesture.genericRightPull.pageX = nav.sWidth;
        gesture.genericRightPull.pageY = nav.sHeight;

        // Left push gesture
        gesture.genericLeftPush = new CustomEvent("genericLeftPush");
        gesture.genericLeftPush.pageX = nav.sWidth;
        gesture.genericLeftPush.pageY = nav.sHeight;

        // Right push gesture
        gesture.genericRightPush = new CustomEvent("genericRightPush");
        gesture.genericRightPush.pageX = nav.sWidth;
        gesture.genericRightPush.pageY = nav.sHeight;

        // Left pull gesture on a specific element
        gesture.elemLeftPull = new CustomEvent("elemLeftPull");
        gesture.elemLeftPull.pageX = nav.sWidth;
        gesture.elemLeftPull.pageY = nav.sHeight;
        gesture.elemLeftPull.elem = null;

        // Right pull gesture on a specific element
        gesture.elemRightPull = new CustomEvent("elemRightPull");
        gesture.elemRightPull.pageX = nav.sWidth;
        gesture.elemRightPull.pageY = nav.sHeight;
        gesture.elemRightPull.elem = null;

        // Left push gesture on a specific element
        gesture.elemLeftPush = new CustomEvent("elemLeftPush");
        gesture.elemLeftPush.pageX = nav.sWidth;
        gesture.elemLeftPush.pageY = nav.sHeight;
        gesture.elemLeftPush.elem = null;

        // Right push gesture on a specific element
        gesture.elemRightPush = new CustomEvent("elemRightPush");
        gesture.elemRightPush.pageX = nav.sWidth;
        gesture.elemRightPush.pageY = nav.sHeight;
        gesture.elemRightPush.elem = null;

        // Zoom gesture
        gesture.genericZoom = new CustomEvent("genericZoom");
        gesture.genericZoom.pageX = nav.sWidth;
        gesture.genericZoom.pageY = nav.sHeight;

        // Zoom gesture on a specific element
        gesture.elemZoom = new CustomEvent("elemZoom");
        gesture.elemZoom.pageX = nav.sWidth;
        gesture.elemZoom.pageY = nav.sHeight;
        gesture.elemZoom.elem = null;

        // Left swipe gesture
        gesture.genericSwipeLeft = new CustomEvent("genericSwipeLeft");
        gesture.genericSwipeLeft.pageX = nav.sWidth;
        gesture.genericSwipeLeft.pageY = nav.sHeight;

        // Right swipe gesture
        gesture.genericSwipeRight = new CustomEvent("genericSwipeRight");
        gesture.genericSwipeRight.pageX = nav.sWidth;
        gesture.genericSwipeRight.pageY = nav.sHeight;

        // Upwards swipe gesture
        gesture.genericSwipeUp = new CustomEvent("genericSwipeUp");
        gesture.genericSwipeUp.pageX = nav.sWidth;
        gesture.genericSwipeUp.pageY = nav.sHeight;

        // Downwards swipe gesture
        gesture.genericSwipeDown = new CustomEvent("genericSwipeDown");
        gesture.genericSwipeDown.pageX = nav.sWidth;
        gesture.genericSwipeDown.pageY = nav.sHeight;

        // Left swipe gesture on a specific element
        gesture.elemSwipeLeft = new CustomEvent("elemSwipeLeft");
        gesture.elemSwipeLeft.pageX = nav.sWidth;
        gesture.elemSwipeLeft.pageY = nav.sHeight;
        gesture.elemSwipeLeft.elem = null;

        // Right swipe gesture on a specific element
        gesture.elemSwipeRight = new CustomEvent("elemSwipeRight");
        gesture.elemSwipeRight.pageX = nav.sWidth;
        gesture.elemSwipeRight.pageY = nav.sHeight;
        gesture.elemSwipeRight.elem = null;

        // Upwards swipe gesture on a specific element
        gesture.elemSwipeUp = new CustomEvent("elemSwipeUp");
        gesture.elemSwipeUp.pageX = nav.sWidth;
        gesture.elemSwipeUp.pageY = nav.sHeight;
        gesture.elemSwipeUp.elem = null;

        // Downwards swipe gesture on a specific element
        gesture.elemSwipeDown = new CustomEvent("elemSwipeDown");
        gesture.elemSwipeDown.pageX = nav.sWidth;
        gesture.elemSwipeDown.pageY = nav.sHeight;
        gesture.elemSwipeDown.elem = null;
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
        // Map the left and right hand coordinates from the user viewport to the Kinect viewport
        var leftHandElement = cursor.getElement(cursor.leftX, cursor.leftY);
        var rightHandElement = cursor.getElement(cursor.rightX, cursor.rightY);

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
                var mappedLeftCoord = cursor.map(cursor.leftX, cursor.leftY),
                    mappedRightCoord = cursor.map(cursor.rightX, cursor.rightY);

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
                }

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
                }
                break
        }
    }
}
