var stage1 = {
    width: document.getElementById("container1").offsetWidth,
    height: document.getElementById("container1").offsetHeight,

    big_width: 0.3 * document.getElementById("container1").offsetWidth,
    small_width: 0.2 * document.getElementById("container1").offsetWidth,
    box_width: 0.1 * document.getElementById("container1").offsetWidth,

    init: function() {
        stage1.stage = new Kinetic.Stage({
            container: 'container1',
            width: stage1.width,
            height: stage1.height
        });

        stage1.leftDragLayer = new Kinetic.Layer();
        stage1.rightDragLayer = new Kinetic.Layer();
        stage1.background = new Kinetic.Layer();

        stage1.background_left = new Kinetic.Rect({
            x: 0,
            y: 0,
            width: stage1.big_width,
            height: stage1.height,
            fill: "#FF8601"
        });

        stage1.background_right = new Kinetic.Rect({
            x: (stage1.width - stage1.big_width),
            y: 0,
            width: stage1.big_width,
            height: stage1.height,
            fill: "#418BB5"
        });

        stage1.middle_left = new Kinetic.Rect({
            x: stage1.big_width,
            y: 0,
            width: stage1.small_width,
            height: stage1.height,
            fill: "#FFF724"
        });

        stage1.middle_right = new Kinetic.Rect({
            x: (stage1.width - stage1.big_width - stage1.small_width),
            y: 0,
            width: stage1.small_width,
            height: stage1.height,
            fill: "#2B2C67"
        });

        stage1.left_box = new Kinetic.Rect({
            x: (stage1.big_width - stage1.box_width),
            y: (stage1.height / 2 - stage1.box_width / 2),
            width: stage1.box_width,
            height: stage1.box_width,
            fill: '#AC5B0E',
            draggable: true,
        });

        stage1.right_box = new Kinetic.Rect({
            x: (stage1.width - stage1.big_width),
            y: (stage1.height / 2 - stage1.box_width / 2),
            width: stage1.box_width,
            height: stage1.box_width,
            fill: '#AC5B0E',
            draggable: true,
        });

        stage1.left_box.on('mouseover', function() {
            document.body.style.cursor = 'pointer';
        });

        stage1.left_box.on('mouseout', function() {
            document.body.style.cursor = 'default';
        });

        stage1.right_box.on('mouseover', function() {
            document.body.style.cursor = 'pointer';
        });

        stage1.right_box.on('mouseout', function() {
            document.body.style.cursor = 'default';
        });

        stage1.background.add(stage1.background_left).add(stage1.background_right)
        stage1.background.add(stage1.middle_left).add(stage1.middle_right);

        stage1.leftDragLayer.add(stage1.left_box);
        stage1.rightDragLayer.add(stage1.right_box);

        stage1.stage.add(stage1.background).add(stage1.leftDragLayer).add(stage1.rightDragLayer);
    },

    updateLeftBox: function(x, y) {
        stage1.left_box.setX(x);
        stage1.left_box.setY(y);

        stage1.leftDragLayer.batchDraw();
    },

    updateRightBox: function(x, y) {
        stage1.right_box.setX(x);
        stage1.right_box.setY(y);

        stage1.rightDragLayer.batchDraw();
    }
}
