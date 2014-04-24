var cursor = {
    open_radius: 25,
    grab_radius: 15.45,
    pull_radius: 9.55,
    point_radius: 5.9,

    init: function() {
        var leftCursorLayer = new Kinetic.Layer(),
            rightCursorLayer = new Kinetic.Layer();

        var leftCursor = new Kinetic.Circle({
            x: nav.sWidth / 3,
            y: nav.sHeight / 2,
            radius: cursor.open_radius,
            fill: "#d33682",
        });

        var rightCursor = new Kinetic.Circle({
            x: nav.sWidth * 2 / 3,
            y: nav.sHeight / 2,
            radius: cursor.open_radius,
            fill: "#6c71c4",
        });

        // Add each cursor reticule to its respective layer
        leftCursorLayer.add(leftCursor);
        rightCursorLayer.add(rightCursor);

        // Add both layers to the navigation overlay
        nav.overlay.add(leftCursorLayer).add(rightCursorLayer);
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
