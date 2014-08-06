var CursorInterface = (function() {
    var openRadius = 25,
        grabRadius = 15.45,
        pointRadius = 5.9,
        labelAlignment = "left",
        strokeFill = "#444",
        strokeWidth = 1.618,
        textFamily = "Source Sans Pro",
        textFill = "#444",
        textSize = 0.75 * window.innerWidth / 100;

    var colors = Please.make_scheme(Please.make_color({
        format: 'hsv'
    }), {
        scheme_type: 'complement'
    });

    var leftReticuleFill = colors[0],
        rightReticuleFill = colors[1];

    var map = function(appInterface, userInterface, rawCoord) {
        if (rawCoord.x < userInterface.spineBase.x - userInterface.viewport.width / 2) {
            screenX = 0;
        } else if (rawCoord.x > userInterface.spineBase.x + userInterface.viewport.width / 2) {
            screenX = appInterface.viewport.width;
        } else {
            screenX = (rawCoord.x - (userInterface.spineBase.x - userInterface.viewport.width / 2)) / userInterface.viewport.width * appInterface.viewport.width;
        }

        if (rawCoord.y < userInterface.spineBase.y - userInterface.viewport.height) {
            screenY = 0;
        } else if (rawCoord.y > userInterface.spineBase.y) {
            screenY = appInterface.viewport.height;
        } else {
            screenY = (rawCoord.y - (userInterface.spineBase.y - userInterface.viewport.height)) / userInterface.viewport.height * appInterface.viewport.height;
        }

        return {
            x: Math.round(screenX),
            y: Math.round(screenY)
        };
    }

    var stabilize = function(x, factor) {
        return x - (x % factor) + (x % factor > 0 && factor);
    }

    var CursorInterface = function(appInterface, kinectInterface, userInterface) {
        var _ = this;

        _.viewport = appInterface.viewport || {
            width: window.innerWidth,
            height: window.innerHeight
        };

        _.leftHand = {
            rawCoord: {
                x: userInterface.viewport.width / 3,
                y: userInterface.viewport.height / 2
            },
            draw: true,
            lockX: false,
            lockY: false
        };

        _.rightHand = {
            rawCoord: {
                x: 2 * userInterface.viewport.width / 3,
                y: userInterface.viewport.height / 2
            },
            draw: true,
            lockX: false,
            locKY: false
        };

        if (Util.supportsImports()) {
            var overlayLink = Util.insertImportLink('kinectCursorOverlay');

            overlayLink.onload = function() {
                if (document.getElementsByTagName('kinect-cursor-overlay').length === 0) {
                    var overlayTemplate = Util.registerTemplate('kinect-cursor-overlay', 'kinectCursorOverlay'),
                        kinectCursorOverlay = new overlayTemplate();

                    document.body.insertBefore(kinectCursorOverlay, document.getElementById('kinectUserOverlay'));
                } else {
                    var kinectCursorOverlay = document.getElementsByTagName('kinect-cursor-overlay')[0];
                }

                kinectCursorOverlay.id = 'kinectCursorOverlay';

                _.overlay = new Kinetic.Stage({
                    container: 'cursor-overlay',
                    width: _.viewport.width,
                    height: _.viewport.height
                });

                var leftCursorLayer = new Kinetic.Layer(),
                    rightCursorLayer = new Kinetic.Layer();

                leftCursorLayer.canvas.pixelRatio = window.devicePixelRatio;
                rightCursorLayer.canvas.pixelRatio = window.devicePixelRatio;

                _.leftHand.mappedCoord = map(appInterface, userInterface, _.leftHand.rawCoord);
                _.rightHand.mappedCoord = map(appInterface, userInterface, _.rightHand.rawCoord);

                var leftScreenReticule = new Kinetic.Circle({
                    x: _.leftHand.mappedCoord.x,
                    y: _.leftHand.mappedCoord.y,
                    radius: openRadius,
                    fill: leftReticuleFill
                });

                var leftScreenReticuleLabel = new Kinetic.Text({
                    x: _.leftHand.mappedCoord.x + openRadius,
                    y: _.leftHand.mappedCoord.y + openRadius,
                    text: "x: " + _.leftHand.mappedCoord.x + "\n" + "y: " + _.leftHand.mappedCoord.y,
                    align: labelAlignment,
                    fontSize: textSize,
                    fontFamily: textFamily,
                    fill: leftReticuleFill
                });

                var rightScreenReticule = new Kinetic.Circle({
                    x: _.rightHand.mappedCoord.x,
                    y: _.rightHand.mappedCoord.y,
                    radius: openRadius,
                    fill: rightReticuleFill
                });

                var rightScreenReticuleLabel = new Kinetic.Text({
                    x: _.rightHand.mappedCoord.x + openRadius,
                    y: _.rightHand.mappedCoord.y + openRadius,
                    text: "x: " + _.rightHand.mappedCoord.x + "\n" + "y: " + _.rightHand.mappedCoord.y,
                    align: labelAlignment,
                    fontSize: textSize,
                    fontFamily: textFamily,
                    fill: rightReticuleFill
                });

                var leftUserReticule = new Kinetic.Circle({
                    x: _.leftHand.rawCoord.x + kinect.sensorBoundingBox.getX(),
                    y: _.leftHand.rawCoord.y + kinect.sensorBoundingBox.getY(),
                    radius: openRadius / 1.618,
                    fill: leftReticuleFill
                });

                var rightUserReticule = new Kinetic.Circle({
                    x: _.rightHand.rawCoord.x + kinect.sensorBoundingBox.getX(),
                    y: _.rightHand.rawCoord.y + kinect.sensorBoundingBox.getY(),
                    radius: openRadius / 1.618,
                    fill: rightReticuleFill
                });

                var leftReticuleConnector = new Kinetic.Line({
                    points: [_.leftHand.rawCoord.x + kinect.sensorBoundingBox.getX(), _.leftHand.rawCoord.y + kinect.sensorBoundingBox.getY(), _.leftHand.mappedCoord.x, _.leftHand.mappedCoord.y],
                    stroke: leftReticuleFill,
                    strokeWidth: strokeWidth,
                    lineJoin: "round",
                    dash: [10, 5]
                });

                var rightReticuleConnector = new Kinetic.Line({
                    points: [_.rightHand.rawCoord.x + kinect.sensorBoundingBox.getX(), _.rightHand.rawCoord.y + kinect.sensorBoundingBox.getY(), _.rightHand.mappedCoord.x, _.rightHand.mappedCoord.y],
                    stroke: rightReticuleFill,
                    strokeWidth: strokeWidth,
                    lineJoin: "round",
                    dash: [10, 5]
                });

                leftCursorLayer.add(leftScreenReticule, leftScreenReticuleLabel, leftUserReticule, leftReticuleConnector);
                rightCursorLayer.add(rightScreenReticule, rightScreenReticuleLabel, rightUserReticule, rightReticuleConnector);

                _.overlay.add(leftCursorLayer, rightCursorLayer);

                Object.observe(_.leftHand.rawCoord, function(changes) {
                    changes.forEach(function(change) {
                        _.leftHand.mappedCoord = map(appInterface, userInterface, change.object);

                        leftScreenReticule.setAbsolutePosition({
                            x: _.leftHand.mappedCoord.x,
                            y: _.leftHand.mappedCoord.y
                        });

                        leftUserReticule.setAbsolutePosition({
                            x: change.object.x + kinect.sensorBoundingBox.getX(),
                            y: change.object.y + kinect.sensorBoundingBox.getY()
                        });

                        leftReticuleConnector.setPoints([change.object.x + kinect.sensorBoundingBox.getX(), change.object.y + kinect.sensorBoundingBox.getY(), _.leftHand.mappedCoord.x, _.leftHand.mappedCoord.y]);

                        leftScreenReticuleLabel.setAbsolutePosition({
                            x: _.leftHand.mappedCoord.x + openRadius,
                            y: _.leftHand.mappedCoord.y + openRadius
                        });

                        leftScreenReticuleLabel.text("x: " + _.leftHand.mappedCoord.x + "\n" + "y: " + _.leftHand.mappedCoord.y);

                        leftCursorLayer.batchDraw();
                    });
                });

                Object.observe(_.rightHand.rawCoord, function(changes) {
                    changes.forEach(function(change) {
                        _.rightHand.mappedCoord = map(appInterface, userInterface, change.object);

                        rightScreenReticule.setAbsolutePosition({
                            x: _.rightHand.mappedCoord.x,
                            y: _.rightHand.mappedCoord.y
                        });

                        rightUserReticule.setAbsolutePosition({
                            x: change.object.x + kinect.sensorBoundingBox.getX(),
                            y: change.object.y + kinect.sensorBoundingBox.getY()
                        });

                        rightReticuleConnector.setPoints([change.object.x + kinect.sensorBoundingBox.getX(), change.object.y + kinect.sensorBoundingBox.getY(), _.rightHand.mappedCoord.x, _.rightHand.mappedCoord.y]);

                        rightScreenReticuleLabel.setAbsolutePosition({
                            x: _.rightHand.mappedCoord.x + openRadius,
                            y: _.rightHand.mappedCoord.y + openRadius
                        });

                        rightScreenReticuleLabel.text("x: " + _.rightHand.mappedCoord.x + "\n" + "y: " + _.rightHand.mappedCoord.y);

                        rightCursorLayer.batchDraw();
                    });
                });
            }
        }
    }

    CursorInterface.prototype = {
        setLeftHand: function(x, y) {
            this.leftHand.rawCoord.x = x;
            this.leftHand.rawCoord.y = y;

            return this.leftHand.rawCoord;
        },
        setRightHand: function(x, y) {
            this.rightHand.rawCoord.x = x;
            this.rightHand.rawCoord.y = y;

            return this.rightHand.rawCoord;
        },
        lockLeftHandX: function() {
            this.leftHand.lockX = true;

            return this.leftHand;
        },
        unlockLeftHandX: function() {
            this.leftHand.lockX = false;

            return this.leftHand;
        },
        lockLeftHandY: function() {
            this.leftHand.lockY = true;

            return this.leftHand;
        },
        unlockLeftHandY: function() {
            this.leftHand.lockY = false;

            return this.leftHand;
        },
        lockRightHandX: function() {
            this.rightHand.lockX = true;

            return this.rightHand;
        },
        unlockRightHandX: function() {
            this.rightHand.lockX = false;

            return this.rightHand;
        },
        lockRightHandY: function() {
            this.rightHand.lockY = true;

            return this.rightHand;
        },
        unlockRightHandY: function() {
            this.rightHand.lockY = false;

            return this.rightHand
        },
        showLeftHand: function() {
            this.leftHand.draw = true;

            return this.leftHand;
        },
        hideLeftHand: function() {
            this.leftHand.draw = false;

            return this.leftHand;
        },
        showRightHand: function() {
            this.rightHand.draw = true;

            return this.rightHand;
        },
        hideRightHand: function() {
            this.rightHand.draw = false;

            return this.rightHand;
        }
    }

    return CursorInterface;
})(CursorInterface || {});
