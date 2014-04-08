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
        static Boolean debug = false;

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

            private float zright = 0;
            private float zleft = 0;

            private float pushzright = 0;
            private float pushzleft = 0;

            private bool rpush = false;
            private bool lpush = false;
            private bool rpull = false;
            private bool lpull = false;

            private double zoominit = 0;
            private double zoomscale = 0;

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

                            foreach (Body body in this.bodies)
                            {
                                if (body.IsTracked)
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
                                    Point lhand = jointPoints[JointType.HandLeft];
                                    Point rhand = jointPoints[JointType.HandRight];

                                    // Define handles to each shoulder
                                    Point rshoulder = jointPoints[JointType.ShoulderRight];
                                    Point lshoulder = jointPoints[JointType.ShoulderLeft];

                                    Point rwrist = jointPoints[JointType.WristRight];
                                    Point relbow = jointPoints[JointType.ElbowRight];

                                    // Define handle to the base of the spine
                                    Point bSpine = jointPoints[JointType.SpineBase];

                                    // Define handles to the neck and head
                                    Point neck = jointPoints[JointType.Neck];
                                    Point head = jointPoints[JointType.Head];

                                    if (engaged == true)
                                    {
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

                                        CheckZoom(body.HandLeftState, body.HandRightState, rhand, lhand, rshoulder, lshoulder, bSpine, head);

                                        // Calculate the distance from the midpoint of the left elbow-wrist joint to the midpoint of the right elbow-wrist joint
                                        double width = (Math.Pow((Math.Pow(Math.Abs(rshoulder.X - relbow.X), 2) + Math.Pow(Math.Abs(rshoulder.Y - relbow.Y), 2)), 0.5) + (Math.Pow((Math.Pow(Math.Abs(relbow.X - rwrist.X), 2) + Math.Pow(Math.Abs(relbow.Y - rwrist.Y), 2)), 0.5) / 2)) * 2 + Math.Abs(rshoulder.X - lshoulder.X);
                                        
                                        // Calculate the distance from the base of the spine to the top of the head
                                        double height = Math.Abs(bSpine.Y - neck.Y) + 2 * (neck.Y - head.Y);

                                        // Create a JSON packet of all the data to be sent to the client
                                        string result = MakeJson(body.HandRightState, jointPoints[JointType.HandRight], body.HandLeftState, jointPoints[JointType.HandLeft],
                                                            jointPoints[JointType.SpineBase], width, height, rpull, lpull, rpush, lpush, zoomscale);
                                        allSockets.ToList().ForEach(s => s.Send(result));

                                        if (debug == true)
                                        {
                                            Console.WriteLine(result);
                                        }
                                        

                                        this.CheckStartStop(jointPoints[JointType.ShoulderRight], jointPoints[JointType.ElbowRight], jointPoints[JointType.WristRight],
                                            jointPoints[JointType.HandLeft], jointPoints[JointType.HandRight], jointPoints[JointType.SpineBase]);

                                        rframecount += 1;
                                        lframecount += 1;
                                    }
                                    else
                                    {
                                        if (debug == true)
                                        {
                                            Console.WriteLine("Awaiting start gesture");
                                        }
                                        this.CheckStartStop(jointPoints[JointType.ShoulderRight], jointPoints[JointType.ElbowRight], jointPoints[JointType.WristRight],
                                            jointPoints[JointType.HandLeft], jointPoints[JointType.HandRight], jointPoints[JointType.SpineBase]);
                                    }
                                }
                            }
                        }
                    }
                }
                catch (Exception)
                {
                    Console.WriteLine("Frame data unavailable");
                }
            }

            public bool engaged = false;

            private void CheckStartStop(Point rShoulder, Point rElbow, Point rWrist, Point lHand, Point rHand, Point bSpine)
            {
                if (rShoulder.X <= rWrist.X &&
                    rWrist.X <= rElbow.X &&
                    rShoulder.Y >= rWrist.Y &&
                    rWrist.Y <= rElbow.Y)
                {
                    engaged = true;
                }
                else if (lHand.Y >= bSpine.Y && rHand.Y >= bSpine.Y)
                {
                    engaged = false;
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

                ///Arm Length
                public double screenw { get; set; }
                //Torso Height
                public double screenh { get; set; }
                //Push/Pull Detection
                public bool rpull { get; set; }

                public bool lpull { get; set; }

                public bool rpush { get; set; }

                public bool lpush { get; set; }
                //Zoom Scale
                public double scale { get; set; }
            }

            /// An instance constructs a JSON from a list of parameters
            /// Input: Left and right hand coordinates, and left and right hand states
            /// Output: Formatted JSON packet
            public string MakeJson(HandState rightstate, Point rightpos, HandState leftstate, Point leftpos, Point spinebase, double width,
                                    double height, bool rightpull, bool leftpull, bool rightpush, bool leftpush, double zoom)
            {
                // Initialize placeholder variables for the left and right hand states
                String rstateval = "";
                String lstateval = "";

                // Text-ify the right hand state
                switch (rightstate)
                {
                    case HandState.Open:
                        rstateval = "open";
                        break;
                    case HandState.Closed:
                        rstateval = "closed";
                        break;
                    case HandState.Lasso:
                        rstateval = "point";
                        break;
                    default:
                        rstateval = "unknown";
                        break;
                }

                // Text-ify the left hand state
                switch (leftstate)
                {
                    case HandState.Open:
                        lstateval = "open";
                        break;
                    case HandState.Closed:
                        lstateval = "closed";
                        break;
                    case HandState.Lasso:
                        lstateval = "point";
                        break;
                    default:
                        lstateval = "unknown";
                        break;
                }

                Packet bodyData = new Packet
                {
                    rx = rightpos.X,
                    ry = rightpos.Y,

                    lx = leftpos.X,
                    ly = leftpos.Y,

                    rhandState = rstateval,
                    lhandState = lstateval,

                    sx = spinebase.X,
                    sy = spinebase.Y,

                    screenw = width,
                    screenh = height,

                    rpull = rightpull,
                    lpull = leftpull,
                    rpush = rightpush,
                    lpush = leftpush,

                    scale = zoom
                };

                // Create a nicely formatted JSON from the hand object
                string json = JsonConvert.SerializeObject(bodyData, Formatting.Indented);
                return json;
            }
        }
    }
}