window.onload = function() {
  var foo = new AppInterface(),
      kinect = new KinectInterface(foo),
      user = new UserInterface(foo, kinect),
      cursor = new CursorInterface(foo, kinect, user);

  window.foo = foo;
  window.kinect = kinect;
  window.user = user;
  window.cursor = cursor;
}


