using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.ComponentModel;

// Core Reference Libraries
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Imaging;

// WebSocket Server
using Fleck;

// Kinect API
using Microsoft.Kinect;

// JSON Serializer
using Newtonsoft.Json;

namespace Quetzalcoatl
{
    class Program
    {
        // Maintain a list of all clients connected to the server
        static List<IWebSocketConnection> allSockets = new List<IWebSocketConnection>();

        static WebSocketServer server = new WebSocketServer("ws://localhost:1620");

        // Debugging switch. Set to true for verbose output.
        static Boolean debug = true;

        static void Main(string[] args)
        {
            // Start the KinectService process in a minimized window. This is required for any Kinect application to run.
            Console.WriteLine("Starting KinectService.exe...");
            ProcessStartInfo KinectService = new ProcessStartInfo(@"C:\Windows\System32\KinectService.exe");
            KinectService.WindowStyle = ProcessWindowStyle.Minimized;
            Process KinectProcess = Process.Start(KinectService);

            server.Start(socket =>
            {
                socket.OnOpen = () =>
                {
                    Console.WriteLine("Opening a new socket...");

                    // Add the socket address to the master list
                    allSockets.Add(socket);

                    Console.WriteLine("Initializing Kinect...");

                    // Initialize a new Kinect object
                    Kinect alpha = new Kinect();
                    alpha.InitializeKinect();
                };
                socket.OnClose = () =>
                {
                    Console.WriteLine("Closing all connections...");

                    // Remove the socket record from the master list
                    allSockets.Remove(socket);
                };
            });

            // Logic to allow for a soft quit of the server when "exit" is input at the CLI
            var input = Console.ReadLine();
            if (input == "exit")
            {
                // Purge the KinectService process and close the console window
                KinectProcess.CloseMainWindow();
                KinectProcess.Close();

                // Close the main console window
                System.Environment.Exit(0);
            }
            else
            {
                while (input != "exit")
                {
                    input = Console.ReadLine();
                }
            }
        }

        public class Kinect
        {
            // Initialize a handler for the bodies the Kinect tracks
            private Body[] bodies = null;

            // Initialize a handler for the Kinect itself
            private KinectSensor kinectSensor = null;

            // Initialize a handler for the coordinate mapping function
            private CoordinateMapper coordinateMapper = null;

            // Initialize a buffer to handle the frames coming in from the Kinect
            private BodyFrameReader reader = null;

            private int rframecount = 0;
            private int lframecount = 0;
            private int startcount = 0;
            private int endcount = 0;

            private float zright = 0;
            private float zleft = 0;
            private float ssright = 0;
            private float ssleft = 0;

            private float pushzright = 0;
            private float pushzleft = 0;

            private bool rpush = false;
            private bool lpush = false;
            private bool rpull = false;
            private bool lpull = false;

            private String lHandState = "";
            private String rHandState = "";

            private double zoominit = 0;
            private double zoomscale = 0;

            private bool startStatement = false;

            private bool engaged = false;

            private ulong mainBodyId = 0;

            private Point[] lpos = new Point[5];
            private Point[] rpos = new Point[5];
            private string swipe = "none";

            public void InitializeKinect()
            {
                // Initialize the Kinect itself. Since we're running the Dev API, there's support for only one Kinect.
                this.kinectSensor = KinectSensor.Default;

                if (this.kinectSensor != null)
                {
                    Console.WriteLine("Kinect Initialized. Broadcasting...");

                    // Get the coordinate mapper
                    // The Kinect depth sensor measures in millimeters. CoordinateMapper converts millimeters to pixels.
                    this.coordinateMapper = this.kinectSensor.CoordinateMapper;

                    // Initialize the depth sensor
                    this.kinectSensor.Open();

                    // Retrieve the bodies that the Kinect detects
                    this.bodies = new Body[this.kinectSensor.BodyFrameSource.BodyCount];

                    // Open the reader for the body frames
                    this.reader = this.kinectSensor.BodyFrameSource.OpenReader();

                    if (this.reader != null)
                    {
                        // If the Kinect is connected properly, keep pulling frames from the sensor
                        this.reader.FrameArrived += this.Reader_FrameArrived;
                    }
                }
            }

            /// An instance handles the body frame data arriving from the sensor
            private void Reader_FrameArrived(object sender, BodyFrameArrivedEventArgs e)
            {
                BodyFrameReference frameReference = e.FrameReference;

                try
                {
                    using (BodyFrame frame = frameReference.AcquireFrame())
                    {
                        if (frame != null)
                        {
                            // Get the data for all the bodies detected by the Kinect
                            frame.GetAndRefreshBodyData(this.bodies);

                            // Extract only the bodies that are tracked
                            var trackedBodies = this.bodies.Where(c => c.IsTracked).ToArray();

                            // Initialize a blank array for storing body IDs
                            var bodyIdArray = new ulong[trackedBodies.Count()];

                            // Populate the ID array with the IDs of all tracked bodies
                            for (int k = 0; k < trackedBodies.Count(); k++)
                            {
                                bodyIdArray[k] = trackedBodies[k].TrackingId;
                            }

                            // Set the body to be tracked. If the ID is empty, or if the last tracked body is not in the Kinect viewport,
                            // the first body that is detected will be assigned to be tracked. Otherwise, it maintains priority of the
                            // original body
                            if (mainBodyId == 0 || Array.IndexOf(bodyIdArray, mainBodyId) == -1)
                            {
                                mainBodyId = bodyIdArray[0];
                            }

                            foreach (Body body in this.bodies)
                            {
                                if (body.IsTracked && body.TrackingId == mainBodyId)
                                {
                                    // Store all the joint data to a Dictionary for easy access later
                                    IReadOnlyDictionary<JointType, Joint> joints = body.Joints;

                                    // Invoke the coordinate mapper to convert the joint coordinates from millimeters to pixels
                                    Dictionary<JointType, Point> jointPoints = new Dictionary<JointType, Point>();
                                    foreach (JointType jointType in joints.Keys)
                                    {
                                        DepthSpacePoint depthSpacePoint = this.coordinateMapper.MapCameraPointToDepthSpace(joints[jointType].Position);
                                        jointPoints[jointType] = new Point(depthSpacePoint.X, depthSpacePoint.Y);
                                    }

                                    // Define handles to each hand
                                    Point lHand = jointPoints[JointType.HandLeft];
                                    Point rHand = jointPoints[JointType.HandRight];

                                    // Define handles to each shoulder
                                    Point lShoulder = jointPoints[JointType.ShoulderLeft];
                                    Point rShoulder = jointPoints[JointType.ShoulderRight];

                                    // Define handles to each wrist
                                    Point lWrist = jointPoints[JointType.WristLeft];
                                    Point rWrist = jointPoints[JointType.WristRight];

                                    // Define handles to each elbow
                                    Point lElbow = jointPoints[JointType.ElbowLeft];
                                    Point rElbow = jointPoints[JointType.ElbowRight];

                                    // Define handle to the base of the spine
                                    Point bSpine = jointPoints[JointType.SpineBase];

                                    // Define handles to the neck and head
                                    Point neck = jointPoints[JointType.Neck];
                                    Point head = jointPoints[JointType.Head];

                                    if (engaged == true)
                                    {
                                        startStatement = false;

                                        for (int i = 3; i >= 0; i--)
                                        {
                                            rpos[i + 1] = rpos[i];
                                            lpos[i + 1] = lpos[i];
                                        }
                                        rpos[0] = rHand;
                                        lpos[0] = lHand;

                                        if (rpos[4].X != 0 && rpos[4].Y != 0)
                                        {
                                            swipe = CheckSwipe(rpos[0], rpos[4], lpos[0], lpos[4]);
                                        }
                                        if (rpos[4].X == 0 && lpos[4].X == 0)
                                        {
                                            swipe = "none";
                                        }
                                        if (!(swipe.Equals("none")))
                                        {
                                            Array.Clear(rpos, 0, rpos.Length);
                                            Array.Clear(lpos, 0, lpos.Length);
                                        }

                                        if (body.HandRightState == HandState.Closed)
                                        {
                                            if (this.rframecount >= 45)
                                            {
                                                rframecount = 0;
                                            }
                                            rpush = CheckPush(body.Joints[JointType.HandRight].Position.Z, "right", rframecount);
                                            rpull = CheckPull(body.Joints[JointType.HandRight].Position.Z, "right", rframecount);
                                        }
                                        else
                                        {
                                            rpush = false;
                                            rpull = false;
                                        }

                                        if (body.HandLeftState == HandState.Closed)
                                        {
                                            if (this.lframecount >= 45)
                                            {
                                                lframecount = 0;
                                            }
                                            lpush = CheckPush(body.Joints[JointType.HandLeft].Position.Z, "left", lframecount);
                                            lpull = CheckPull(body.Joints[JointType.HandLeft].Position.Z, "left", lframecount);
                                        }
                                        else
                                        {
                                            lpush = false;
                                            lpull = false;
                                        }

                                        CheckZoom(body.HandLeftState, body.HandRightState, rHand, lHand, rShoulder, lShoulder, bSpine, head);

                                        // Calculate the distance from the midpoint of the left elbow-wrist joint to the midpoint of the right elbow-wrist joint
                                        double width = (Math.Pow((Math.Pow(Math.Abs(rShoulder.X - rElbow.X), 2) + Math.Pow(Math.Abs(rShoulder.Y - rElbow.Y), 2)), 0.5) + (Math.Pow((Math.Pow(Math.Abs(rElbow.X - rWrist.X), 2) + Math.Pow(Math.Abs(rElbow.Y - rWrist.Y), 2)), 0.5) / 2)) * 2 + Math.Abs(rShoulder.X - lShoulder.X);

                                        // Calculate the distance from the base of the spine to the top of the head
                                        double height = Math.Abs(bSpine.Y - neck.Y) + 2 * (neck.Y - head.Y);

                                        // Text-ify the left hand state
                                        if (lpull == true)
                                        {
                                            lHandState = "pull";
                                        }
                                        else if (lpush == true)
                                        {
                                            lHandState = "push";
                                        }
                                        else
                                        {
                                            switch (body.HandLeftState)
                                            {
                                                case HandState.Open:
                                                    lHandState = "open";
                                                    break;
                                                case HandState.Closed:
                                                    lHandState = "closed";
                                                    break;
                                                case HandState.Lasso:
                                                    lHandState = "point";
                                                    break;
                                                default:
                                                    lHandState = "unknown";
                                                    break;
                                            }
                                        }

                                        // Text-ify the right hand state
                                        if (rpull == true)
                                        {
                                            rHandState = "pull";
                                        }
                                        else if (rpush == true)
                                        {
                                            rHandState = "push";
                                        }
                                        else
                                        {
                                            switch (body.HandRightState)
                                            {
                                                case HandState.Open:
                                                    rHandState = "open";
                                                    break;
                                                case HandState.Closed:
                                                    rHandState = "closed";
                                                    break;
                                                case HandState.Lasso:
                                                    rHandState = "point";
                                                    break;
                                                default:
                                                    rHandState = "unknown";
                                                    break;
                                            }
                                        }

                                        // Create a JSON packet of all the data to be sent to the client
                                        string result = MakeJson(rHandState, rHand, lHandState, lHand, bSpine, width, height, zoomscale, swipe);

                                        // Send the data to the client
                                        allSockets.ToList().ForEach(s => s.Send(result));

                                        if (debug == true)
                                        {
                                            Console.WriteLine(result);
                                        }

                                        // Check if the user is in a start/stop position

                                        if (lHand.Y <= bSpine.Y && rHand.Y <= bSpine.Y)
                                        {
                                            endcount = 0;
                                        }
                                        this.CheckStartStop(body.Joints[JointType.HandRight].Position.Z, body.Joints[JointType.HandLeft].Position.Z, startcount, endcount, lHand, rHand, bSpine);

                                        // Increment the frame counts
                                        rframecount++;
                                        lframecount++;
                                        endcount++;
                                    }
                                    else
                                    {
                                        if (debug == true && startStatement == false)
                                        {
                                            Console.WriteLine("Awaiting start gesture...");

                                            startStatement = true;
                                        }

                                        // Check if the user is in a start/stop position
                                        if (body.HandLeftState == HandState.Closed && body.HandRightState == HandState.Closed)
                                        {
                                            if (startcount > 45)
                                            {
                                                startcount = 0;
                                            }
                                            this.CheckStartStop(body.Joints[JointType.HandRight].Position.Z, body.Joints[JointType.HandLeft].Position.Z, startcount, endcount, lHand, rHand, bSpine);
                                        }
                                        startcount++;
                                    }
                                }
                            }
                        }
                    }
                }
                catch (Exception)
                {
                    Console.WriteLine("Frame data unavailable...");
                }
            }

            private void CheckStartStop(float rightz, float leftz, int startframe, int endframe, Point lHand, Point rHand, Point bSpine)
            {
                if (startframe == 0)
                {
                    ssright = rightz;
                    ssleft = leftz;
                }
                else if (rightz >= ssright + .102 && leftz >= ssleft + .102)
                {
                    engaged = true;
                    ssleft = 6;
                    ssright = 6;
                }
                else if (lHand.Y >= bSpine.Y && rHand.Y >= bSpine.Y)
                {
                    if (endframe > 150)
                    {
                        engaged = false;
                    }
                }
            }

            private bool CheckPull(float currentz, string parity, int framenum)
            {
                if (parity == "right")
                {
                    if (framenum == 0)
                    {
                        zright = currentz;
                    }
                    else if (currentz >= zright + .102)
                    {
                        return true;
                    }
                }
                if (parity == "left")
                {
                    if (framenum == 0)
                    {
                        zleft = currentz;
                    }
                    else if (currentz >= zleft + .102)
                    {
                        return true;
                    }
                }
                return false;
            }

            private bool CheckPush(float pushcurrentz, string parity, int framenum)
            {
                if (parity == "right")
                {
                    if (framenum == 0)
                    {
                        pushzright = pushcurrentz;
                    }
                    else if (pushcurrentz <= pushzright - .102)
                    {
                        return true;
                    }
                }

                if (parity == "left")
                {
                    if (framenum == 0)
                    {
                        pushzleft = pushcurrentz;
                    }
                    else if (pushcurrentz <= zleft - .102)
                    {
                        return true;
                    }
                }

                return false;
            }

            private void CheckZoom(HandState lstate, HandState rstate, Point rhand, Point lhand, Point rshoulder, Point lshoulder, Point bspine, Point head)
            {
                if (lstate == HandState.Closed && rstate == HandState.Closed)
                {
                    if (lhand.Y >= head.Y &&
                        lhand.Y <= bspine.Y &&
                        lhand.X <= bspine.X &&
                        rhand.X >= bspine.X &&
                        rhand.Y >= head.Y &&
                        rhand.Y <= bspine.Y)
                    {
                        if (zoominit == 0)
                        {
                            zoominit = Math.Pow((Math.Pow(Math.Abs(rhand.X - lhand.X), 2) + Math.Pow(Math.Abs(rhand.Y - lhand.Y), 2)), 0.5);
                        }
                    }
                    if (zoominit != 0)
                    {
                        zoomscale = 1 - (1 - Math.Pow((Math.Pow(Math.Abs(rhand.X - lhand.X), 2) + Math.Pow(Math.Abs(rhand.Y - lhand.Y), 2)), 0.5) / zoominit);
                    }
                }
                else
                {
                    zoominit = 0;
                    zoomscale = 0;
                }
            }

            private string CheckSwipe(Point rfirst, Point rlast, Point lfirst, Point llast)
            {
                if (rfirst.X > rlast.X + 85 || lfirst.X > llast.X + 85)
                {
                    return "right";
                }
                else if (rfirst.X < rlast.X - 85 || lfirst.X < llast.X - 85)
                {
                    return "left";
                }
                else if (rfirst.Y < rlast.Y - 85 || lfirst.Y < llast.Y - 85)
                {
                    return "up";
                }
                else if (rfirst.Y > rlast.Y + 85 || lfirst.Y > llast.Y + 85)
                {
                    return "down";
                }
                else
                {
                    return "none";
                }
            }

            /// An instance is a constructor for the JSON packet
            private class Packet
            {
                /// Right Hand Coordinates
                public double rx { get; set; }
                public double ry { get; set; }

                /// Left Hand Coordinates
                public double lx { get; set; }
                public double ly { get; set; }

                /// Left and Right Hand States
                public string rhandState { get; set; }
                public string lhandState { get; set; }

                ///Spine Base Coordinates
                public double sx { get; set; }
                public double sy { get; set; }

                // User Viewport Dimensions
                public double screenw { get; set; }
                public double screenh { get; set; }

                // Zoom Scale
                public double scale { get; set; }

                //Swipe Value
                public string swipeval { get; set; }
            }

            /// An instance constructs a JSON from a list of parameters
            /// Input: Left and right hand coordinates, and left and right hand states
            /// Output: Formatted JSON packet
            public string MakeJson(String rightstate, Point rightpos, String leftstate, Point leftpos, Point spinebase, double width, double height, double zoom, string zoomdir)
            {
                Packet bodyData = new Packet
                {
                    rx = Math.Round(rightpos.X),
                    ry = Math.Round(rightpos.Y),

                    lx = Math.Round(leftpos.X),
                    ly = Math.Round(leftpos.Y),

                    rhandState = rightstate,
                    lhandState = leftstate,

                    sx = Math.Round(spinebase.X),
                    sy = Math.Round(spinebase.Y),

                    screenw = Math.Round(width),
                    screenh = Math.Round(height),

                    scale = zoom,

                    swipeval = zoomdir
                };

                // Create a nicely formatted JSON from the hand object
                string json = JsonConvert.SerializeObject(bodyData, Formatting.Indented);
                return json;
            }
        }
    }
}