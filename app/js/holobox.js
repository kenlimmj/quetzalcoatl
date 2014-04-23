var Holobox = (function() {

    var world = document.getElementById('world'),
        back = document.getElementById('back'),
        front = document.getElementById('front'),
        wallLeft = document.getElementById('wall-left'),
        wallRight = document.getElementById('wall-right'),
        wallTop = document.getElementById('wall-top'),
        wallBottom = document.getElementById('wall-bottom'),

        orientation = 0,
        perspective = {
            cx: 50, // current x
            cy: 50, // current y
            tx: 50, // target x
            ty: 50 // target y
        };

    function initialize() {
        // Capture mouse movement for PC's
        addEventListener('mousemove', onMouseMove, false);

        update();
    }

    function onMouseMove(event) {
        perspective.tx = Math.round((event.clientX / window.innerWidth) * 100);
        perspective.ty = Math.round((event.clientY / window.innerHeight) * 100);
    }

    function update() {
        // Interpolate towards the target perspective
        perspective.cx += (perspective.tx - perspective.cx) * 0.1;
        perspective.cy += (perspective.ty - perspective.cy) * 0.1;

        // Apply the current perspective
        world.style.webkitPerspectiveOrigin = Math.max(29, Math.min(71, perspective.cx)) + '% ' + Math.max(13, Math.min(47, perspective.cy)) + '%';
        world.style.perspectiveOrigin = Math.min(47, perspective.cx) + '% ' + Math.min(14, perspective.cy) + '%';

        // Used to control z-indices of our elements, first item == bottom
        var stack = [back, wallLeft, wallRight, wallTop, wallBottom];

        // If we're looking in from the left, make sure the left wall is
        // positioned above all other elements
        if (perspective.cx < 25) {
            stack.push(wallLeft);
        }
        // ... on the other hand, if we're looking at the box from the
        // right side, make sure the right wall has the highest z-index
        else if (perspective.cx > 75) {
            stack.push(wallRight);
        }

        // No matter what order, the front-facing cover of the box should
        // always be placed on top
        stack.push(front);

        for (var i = 0, len = stack.length; i < len; i++) {
            stack[i].style.zIndex = i;
        }

        // Rinse, repeat
        setTimeout(update, 1000 / 30);
    }

    // Initialize the program. Done right before returning to ensure
    // that any inline variable definitions are available to all
    // functions
    initialize();

})();
