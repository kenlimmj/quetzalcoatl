using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.ComponentModel;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using Fleck;
using Microsoft.Kinect;
using Newtonsoft.Json;

namespace Kinect.Server
{
    class Program
    {
        static List<IWebSocketConnection> allSockets = new List<IWebSocketConnection>();
        static bool _serverInitialized = false;

        static void Main(string[] args)
        {
            InitializeServer();
        }

        private static void InitializeServer()
        {

            var server = new WebSocketServer("ws://localhost:1620");
            server.Start(socket =>
            {
                socket.OnOpen = () =>
                {
                    Console.WriteLine("Open!");
                    allSockets.Add(socket);
                    Kinect alpha = new Kinect();
                    alpha.InitializeKinect();
                };
                socket.OnClose = () =>
                {
                    Console.WriteLine("Close!");
                    allSockets.Remove(socket);
                };
                socket.OnMessage = message =>
                {
                    Console.WriteLine(message);
                    allSockets.ToList().ForEach(s => s.Send("Echo: " + message));
                };
            });

            _serverInitialized = true;

            var input = Console.ReadLine();
            while (input != "exit")
            {
                foreach (var socket in allSockets.ToList())
                {
                    socket.Send(input);
                }
                input = Console.ReadLine();
            }
        }

        public class Kinect
        {
            private Body[] bodies = null;
            private KinectSensor kinectSensor = null;
            private CoordinateMapper coordinateMapper = null;
            private BodyFrameReader reader = null;

            public void InitializeKinect()
            {
                this.kinectSensor = KinectSensor.Default;

                if (this.kinectSensor != null)
                {
                    Console.WriteLine("Kinect detected. Starting...");
                    allSockets.ToList().ForEach(s => s.Send("Kinect detected. Starting..."));

                    // Get the coordinate mapper
                    this.coordinateMapper = this.kinectSensor.CoordinateMapper;

                    // Open the sensor
                    this.kinectSensor.Open();

                    this.bodies = new Body[this.kinectSensor.BodyFrameSource.BodyCount];

                    // Open the reader for the body frames
                    this.reader = this.kinectSensor.BodyFrameSource.OpenReader();

                    if (this.reader != null)
                    {
                        this.reader.FrameArrived += this.Reader_FrameArrived;
                    }
                }
            }

            /// <summary>
            /// Handles the body frame data arriving from the sensor
            /// </summary>
            /// <param name="sender">object sending the event</param>
            /// <param name="e">event arguments</param>
            private void Reader_FrameArrived(object sender, BodyFrameArrivedEventArgs e)
            {
                BodyFrameReference frameReference = e.FrameReference;

                try
                {
                    BodyFrame frame = frameReference.AcquireFrame();

                    if (frame != null)
                    {
                        using (frame)
                        {
                            frame.GetAndRefreshBodyData(this.bodies);

                            foreach (Body body in this.bodies)
                            {
                                if (body.IsTracked)
                                {
                                    IReadOnlyDictionary<JointType, Joint> joints = body.Joints;

                                    // convert the joint points to depth (display) space
                                    Dictionary<JointType, Point> jointPoints = new Dictionary<JointType, Point>();
                                    foreach (JointType jointType in joints.Keys)
                                    {
                                        DepthSpacePoint depthSpacePoint = this.coordinateMapper.MapCameraPointToDepthSpace(joints[jointType].Position);
                                        jointPoints[jointType] = new Point(depthSpacePoint.X, depthSpacePoint.Y);
                                    }
                                    //          this.DrawBody(joints, jointPoints, dc);

                                    if (engaged)
                                    {
                                        //this.DrawHand(body.HandLeftState, jointPoints[JointType.HandLeft], "left");
                                        //this.DrawHand(body.HandRightState, jointPoints[JointType.HandRight], "right");
                                        string info = MakeJson(body.HandRightState, jointPoints[JointType.HandRight], body.HandLeftState, jointPoints[JointType.HandLeft]);
                                        allSockets.ToList().ForEach(s => s.Send(info));
                                        Console.WriteLine(info);
                                        this.CheckStartStop(sender, e);
                                    }
                                    else
                                    {
                                        Console.WriteLine("Checking for Start");
                                        this.CheckStartStop(sender, e);
                                    }
                                }
                                //    }
                            }
                        }
                    }
                }
                catch (Exception)
                {
                    // ignore if the frame is no longer available
                }
            }

            bool engaged = false;

            /// <summary>
            /// Draws a hand symbol if the hand is tracked: red circle = closed, green circle = opened; blue circle = lasso
            /// </summary>
            /// <param name="handState">state of the hand</param>
            /// <param name="handPosition">position of the hand</param>
            /// <param name="drawingContext">drawing context to draw to</param>
            private void CheckStartStop(object sender, BodyFrameArrivedEventArgs e)
            {
                BodyFrameReference frameReference = e.FrameReference;

                try
                {
                    BodyFrame frame = frameReference.AcquireFrame();

                    if (frame != null)
                    {
                        using (frame)
                        {
                            frame.GetAndRefreshBodyData(this.bodies);

                            foreach (Body body in this.bodies)
                            {
                                if (body.IsTracked)
                                {
                                    IReadOnlyDictionary<JointType, Joint> joints = body.Joints;

                                    // convert the joint points to depth (display) space
                                    Dictionary<JointType, Point> jointPoints = new Dictionary<JointType, Point>();
                                    foreach (JointType jointType in joints.Keys)
                                    {
                                        DepthSpacePoint depthSpacePoint = this.coordinateMapper.MapCameraPointToDepthSpace(joints[jointType].Position);
                                        jointPoints[jointType] = new Point(depthSpacePoint.X, depthSpacePoint.Y);
                                    }

                                    if (jointPoints[JointType.ShoulderRight].X <= jointPoints[JointType.WristRight].X && jointPoints[JointType.WristRight].X <= jointPoints[JointType.ElbowRight].X)
                                    {
                                        if (jointPoints[JointType.ShoulderRight].Y >= jointPoints[JointType.WristRight].Y && jointPoints[JointType.WristRight].Y <= jointPoints[JointType.ElbowRight].Y)
                                        {
                                            Console.WriteLine("Start Detected.");
                                            engaged = true;
                                        }
                                    }
                                    else if (jointPoints[JointType.HandLeft].Y >= jointPoints[JointType.SpineBase].Y && jointPoints[JointType.HandRight].Y >= jointPoints[JointType.SpineBase].Y)
                                    {
                                        engaged = false;
                                    }
                                }
                                //    }
                            }
                        }
                    }
                }
                catch (Exception)
                {
                    // ignore if the frame is no longer available
                }
            }

            private class Hands
            {
                public HandState rhandState { get; set; }
                public double rx { get; set; }
                public double ry { get; set; }
                public HandState lhandState { get; set; }
                public double lx { get; set; }
                public double ly { get; set; }
            }

            public string MakeJson(HandState rightstate, Point rightpos, HandState leftstate, Point leftpos)
            {
                Hands hands = new Hands
                {
                    rhandState = rightstate,
                    rx = rightpos.X,
                    ry = rightpos.Y,
                    lhandState = leftstate,
                    lx = leftpos.X,
                    ly = leftpos.Y,
                };

                string json = JsonConvert.SerializeObject(hands, Formatting.Indented);
                return json;
            }

            
            private void DrawHand(HandState handState, Point handPosition, String parity)
            {
                switch (handState)
                {
                    case HandState.Closed:
                        Console.WriteLine(parity.ToUpper() + " hand is closed at Position: " + handPosition);
                        allSockets.ToList().ForEach(s => s.Send(parity.ToUpper() + " hand is closed at Position: " + handPosition));
                        break;

                    case HandState.Open:
                        Console.WriteLine(parity.ToUpper() + " hand is open at Position: " + handPosition);
                        allSockets.ToList().ForEach(s => s.Send(parity.ToUpper() + " hand is open at Position: " + handPosition));
                        break;

                    case HandState.Lasso:
                        Console.WriteLine(parity.ToUpper() + " hand is pointing at Position: " + handPosition);
                        allSockets.ToList().ForEach(s => s.Send(parity.ToUpper() + " hand is pointing at Position: " + handPosition));
                        break;
                }
            }
        }
    }
}