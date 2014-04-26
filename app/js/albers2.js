var stage2 = {
    width: document.getElementById("container2").offsetWidth,
    height: document.getElementById("container2").offsetHeight,

    big_width: 0.3 * document.getElementById("container2").offsetWidth,
    half_width: 0.5 * document.getElementById("container2").offsetWidth,
    box_width: 0.1 * document.getElementById("container2").offsetWidth,

    init: function() {
        stage2.stage = new Kinetic.Stage({
            container: 'container2',
            width: stage2.width,
            height: stage2.height
        });

        stage2.leftDragLayer = new Kinetic.Layer(),
        stage2.rightDragLayer = new Kinetic.Layer(),
        stage2.background = new Kinetic.Layer();


        stage2.background_left = new Kinetic.Rect({
            x: 0,
            y: 0,
            width: stage2.half_width,
            height: stage2.height,
            fill: "#AEE60B"
        });

        stage2.background_right = new Kinetic.Rect({
            x: (stage2.width - stage2.half_width),
            y: 0,
            width: stage2.half_width,
            height: stage2.height,
            fill: "#B97E16"
        });

        stage2.left_box = new Kinetic.Rect({
            x: (stage2.big_width - stage2.box_width),
            y: (stage2.height / 2 - stage2.box_width / 2),
            width: stage2.box_width,
            height: stage2.box_width,
            fill: '#A0CA36',
            draggable: true
        });

        stage2.right_box = new Kinetic.Rect({
            x: (stage2.width - stage2.big_width),
            y: (stage2.height / 2 - stage2.box_width / 2),
            width: stage2.box_width,
            height: stage2.box_width,
            fill: '#A0CA36',
            draggable: true
        });

        stage2.left_box.on('mouseover', function() {
            document.body.style.cursor = 'pointer';
        });
        stage2.left_box.on('mouseout', function() {
            document.body.style.cursor = 'default';
        });

        stage2.right_box.on('mouseover', function() {
            document.body.style.cursor = 'pointer';
        });
        stage2.right_box.on('mouseout', function() {
            document.body.style.cursor = 'default';
        });

        stage2.background.add(stage2.background_left).add(stage2.background_right);

        stage2.leftDragLayer.add(stage2.left_box);
        stage2.rightDragLayer.add(stage2.right_box);

        stage2.stage.add(stage2.background).add(stage2.leftDragLayer).add(stage2.rightDragLayer);
    },

    updateLeftBox: function(x, y) {
        stage2.left_box.setX(x);
        stage2.left_box.setY(y);

        stage2.leftDragLayer.batchDraw();
    },

    updateRightBox: function(x, y) {
        stage2.right_box.setX(x);
        stage2.right_box.setY(y);

        stage2.rightDragLayer.batchDraw();
    }
}
