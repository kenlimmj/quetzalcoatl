(function() {
    // Start the server when Shift + C is pressed
    Mousetrap.bind('shift+c', function() {
        Server.init();
    });
})();
