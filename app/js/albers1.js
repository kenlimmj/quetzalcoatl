var stage1Init = function() {
    var width = document.getElementById("container1").offsetWidth,
        height = document.getElementById("container1").offsetHeight;

    var big_width = 0.3 * width,
        small_width = 0.2 * width,
        box_width = 0.1 * width;

    var stage = new Kinetic.Stage({
        container: 'container1',
        width: width,
        height: height
    });

    var leftDragLayer = new Kinetic.Layer(),
        rightDragLayer = new Kinetic.Layer(),
        background = new Kinetic.Layer();

    var background_left = new Kinetic.Rect({
        x: 0,
        y: 0,
        width: big_width,
        height: height,
        fill: "#FF8601"
    });

    var background_right = new Kinetic.Rect({
        x: (width - big_width),
        y: 0,
        width: big_width,
        height: height,
        fill: "#418BB5"
    });

    var middle_left = new Kinetic.Rect({
        x: big_width,
        y: 0,
        width: small_width,
        height: height,
        fill: "#FFF724"
    });

    var middle_right = new Kinetic.Rect({
        x: (width - big_width - small_width),
        y: 0,
        width: small_width,
        height: height,
        fill: "#2B2C67"
    });

    var left_box = new Kinetic.Rect({
        x: (big_width - box_width),
        y: (height / 2 - box_width / 2),
        width: box_width,
        height: box_width,
        fill: '#AC5B0E',
        draggable: true
    });

    var right_box = new Kinetic.Rect({
        x: (width - big_width),
        y: (height / 2 - box_width / 2),
        width: box_width,
        height: box_width,
        fill: '#AC5B0E',
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

    background.add(background_left).add(background_right).add(middle_left).add(middle_right);

    leftDragLayer.add(left_box);
    rightDragLayer.add(right_box);

    stage.add(background).add(leftDragLayer).add(rightDragLayer);
}
