var stage2Init = function() {
    var width = document.getElementById("container2").offsetWidth,
        height = document.getElementById("container2").offsetHeight;

    var big_width = 0.3 * width,
        half_width = 0.5 * width,
        box_width = 0.1 * width;

    var stage = new Kinetic.Stage({
        container: 'container2',
        width: width,
        height: height
    });

    var leftDragLayer = new Kinetic.Layer(),
        rightDragLayer = new Kinetic.Layer(),
        background = new Kinetic.Layer();

    var background_left = new Kinetic.Rect({
        x: 0,
        y: 0,
        width: half_width,
        height: height,
        fill: "#AEE60B"
    });

    var background_right = new Kinetic.Rect({
        x: (width - half_width),
        y: 0,
        width: half_width,
        height: height,
        fill: "#B97E16"
    });

    var left_box = new Kinetic.Rect({
        x: (big_width - box_width),
        y: (height / 2 - box_width / 2),
        width: box_width,
        height: box_width,
        fill: '#A0CA36',
        draggable: true
    });

    var right_box = new Kinetic.Rect({
        x: (width - big_width),
        y: (height / 2 - box_width / 2),
        width: box_width,
        height: box_width,
        fill: '#A0CA36',
        draggable: true
    });

    left_box.on('mouseover', function() {
        document.body.style.cursor = 'pointer';
    });
    left_box.on('mouseout', function() {
        document.body.style.cursor = 'default';
    });

    right_box.on('mouseover', function() {
        document.body.style.cursor = 'pointer';
    });
    right_box.on('mouseout', function() {
        document.body.style.cursor = 'default';
    });

    background.add(background_left).add(background_right);

    leftDragLayer.add(left_box);
    rightDragLayer.add(right_box);

    stage.add(background).add(leftDragLayer).add(rightDragLayer);
}
