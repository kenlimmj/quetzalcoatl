var nav = {
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

        nav.userViewLayer = new Kinetic.Layer();
        nav.kinectViewLayer = new Kinetic.Layer();
        nav.screenViewLayer = new Kinetic.Layer();
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
        nav.uyMax = nav.uHeight;
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
