var cursor = {
    leftX: null,
    leftY: null,
    rightX: null,
    rightY: null,

    // FIXME: Test values that will be deleted eventually
    leftX: 150,
    leftY: 200,
    rightX: 300,
    rightY: 200,

    open_radius: 25,
    grab_radius: 15.45,
    pull_radius: 9.55,
    point_radius: 5.9,

    init: function() {
        var leftCursorLayer = new Kinetic.Layer(),
            rightCursorLayer = new Kinetic.Layer();

        var mappedLeftCursor = cursor.map(cursor.leftX, cursor.leftY),
            mappedRightCursor = cursor.map(cursor.rightX, cursor.rightY);

        var leftScreenCursor = new Kinetic.Circle({
            x: mappedLeftCursor[0],
            y: mappedLeftCursor[1],
            radius: cursor.open_radius,
            fill: "#d33682"
        });

        var leftUserCursor = new Kinetic.Circle({
            x: cursor.leftX,
            y: cursor.leftY,
            radius: cursor.open_radius,
            fill: "#d33682"
        });

        var rightScreenCursor = new Kinetic.Circle({
            x: mappedRightCursor[0],
            y: mappedRightCursor[1],
            radius: cursor.open_radius,
            fill: "#6c71c4"
        });

        var rightUserCursor = new Kinetic.Circle({
            x: cursor.rightX,
            y: cursor.rightY,
            radius: cursor.open_radius,
            fill: "#6c71c4"
        });

        // Add each cursor reticule to its respective layer
        leftCursorLayer.add(leftScreenCursor).add(leftUserCursor);
        rightCursorLayer.add(rightScreenCursor).add(rightUserCursor);

        // Add both layers to the navigation overlay
        nav.overlay.add(leftCursorLayer).add(rightCursorLayer);
    },

    setLeftCursor: function(x, y) {
        cursor.leftX = x;
        cursor.leftY = y;
    },

    setRightCursor: function(x, y) {
        cursor.rightX = x;
        cursor.rightY = y;
    },

    get_radius: function(handState) {
        switch (handState) {
            case "open":
                return cursor.open_radius;
            case "grab":
                return cursor.grab_radius;
            case "pull":
                return cursor.pull_radius;
            case "point":
                return cursor.point_radius;
            default:
                return cursor.open_radius;
        }
    },

    get_threshold: function(handState) {
        switch (handState) {
            case "open":
                return 1 / 100
            case "grab":
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

        return [screenX, screenY];
    },

    update: function(x, y, handSide) {
        // Map the coordinates from the user viewport to the screen viewport
        sCoord = cursor.map(x, y);

        // Stuff here to move the cursor on its layer
    }
}
