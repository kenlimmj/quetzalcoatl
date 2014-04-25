var cursor = {
    debug: false,

    // Initialize holder values for the cursor coordinates
    leftX: null,
    leftY: null,
    rightX: null,
    rightY: null,

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
        cursor.leftCursorLayer.add(cursor.leftScreenCursor);
        cursor.rightCursorLayer.add(cursor.rightScreenCursor);

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

        cursor.leftScreenCursor.setX(mappedLeftCursor[0]);
        cursor.leftScreenCursor.setY(mappedLeftCursor[1]);
        cursor.leftScreenCursor.setRadius(cursor.get_radius(gesture.leftHand));

        if (cursor.debug === true) {
            cursor.leftScreenCursorLabel.setX(cursor.leftScreenCursor.getX() + cursor.leftScreenCursor.radius());
            cursor.leftScreenCursorLabel.setY(cursor.leftScreenCursor.getY() + cursor.leftScreenCursor.radius());
            cursor.leftScreenCursorLabel.setText(gesture.leftHand + "\n" + cursor.leftScreenCursor.getX() + "\n" + cursor.leftScreenCursor.getY());

            cursor.leftUserCursor.setX(cursor.leftX + nav.kinectView.getX());
            cursor.leftUserCursor.setY(cursor.leftY + nav.kinectView.getY());

            cursor.leftUserCursorLabel.setX(cursor.leftUserCursor.getX() + cursor.leftUserCursor.radius());
            cursor.leftUserCursorLabel.setY(cursor.leftUserCursor.getY() + cursor.leftUserCursor.radius());
            cursor.leftUserCursorLabel.setText(cursor.leftX + "\n" + cursor.leftY);

            cursor.leftCursorConnector.setPoints([cursor.leftUserCursor.getX(), cursor.leftUserCursor.getY(), cursor.leftScreenCursor.getX(), cursor.leftScreenCursor.getY()]);
        }

        cursor.leftCursorLayer.batchDraw();
    },

    updateRightHand: function() {
        var mappedRightCursor = cursor.map(cursor.rightX, cursor.rightY);

        cursor.rightScreenCursor.setX(mappedRightCursor[0]);
        cursor.rightScreenCursor.setY(mappedRightCursor[1]);
        cursor.rightScreenCursor.setRadius(cursor.get_radius(gesture.rightHand));

        if (cursor.debug === true) {
            cursor.rightScreenCursorLabel.setX(cursor.rightScreenCursor.getX() + cursor.rightScreenCursor.radius());
            cursor.rightScreenCursorLabel.setY(cursor.rightScreenCursor.getY() + cursor.rightScreenCursor.radius());
            cursor.rightScreenCursorLabel.setText(gesture.rightHand + "\n" + cursor.rightScreenCursor.getX() + "\n" + cursor.rightScreenCursor.getY());

            cursor.rightUserCursor.setX(cursor.rightX + nav.kinectView.getX());
            cursor.rightUserCursor.setY(cursor.rightY + nav.kinectView.getY());

            cursor.rightUserCursorLabel.setX(cursor.rightUserCursor.getX() + cursor.rightUserCursor.radius());
            cursor.rightUserCursorLabel.setY(cursor.rightUserCursor.getY() + cursor.rightUserCursor.radius());
            cursor.rightUserCursorLabel.setText(cursor.rightX + "\n" + cursor.rightY);

            cursor.rightCursorConnector.setPoints([cursor.rightUserCursor.getX(), cursor.rightUserCursor.getY(), cursor.rightScreenCursor.getX(), cursor.rightScreenCursor.getY()]);
        }

        cursor.rightCursorLayer.batchDraw();
    }
}
