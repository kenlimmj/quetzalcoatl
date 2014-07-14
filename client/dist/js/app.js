var cursor = {
    debug: false,

    // Switches for determining whether the cursor reticules are drawn
    drawLeft: true,
    drawRight: true,

    // Initialize holder values for the cursor coordinates
    leftX: null,
    leftY: null,
    rightX: null,
    rightY: null,

    // Direction locks for the left cursor
    leftLockX: false,
    leftLockY: false,
    leftLockD: false,

    // Direction locks for the right cursor
    rightLockX: false,
    rightLockY: false,
    rightLockD: false,

    // Hard-coded values for the cursor radii
    unknown_radius: 65.45,
    open_radius: 25,
    grab_radius: 15.45,
    point_radius: 5.9,

    init: function() {
        // Create one layer for each hand
        cursor.leftCursorLayer = new Kinetic.Layer(),
        cursor.rightCursorLayer = new Kinetic.Layer();

        // Map the cursor values from the user viewport to the screen viewport
        // These values are never exposed
        var mappedLeftCursor = cursor.map(cursor.leftX, cursor.leftY),
            mappedRightCursor = cursor.map(cursor.rightX, cursor.rightY);

        // Draw a circle for the left cursor in the screen viewport
        cursor.leftScreenCursor = new Kinetic.Circle({
            x: mappedLeftCursor[0],
            y: mappedLeftCursor[1],
            radius: cursor.open_radius,
            fill: "#d33682"
        });

        // Draw a circle for the right cursor in the screen viewport
        cursor.rightScreenCursor = new Kinetic.Circle({
            x: mappedRightCursor[0],
            y: mappedRightCursor[1],
            radius: cursor.open_radius,
            fill: "#6c71c4"
        });

        if (cursor.debug === true) {
            // Add a tooltip label to the left cursor in the screen viewport
            cursor.leftScreenCursorLabel = new Kinetic.Text({
                x: cursor.leftScreenCursor.getX() + cursor.leftScreenCursor.radius(),
                y: cursor.leftScreenCursor.getY() + cursor.leftScreenCursor.radius(),
                align: "left",
                text: cursor.leftScreenCursor.getX() + "\n" + cursor.leftScreenCursor.getY(),
                fontSize: 14,
                fill: "#d33682"
            });

            // Add a tooltip label to the right cursor in the screen viewport
            cursor.rightScreenCursorLabel = new Kinetic.Text({
                x: cursor.rightScreenCursor.getX() + cursor.rightScreenCursor.radius(),
                y: cursor.rightScreenCursor.getY() + cursor.rightScreenCursor.radius(),
                align: "left",
                text: cursor.rightScreenCursor.getX() + "\n" + cursor.rightScreenCursor.getY(),
                fontSize: 14,
                fill: "#6c71c4"
            });

            // Draw a circle for the left cursor in the user viewport
            cursor.leftUserCursor = new Kinetic.Circle({
                x: cursor.leftX + nav.kinectView.getX(),
                y: cursor.leftY + nav.kinectView.getY(),
                radius: cursor.open_radius / 1.618,
                fill: "#d33682"
            });

            // Draw a circle for the right cursor in the user viewport
            cursor.rightUserCursor = new Kinetic.Circle({
                x: cursor.rightX + nav.kinectView.getX(),
                y: cursor.rightY + nav.kinectView.getY(),
                radius: cursor.open_radius / 1.618,
                fill: "#6c71c4"
            });

            // Add a tooltip label to the left cursor in the user viewport
            cursor.leftUserCursorLabel = new Kinetic.Text({
                x: cursor.leftUserCursor.getX() + cursor.leftUserCursor.radius(),
                y: cursor.leftUserCursor.getY() + cursor.leftUserCursor.radius(),
                align: "left",
                text: cursor.leftX + "\n" + cursor.leftY,
                fontSize: 11,
                fill: "#d33682"
            });

            // Add a tooltip label to the right cursor in the user viewport
            cursor.rightUserCursorLabel = new Kinetic.Text({
                x: cursor.rightUserCursor.getX() + cursor.rightUserCursor.radius(),
                y: cursor.rightUserCursor.getY() + cursor.rightUserCursor.radius(),
                align: "left",
                text: cursor.rightX + "\n" + cursor.rightY,
                fontSize: 11,
                fill: "#6c71c4"
            });

            // Draw a dotted line connecting the left cursors in the user and screen viewports
            cursor.leftCursorConnector = new Kinetic.Line({
                points: [cursor.leftUserCursor.getX(), cursor.leftUserCursor.getY(), cursor.leftScreenCursor.getX(), cursor.leftScreenCursor.getY()],
                stroke: "#d33682",
                strokeWidth: 1.618,
                lineJoin: "round",
                dash: [10, 5]
            });

            // Draw a dotted line connecting the right cursors in the user and screen viewports
            cursor.rightCursorConnector = new Kinetic.Line({
                points: [cursor.rightUserCursor.getX(), cursor.rightUserCursor.getY(), cursor.rightScreenCursor.getX(), cursor.rightScreenCursor.getY()],
                stroke: "#6c71c4",
                strokeWidth: 1.618,
                lineJoin: "round",
                dash: [10, 5]
            });
        }

        // Add each cursor reticule to its respective layer
        if (cursor.drawLeft === true) {
            cursor.leftCursorLayer.add(cursor.leftScreenCursor);
        }
        if (cursor.drawRight === true) {
            cursor.rightCursorLayer.add(cursor.rightScreenCursor);
        }

        if (cursor.debug === true) {
            cursor.leftCursorLayer.add(cursor.leftScreenCursorLabel);
            cursor.leftCursorLayer.add(cursor.leftUserCursor).add(cursor.leftUserCursorLabel);
            cursor.leftCursorLayer.add(cursor.leftCursorConnector);

            cursor.rightCursorLayer.add(cursor.rightScreenCursorLabel);
            cursor.rightCursorLayer.add(cursor.rightUserCursor).add(cursor.rightUserCursorLabel);
            cursor.rightCursorLayer.add(cursor.rightCursorConnector);
        }

        // Add both layers to the navigation overlay
        nav.overlay.add(cursor.leftCursorLayer).add(cursor.rightCursorLayer);
    },

    setLeftHand: function(x, y) {
        cursor.leftX = x;
        cursor.leftY = y;
    },

    setRightHand: function(x, y) {
        cursor.rightX = x;
        cursor.rightY = y;
    },

    get_radius: function(handState) {
        switch (handState) {
            case "open":
                return cursor.open_radius;
            case "closed":
                return cursor.grab_radius;
            case "point":
                return cursor.point_radius;
            default:
                return cursor.unknown_radius;
        }
    },

    get_threshold: function(handState) {
        switch (handState) {
            case "open":
                return 1 / 100
            case "closed":
                return 1 / 100
            case "pull":
                return 1 / 100
            case "point":
                return 1 / 200
            default:
                return 1 / 100
        }
    },

    stabilize: function(x, factor) {
        return x - (x % factor) + (x % factor > 0 && factor);
    },

    getElement: function(x, y) {
        var mappedCursor = cursor.map(x, y);
        return document.elementFromPoint(mappedCursor[0], mappedCursor[1]);
    },

    map: function(x, y) {
        // Calculate the coordinate space for the incoming x-coordinate
        if (x < nav.uxMin) {
            // If the hand is too far to the left, clip to the left edge of the screen
            screenX = 0;
        } else if (x > nav.uxMax) {
            // If the hand is too far to the right, clip to the right edge of the screen
            screenX = nav.sWidth;
        } else {
            // Otherwise, translate it so it fits within the viable space
            screenX = (x - nav.uxMin) / nav.uWidth * nav.sWidth;
        }

        // Calculate the coordinate space for the incoming y-coordinate
        if (y < nav.uyMin) {
            // If the hand is too high up, clip it to the top edge of the screen
            screenY = 0;
        } else if (y > nav.uyMax) {
            // If the hand is too low down, clip it to the bottom edge of the screen
            screenY = nav.sHeight;
        } else {
            // Otherwise, translate it so it fits within the viable space
            screenY = (y - nav.uyMin) / nav.uHeight * nav.sHeight;
        }

        return [Math.round(screenX), Math.round(screenY)];
    },

    updateLeftHand: function() {
        var mappedLeftCursor = cursor.map(cursor.leftX, cursor.leftY);

        if (cursor.leftLockX === false) {
            cursor.leftScreenCursor.setX(mappedLeftCursor[0]);
        }

        if (cursor.leftLockY === false) {
            cursor.leftScreenCursor.setY(mappedLeftCursor[1]);
        }

        cursor.leftScreenCursor.setRadius(cursor.get_radius(gesture.leftHand));

        if (cursor.debug === true) {
            if (cursor.leftLockX === false) {
                cursor.leftScreenCursorLabel.setX(cursor.leftScreenCursor.getX() + cursor.leftScreenCursor.radius());
            }
            if (cursor.leftLockY === false) {
                cursor.leftScreenCursorLabel.setY(cursor.leftScreenCursor.getY() + cursor.leftScreenCursor.radius());
            }
            cursor.leftScreenCursorLabel.setText(gesture.leftHand + "\n" + cursor.leftScreenCursor.getX() + "\n" + cursor.leftScreenCursor.getY());

            // Draw the location of the left cursor in the user viewport
            cursor.leftUserCursor.setX(cursor.leftX + nav.kinectView.getX());
            cursor.leftUserCursor.setY(cursor.leftY + nav.kinectView.getY());

            // Draw the left cursor label in the user viewport
            cursor.leftUserCursorLabel.setX(cursor.leftUserCursor.getX() + cursor.leftUserCursor.radius());
            cursor.leftUserCursorLabel.setY(cursor.leftUserCursor.getY() + cursor.leftUserCursor.radius());
            cursor.leftUserCursorLabel.setText(cursor.leftX + "\n" + cursor.leftY);

            // Draw a dotted line connecting the left cursor in the user viewport to the screen viewport
            cursor.leftCursorConnector.setPoints([cursor.leftUserCursor.getX(), cursor.leftUserCursor.getY(), cursor.leftScreenCursor.getX(), cursor.leftScreenCursor.getY()]);
        }

        cursor.leftCursorLayer.batchDraw();
    },

    updateRightHand: function() {
        var mappedRightCursor = cursor.map(cursor.rightX, cursor.rightY);

        if (cursor.rightLockX === false) {
            cursor.rightScreenCursor.setX(mappedRightCursor[0]);
        }
        if (cursor.rightLockY === false) {
            cursor.rightScreenCursor.setY(mappedRightCursor[1]);
        }
        cursor.rightScreenCursor.setRadius(cursor.get_radius(gesture.rightHand));

        if (cursor.debug === true) {
            if (cursor.rightLockX === false) {
                cursor.rightScreenCursorLabel.setX(cursor.rightScreenCursor.getX() + cursor.rightScreenCursor.radius());
            }
            if (cursor.rightLockY === false) {
                cursor.rightScreenCursorLabel.setY(cursor.rightScreenCursor.getY() + cursor.rightScreenCursor.radius());
            }
            cursor.rightScreenCursorLabel.setText(gesture.rightHand + "\n" + cursor.rightScreenCursor.getX() + "\n" + cursor.rightScreenCursor.getY());

            // Draw the location of the right cursor in the user viewport
            cursor.rightUserCursor.setX(cursor.rightX + nav.kinectView.getX());
            cursor.rightUserCursor.setY(cursor.rightY + nav.kinectView.getY());

            // Draw the right cursor label in the user viewport
            cursor.rightUserCursorLabel.setX(cursor.rightUserCursor.getX() + cursor.rightUserCursor.radius());
            cursor.rightUserCursorLabel.setY(cursor.rightUserCursor.getY() + cursor.rightUserCursor.radius());
            cursor.rightUserCursorLabel.setText(cursor.rightX + "\n" + cursor.rightY);

            // Draw a dotted line connecting the right cursor in the user viewport to the screen viewport
            cursor.rightCursorConnector.setPoints([cursor.rightUserCursor.getX(), cursor.rightUserCursor.getY(), cursor.rightScreenCursor.getX(), cursor.rightScreenCursor.getY()]);
        }

        cursor.rightCursorLayer.batchDraw();
    }
}

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

// jquery.event.move
//
// 1.3.6
//
// Stephen Band
//
// Triggers 'movestart', 'move' and 'moveend' events after
// mousemoves following a mousedown cross a distance threshold,
// similar to the native 'dragstart', 'drag' and 'dragend' events.
// Move events are throttled to animation frames. Move event objects
// have the properties:
//
// pageX:
// pageY:   Page coordinates of pointer.
// startX:
// startY:  Page coordinates of pointer at movestart.
// distX:
// distY:  Distance the pointer has moved since movestart.
// deltaX:
// deltaY:  Distance the finger has moved since last event.
// velocityX:
// velocityY:  Average velocity over last few events.


(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){

	var // Number of pixels a pressed pointer travels before movestart
	    // event is fired.
	    threshold = 6,
	
	    add = jQuery.event.add,
	
	    remove = jQuery.event.remove,

	    // Just sugar, so we can have arguments in the same order as
	    // add and remove.
	    trigger = function(node, type, data) {
	    	jQuery.event.trigger(type, data, node);
	    },

	    // Shim for requestAnimationFrame, falling back to timer. See:
	    // see http://paulirish.com/2011/requestanimationframe-for-smart-animating/
	    requestFrame = (function(){
	    	return (
	    		window.requestAnimationFrame ||
	    		window.webkitRequestAnimationFrame ||
	    		window.mozRequestAnimationFrame ||
	    		window.oRequestAnimationFrame ||
	    		window.msRequestAnimationFrame ||
	    		function(fn, element){
	    			return window.setTimeout(function(){
	    				fn();
	    			}, 25);
	    		}
	    	);
	    })(),
	    
	    ignoreTags = {
	    	textarea: true,
	    	input: true,
	    	select: true,
	    	button: true
	    },
	    
	    mouseevents = {
	    	move: 'mousemove',
	    	cancel: 'mouseup dragstart',
	    	end: 'mouseup'
	    },
	    
	    touchevents = {
	    	move: 'touchmove',
	    	cancel: 'touchend',
	    	end: 'touchend'
	    };


	// Constructors
	
	function Timer(fn){
		var callback = fn,
		    active = false,
		    running = false;
		
		function trigger(time) {
			if (active){
				callback();
				requestFrame(trigger);
				running = true;
				active = false;
			}
			else {
				running = false;
			}
		}
		
		this.kick = function(fn) {
			active = true;
			if (!running) { trigger(); }
		};
		
		this.end = function(fn) {
			var cb = callback;
			
			if (!fn) { return; }
			
			// If the timer is not running, simply call the end callback.
			if (!running) {
				fn();
			}
			// If the timer is running, and has been kicked lately, then
			// queue up the current callback and the end callback, otherwise
			// just the end callback.
			else {
				callback = active ?
					function(){ cb(); fn(); } : 
					fn ;
				
				active = true;
			}
		};
	}


	// Functions
	
	function returnTrue() {
		return true;
	}
	
	function returnFalse() {
		return false;
	}
	
	function preventDefault(e) {
		e.preventDefault();
	}
	
	function preventIgnoreTags(e) {
		// Don't prevent interaction with form elements.
		if (ignoreTags[ e.target.tagName.toLowerCase() ]) { return; }
		
		e.preventDefault();
	}

	function isLeftButton(e) {
		// Ignore mousedowns on any button other than the left (or primary)
		// mouse button, or when a modifier key is pressed.
		return (e.which === 1 && !e.ctrlKey && !e.altKey);
	}

	function identifiedTouch(touchList, id) {
		var i, l;

		if (touchList.identifiedTouch) {
			return touchList.identifiedTouch(id);
		}
		
		// touchList.identifiedTouch() does not exist in
		// webkit yet… we must do the search ourselves...
		
		i = -1;
		l = touchList.length;
		
		while (++i < l) {
			if (touchList[i].identifier === id) {
				return touchList[i];
			}
		}
	}

	function changedTouch(e, event) {
		var touch = identifiedTouch(e.changedTouches, event.identifier);

		// This isn't the touch you're looking for.
		if (!touch) { return; }

		// Chrome Android (at least) includes touches that have not
		// changed in e.changedTouches. That's a bit annoying. Check
		// that this touch has changed.
		if (touch.pageX === event.pageX && touch.pageY === event.pageY) { return; }

		return touch;
	}


	// Handlers that decide when the first movestart is triggered
	
	function mousedown(e){
		var data;

		if (!isLeftButton(e)) { return; }

		data = {
			target: e.target,
			startX: e.pageX,
			startY: e.pageY,
			timeStamp: e.timeStamp
		};

		add(document, mouseevents.move, mousemove, data);
		add(document, mouseevents.cancel, mouseend, data);
	}

	function mousemove(e){
		var data = e.data;

		checkThreshold(e, data, e, removeMouse);
	}

	function mouseend(e) {
		removeMouse();
	}

	function removeMouse() {
		remove(document, mouseevents.move, mousemove);
		remove(document, mouseevents.cancel, mouseend);
	}

	function touchstart(e) {
		var touch, template;

		// Don't get in the way of interaction with form elements.
		if (ignoreTags[ e.target.tagName.toLowerCase() ]) { return; }

		touch = e.changedTouches[0];
		
		// iOS live updates the touch objects whereas Android gives us copies.
		// That means we can't trust the touchstart object to stay the same,
		// so we must copy the data. This object acts as a template for
		// movestart, move and moveend event objects.
		template = {
			target: touch.target,
			startX: touch.pageX,
			startY: touch.pageY,
			timeStamp: e.timeStamp,
			identifier: touch.identifier
		};

		// Use the touch identifier as a namespace, so that we can later
		// remove handlers pertaining only to this touch.
		add(document, touchevents.move + '.' + touch.identifier, touchmove, template);
		add(document, touchevents.cancel + '.' + touch.identifier, touchend, template);
	}

	function touchmove(e){
		var data = e.data,
		    touch = changedTouch(e, data);

		if (!touch) { return; }

		checkThreshold(e, data, touch, removeTouch);
	}

	function touchend(e) {
		var template = e.data,
		    touch = identifiedTouch(e.changedTouches, template.identifier);

		if (!touch) { return; }

		removeTouch(template.identifier);
	}

	function removeTouch(identifier) {
		remove(document, '.' + identifier, touchmove);
		remove(document, '.' + identifier, touchend);
	}


	// Logic for deciding when to trigger a movestart.

	function checkThreshold(e, template, touch, fn) {
		var distX = touch.pageX - template.startX,
		    distY = touch.pageY - template.startY;

		// Do nothing if the threshold has not been crossed.
		if ((distX * distX) + (distY * distY) < (threshold * threshold)) { return; }

		triggerStart(e, template, touch, distX, distY, fn);
	}

	function handled() {
		// this._handled should return false once, and after return true.
		this._handled = returnTrue;
		return false;
	}

	function flagAsHandled(e) {
		e._handled();
	}

	function triggerStart(e, template, touch, distX, distY, fn) {
		var node = template.target,
		    touches, time;

		touches = e.targetTouches;
		time = e.timeStamp - template.timeStamp;

		// Create a movestart object with some special properties that
		// are passed only to the movestart handlers.
		template.type = 'movestart';
		template.distX = distX;
		template.distY = distY;
		template.deltaX = distX;
		template.deltaY = distY;
		template.pageX = touch.pageX;
		template.pageY = touch.pageY;
		template.velocityX = distX / time;
		template.velocityY = distY / time;
		template.targetTouches = touches;
		template.finger = touches ?
			touches.length :
			1 ;

		// The _handled method is fired to tell the default movestart
		// handler that one of the move events is bound.
		template._handled = handled;
			
		// Pass the touchmove event so it can be prevented if or when
		// movestart is handled.
		template._preventTouchmoveDefault = function() {
			e.preventDefault();
		};

		// Trigger the movestart event.
		trigger(template.target, template);

		// Unbind handlers that tracked the touch or mouse up till now.
		fn(template.identifier);
	}


	// Handlers that control what happens following a movestart

	function activeMousemove(e) {
		var timer = e.data.timer;

		e.data.touch = e;
		e.data.timeStamp = e.timeStamp;
		timer.kick();
	}

	function activeMouseend(e) {
		var event = e.data.event,
		    timer = e.data.timer;
		
		removeActiveMouse();

		endEvent(event, timer, function() {
			// Unbind the click suppressor, waiting until after mouseup
			// has been handled.
			setTimeout(function(){
				remove(event.target, 'click', returnFalse);
			}, 0);
		});
	}

	function removeActiveMouse(event) {
		remove(document, mouseevents.move, activeMousemove);
		remove(document, mouseevents.end, activeMouseend);
	}

	function activeTouchmove(e) {
		var event = e.data.event,
		    timer = e.data.timer,
		    touch = changedTouch(e, event);

		if (!touch) { return; }

		// Stop the interface from gesturing
		e.preventDefault();

		event.targetTouches = e.targetTouches;
		e.data.touch = touch;
		e.data.timeStamp = e.timeStamp;
		timer.kick();
	}

	function activeTouchend(e) {
		var event = e.data.event,
		    timer = e.data.timer,
		    touch = identifiedTouch(e.changedTouches, event.identifier);

		// This isn't the touch you're looking for.
		if (!touch) { return; }

		removeActiveTouch(event);
		endEvent(event, timer);
	}

	function removeActiveTouch(event) {
		remove(document, '.' + event.identifier, activeTouchmove);
		remove(document, '.' + event.identifier, activeTouchend);
	}


	// Logic for triggering move and moveend events

	function updateEvent(event, touch, timeStamp, timer) {
		var time = timeStamp - event.timeStamp;

		event.type = 'move';
		event.distX =  touch.pageX - event.startX;
		event.distY =  touch.pageY - event.startY;
		event.deltaX = touch.pageX - event.pageX;
		event.deltaY = touch.pageY - event.pageY;
		
		// Average the velocity of the last few events using a decay
		// curve to even out spurious jumps in values.
		event.velocityX = 0.3 * event.velocityX + 0.7 * event.deltaX / time;
		event.velocityY = 0.3 * event.velocityY + 0.7 * event.deltaY / time;
		event.pageX =  touch.pageX;
		event.pageY =  touch.pageY;
	}

	function endEvent(event, timer, fn) {
		timer.end(function(){
			event.type = 'moveend';

			trigger(event.target, event);
			
			return fn && fn();
		});
	}


	// jQuery special event definition

	function setup(data, namespaces, eventHandle) {
		// Stop the node from being dragged
		//add(this, 'dragstart.move drag.move', preventDefault);
		
		// Prevent text selection and touch interface scrolling
		//add(this, 'mousedown.move', preventIgnoreTags);
		
		// Tell movestart default handler that we've handled this
		add(this, 'movestart.move', flagAsHandled);

		// Don't bind to the DOM. For speed.
		return true;
	}
	
	function teardown(namespaces) {
		remove(this, 'dragstart drag', preventDefault);
		remove(this, 'mousedown touchstart', preventIgnoreTags);
		remove(this, 'movestart', flagAsHandled);
		
		// Don't bind to the DOM. For speed.
		return true;
	}
	
	function addMethod(handleObj) {
		// We're not interested in preventing defaults for handlers that
		// come from internal move or moveend bindings
		if (handleObj.namespace === "move" || handleObj.namespace === "moveend") {
			return;
		}
		
		// Stop the node from being dragged
		add(this, 'dragstart.' + handleObj.guid + ' drag.' + handleObj.guid, preventDefault, undefined, handleObj.selector);
		
		// Prevent text selection and touch interface scrolling
		add(this, 'mousedown.' + handleObj.guid, preventIgnoreTags, undefined, handleObj.selector);
	}
	
	function removeMethod(handleObj) {
		if (handleObj.namespace === "move" || handleObj.namespace === "moveend") {
			return;
		}
		
		remove(this, 'dragstart.' + handleObj.guid + ' drag.' + handleObj.guid);
		remove(this, 'mousedown.' + handleObj.guid);
	}
	
	jQuery.event.special.movestart = {
		setup: setup,
		teardown: teardown,
		add: addMethod,
		remove: removeMethod,

		_default: function(e) {
			var event, data;
			
			// If no move events were bound to any ancestors of this
			// target, high tail it out of here.
			if (!e._handled()) { return; }

			function update(time) {
				updateEvent(event, data.touch, data.timeStamp);
				trigger(e.target, event);
			}

			event = {
				target: e.target,
				startX: e.startX,
				startY: e.startY,
				pageX: e.pageX,
				pageY: e.pageY,
				distX: e.distX,
				distY: e.distY,
				deltaX: e.deltaX,
				deltaY: e.deltaY,
				velocityX: e.velocityX,
				velocityY: e.velocityY,
				timeStamp: e.timeStamp,
				identifier: e.identifier,
				targetTouches: e.targetTouches,
				finger: e.finger
			};

			data = {
				event: event,
				timer: new Timer(update),
				touch: undefined,
				timeStamp: undefined
			};
			
			if (e.identifier === undefined) {
				// We're dealing with a mouse
				// Stop clicks from propagating during a move
				add(e.target, 'click', returnFalse);
				add(document, mouseevents.move, activeMousemove, data);
				add(document, mouseevents.end, activeMouseend, data);
			}
			else {
				// We're dealing with a touch. Stop touchmove doing
				// anything defaulty.
				e._preventTouchmoveDefault();
				add(document, touchevents.move + '.' + e.identifier, activeTouchmove, data);
				add(document, touchevents.end + '.' + e.identifier, activeTouchend, data);
			}
		}
	};

	jQuery.event.special.move = {
		setup: function() {
			// Bind a noop to movestart. Why? It's the movestart
			// setup that decides whether other move events are fired.
			add(this, 'movestart.move', jQuery.noop);
		},
		
		teardown: function() {
			remove(this, 'movestart.move', jQuery.noop);
		}
	};
	
	jQuery.event.special.moveend = {
		setup: function() {
			// Bind a noop to movestart. Why? It's the movestart
			// setup that decides whether other move events are fired.
			add(this, 'movestart.moveend', jQuery.noop);
		},
		
		teardown: function() {
			remove(this, 'movestart.moveend', jQuery.noop);
		}
	};

	add(document, 'mousedown.move', mousedown);
	add(document, 'touchstart.move', touchstart);

	// Make jQuery copy touch event properties over to the jQuery event
	// object, if they are not already listed. But only do the ones we
	// really need. IE7/8 do not have Array#indexOf(), but nor do they
	// have touch events, so let's assume we can ignore them.
	if (typeof Array.prototype.indexOf === 'function') {
		(function(jQuery, undefined){
			var props = ["changedTouches", "targetTouches"],
			    l = props.length;
			
			while (l--) {
				if (jQuery.event.props.indexOf(props[l]) === -1) {
					jQuery.event.props.push(props[l]);
				}
			}
		})(jQuery);
	};
});

var nav = {
    debug: false,

    // A switch to keep track of whether a user is engaged
    engaged: false,

    // Dimensions of the screen viewport
    sWidth: window.innerWidth,
    sHeight: window.innerHeight,

    // Dimensions of the Kinect viewport
    kWidth: 512,
    kHeight: 424,

    // Location of the user's spine base
    uSpineX: null,
    uSpineY: null,

    // Dimensions of the user viewport
    uWidth: null,
    uHeight: null,

    init: function() {
        nav.overlay = new Kinetic.Stage({
            container: 'nav',
            width: document.querySelector("#nav").offsetWidth,
            height: document.querySelector("#nav").offsetHeight
        });

        if (nav.debug === true) {
            nav.userViewLayer = new Kinetic.Layer();
            nav.kinectViewLayer = new Kinetic.Layer();
            nav.screenViewLayer = new Kinetic.Layer();
        }
    },

    setScreenView: function(x, y) {
        nav.sWidth = x;
        nav.sHeight = y;
    },

    setKinectView: function(x, y) {
        nav.kWidth = x;
        nav.kHeight = y;
    },

    setUserSpineBase: function(x, y) {
        nav.uSpineX = x;
        nav.uSpineY = y;
    },

    setUserView: function(x, y) {
        nav.uWidth = x;
        nav.uHeight = y;

        nav.uxMin = nav.uSpineX - nav.uWidth / 2;
        nav.uxMax = nav.uSpineX + nav.uWidth / 2;
        nav.uyMin = nav.uSpineY - nav.uHeight;
        nav.uyMax = nav.uSpineY;
    },

    drawKinectView: function() {
        nav.kinectView = new Kinetic.Rect({
            x: nav.sWidth / 2 - nav.kWidth / 2,
            y: nav.sHeight / 2 - nav.kHeight / 2,
            width: nav.kWidth,
            height: nav.kHeight,
            stroke: "#444",
            strokeWidth: 1.618,
        });

        nav.kinectViewLabel = new Kinetic.Text({
            x: nav.sWidth / 2 - nav.kWidth / 2,
            y: nav.sHeight / 2 + nav.kHeight / 2 + 5,
            width: nav.kWidth,
            align: "right",
            text: "Kinect Viewport\n" + nav.kWidth + "x" + nav.kHeight,
            fontSize: 14,
            fill: "#444"
        });

        // Draw the Kinect viewport on-screen
        nav.kinectViewLayer.add(nav.kinectView).add(nav.kinectViewLabel);
        nav.overlay.add(nav.kinectViewLayer);
    },

    drawUserView: function() {
        nav.userView = new Kinetic.Rect({
            x: nav.uSpineX - nav.uWidth / 2 + nav.kinectView.getX(),
            y: nav.uSpineY - nav.uHeight + nav.kinectView.getY(),
            width: nav.uWidth,
            height: nav.uHeight,
            stroke: "#444",
            strokeWidth: 1.618
        });

        nav.userSpineBase = new Kinetic.Circle({
            x: nav.uSpineX + nav.kinectView.getX(),
            y: nav.uSpineY + nav.kinectView.getY(),
            radius: 8.09,
            fill: "#444"
        });

        nav.userSpineConnector = new Kinetic.Line({
            points: [nav.userSpineBase.getX(), nav.userSpineBase.getY(), nav.screenSpineBase.getX(), nav.screenSpineBase.getY()],
            stroke: "#444",
            strokeWidth: 1.618,
            lineJoin: "round",
            dash: [10, 5]
        });

        nav.userViewLabel = new Kinetic.Text({
            x: nav.uSpineX - nav.uWidth / 2 + nav.kinectView.getX(),
            y: nav.uSpineY + nav.kinectView.getY() + 5,
            width: nav.uWidth,
            align: "right",
            text: "User Viewport\n" + nav.uWidth + "x" + nav.uHeight,
            fontSize: 14,
            fill: "#444"
        });

        // Draw the user viewport box on-screen
        nav.userViewLayer.add(nav.userView).add(nav.userSpineBase).add(nav.userSpineConnector).add(nav.userViewLabel);
        nav.overlay.add(nav.userViewLayer);
    },

    updateUserView: function() {
        nav.userView.setX(nav.uSpineX - nav.uWidth / 2 + nav.kinectView.getX());
        nav.userView.setY(nav.uSpineY - nav.uHeight + nav.kinectView.getY());
        nav.userView.setWidth(nav.uWidth);
        nav.userView.setHeight(nav.uHeight);

        nav.userSpineBase.setX(nav.uSpineX + nav.kinectView.getX());
        nav.userSpineBase.setY(nav.uSpineY + nav.kinectView.getY());

        nav.userSpineConnector.setPoints([nav.userSpineBase.getX(), nav.userSpineBase.getY(), nav.screenSpineBase.getX(), nav.screenSpineBase.getY()]);

        nav.userViewLabel.setX(nav.uSpineX - nav.uWidth / 2 + nav.kinectView.getX());
        nav.userViewLabel.setY(nav.uSpineY + nav.kinectView.getY() + 5);
        nav.userViewLabel.setWidth(nav.uWidth);
        nav.userViewLabel.setText("User Viewport\n" + nav.uWidth + "x" + nav.uHeight);

        nav.userViewLayer.batchDraw();
    },

    drawScreenView: function() {
        nav.screenSpineBase = new Kinetic.Circle({
            x: nav.sWidth / 2,
            y: nav.sHeight,
            radius: 11.326,
            fill: "#444"
        });

        nav.screenViewLabel = new Kinetic.Text({
            x: 0,
            y: nav.sHeight - 30,
            width: nav.sWidth - 10,
            align: "right",
            text: "Screen Viewport\n" + nav.sWidth + "x" + nav.sHeight,
            fontSize: 14,
            fill: "#444"
        });

        nav.screenViewLayer.add(nav.screenSpineBase).add(nav.screenViewLabel);
        nav.overlay.add(nav.screenViewLayer);
    }
}

var ws = {
    debug: false,

    socketAddress: "ws://localhost:1620/KinectApp",
    connectionAttempts: 1,
    frameData: [],

    init: function() {
        try {
            var connection = new WebSocket(this.socketAddress);
        } catch (err) {
            void 0;
        }

        connection.onopen = function() {
            // Reset the tries back to 1 since we have a new connection opened
            ws.connectionAttempts = 1;

            // Initialize the navigation overlay
            nav.init();

            if (ws.debug === true) {
                nav.drawKinectView();
                nav.drawScreenView();
                nav.drawUserView();
            }

            // Draw the cursor reticules on the overlay
            cursor.init();

            // Initialize gesture detection
            gesture.init();
        }

        connection.onmessage = function(packet) {
            if (typeof(packet.data) === "string") {
                // Parse the JSON
                var data = JSON.parse(packet.data);

                // Push the new frame onto the stack (for reference)
                ws.frameData.push(data);

                // Update the location of the user's spine base
                nav.setUserSpineBase(data.sx, data.sy);

                // Update the dimensions of the user viewport
                nav.setUserView(data.screenw, data.screenh);

                if (ws.debug === true) {
                    // Update the user view
                    nav.updateUserView();
                }

                gesture.setSwipeState(data.swipeval);

                // Update the left-hand data and draw it
                cursor.setLeftHand(data.lx, data.ly);
                gesture.setLeftHand(data.lhandState);

                // Update the right-hand data and draw it
                cursor.setRightHand(data.rx, data.ry);
                gesture.setRightHand(data.rhandState);

                // Pass control to the gesture detection state machine
                gesture.process();
            }
        }

        connection.onclose = function() {
            var time = ws.generateInterval(ws.connectionAttempts);

            setTimeout(function() {
                // We've tried to reconnect so increment the attempt counter
                ws.connectionAttempts++;

                // Connection has closed so try to reconnect every 10 seconds
                ws.init();
            }, time);
        }
    },

    generateInterval: function(k) {
        var maxInterval = (Math.pow(2, k) - 1) * 5000;

        // If the generated interval is more than 30 seconds, truncate it down to 30 seconds
        if (maxInterval > 30 * 5000) {
            maxInterval = 30 * 5000;
        }

        // Generate the interval as a random number between 0 and the maxInterval determined from above
        return Math.random() * maxInterval;
    },

    drawInitGuide: function() {

    }
}

// Start the server when Shift + C is pressed
Mousetrap.bind('shift+c', function() {
    ws.init();
});
