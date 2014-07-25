var Cursor = (function() {
    var debug = false,
        openRadius = 25,
        unknownRadius = openRadius * 1.618 * 1618,
        grabRadius = openRadius / 1.618,
        pointRadius = openRadius / 1.618 / 1.618 / 1.618,
        leftFill = "#d33682",
        rightFill = "#6c71c4",
        labelAlignment = "left",
        labelSize = 14,
        strokeWidth = 1.618;

    var leftHand = {
        x: null,
        y: null,
        lockX: false,
        lockY: false,
        draw: false,
        threshold: 0
    };

    var rightHand = {
        x: null,
        y: null,
        lockX: false,
        lockY: false,
        draw: false,
        threshold: 0
    };

    var stabilize = function(x, factor) {
        return x - (x % factor) + (x % factor > 0 && factor);
    }

    return {
        init: function() {
            leftHand.layer = new Kinetic.Layer();
            rightHand.layer = new Kinetic.Layer();

            var mappedLeftCursor = this.map(leftHand.x, leftHand.y),
                mappedRightCursor = this.map(rightHand.x, rightHand.y);

            leftHand.screenCursor = new Kinetic.Circle({
                x: mappedLeftCursor[0],
                y: mappedLeftCursor[1],
                radius: openRadius,
                fill: leftFill
            });

            rightHand.screenCursor = new Kinetic.Circle({
                x: mappedRightCursor[0],
                y: mappedRightCursor[1],
                radius: openRadius,
                fill: rightFill
            });

            if (debug) {
                leftHand.screenCursorLabel = new Kinetic.Text({
                    x: leftHand.screenCursor.getX() + leftHand.screenCursor.radius(),
                    y: leftHand.screenCursor.get(Y) + leftHand.screenCursor.radius(),
                    align: labelAlignment,
                    text: "x: " + leftHand.screenCursor.getX() + "\n" + "y: " + leftHand.screenCursor.getY(),
                    fontSize: labelSize,
                    fill: leftFill
                });

                rightHand.screenCursorLabel = new Kinetic.Text({
                    x: rightHand.screenCursor.getX() + rightHand.screenCursor.radius(),
                    y: rightHand.screenCursor.get(Y) + rightHand.screenCursor.radius(),
                    align: labelAlignment,
                    text: "x: " + rightHand.screenCursor.getX() + "\n" + "y: " + rightHand.screenCursor.getY(),
                    fontSize: labelSize,
                    fill: rightFill
                });

                leftHand.userCursor = new Kinetic.Circle({
                    x: leftHand.x + Nav.getKinectViewport().width,
                    y: leftHand.y + Nav.getKinectViewport().height,
                    radius: openRadius / 1.618,
                    fill: leftFill
                });

                leftHand.userCursorLabel = new Kinetic.Text({
                    x: leftHand.userCursor.getX() + leftHand.userCursor.radius(),
                    y: leftHand.userCursor.getY() + leftHand.userCursor.radius(),
                    align: labelAlignment,
                    text: "x: " + leftHand.userCursor.getX() + "\n" + "y: " + leftHand.userCursor.getY(),
                    fontSize: labelSize / 1.618,
                    fill: leftFill
                });

                rightHand.userCursor = new Kinetic.Circle({
                    x: rightHand.x + Nav.getKinectViewport().width,
                    y: rightHand.y + Nav.getKinectViewport().height,
                    radius: openRadius / 1.618,
                    fill: rightFill
                });

                rightHand.userCursorLabel = new Kinetic.Text({
                    x: rightHand.userCursor.getX() + rightHand.userCursor.radius(),
                    y: rightHand.userCursor.getY() + rightHand.userCursor.radius(),
                    align: labelAlignment,
                    text: "x: " + rightHand.userCursor.getX() + "\n" + "y: " + rightHand.userCursor.getY(),
                    fontSize: labelSize / 1.618,
                    fill: rightFill
                });

                leftHand.cursorConnector = new Kinetic.Line({
                    points: [leftHand.userCursor.getX(), leftHand.userCursor.getY(), leftHand.screenCursor.getX(), leftHand.screenCursor.getY()],
                    stroke: leftFill,
                    strokeWidth: strokeWidth,
                    lineJoin: "round",
                    dash: [10, 5]
                });

                rightHand.cursorConnector = new Kinetic.Line({
                    points: [rightHand.userCursor.getX(), rightHand.userCursor.getY(), rightHand.screenCursor.getX(), rightHand.screenCursor.getY()],
                    stroke: rightFill,
                    strokeWidth: strokeWidth,
                    lineJoin: "round",
                    dash: [10, 5]
                });
            }

            if (leftHand.draw) {
                leftHand.layer.add(leftHand.screenCursor);
            }
            if (rightHand.draw) {
                rightHand.layer.add(rightHand.screenCursor);
            }

            if (debug) {
                leftHand.layer
                    .add(leftHand.screenCursorLabel)
                    .add(leftHand.userCursor)
                    .add(leftHand.userCursorLabel)
                    .add(leftHand.cursorConnector);

                rightHand.layer
                    .add(rightHand.screenCursorLabel)
                    .add(rightHand.userCursor)
                    .add(rightHand.userCursorLabel)
                    .add(rightHand.cursorConnector);
            }

            if (Nav && Nav.overlay) {
                Nav.overlay
                    .add(leftHand.layer)
                    .add(rightHand.layer);
            }
        },
        getElement: function(x, y) {
            var e = this.map(x, y);

            return document.elementFromPoint(e[0], e[1]);
        },
        getRadius: function(handState) {
            switch (handState) {
                case "open":
                    return openRadius;
                    break;
                case "closed":
                    return grabRadius;
                    break;
                case "point":
                    return pointRadius;
                    break;
                default:
                    return unknownRadius;
                    break;
            }
        },
        map: function(x, y) {
            var userViewport = Nav.getUserViewport(),
                appViewport = Nav.getAppViewport();

            if (x < userViewport.xMin) {
                screenX = 0;
            } else if (x > userViewport.xMax) {
                screenX = appViewport.width;
            } else {
                screenX = (x - userViewport.xMin) / userViewport.width * appViewport.width;
            }

            if (y < userViewport.yMin) {
                screenY = 0;
            } else if (y > userViewport.yMax) {
                screenY = appViewport.height;
            } else {
                screenY = (y - userViewport.yMin) / userViewport.height * appViewport.height;
            }

            return [Math.round(screenX), Math.round(screenY)];
        },
        setLeftHand: function(x, y) {
            leftHand.x = x;
            leftHand.y = y;
        },
        setRightHand: function(x, y) {
            rightHand.x = x;
            rightHand.y = y;
        },
        updateLeftHand: function() {

        },
        updateRightHand: function() {

        },
        setDebugState: function(state) {
            debug = state;

            return debug;
        }
    }

})(Cursor || {});
