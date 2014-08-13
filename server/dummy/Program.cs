using System;
using System.Text;
using System.Linq;
using System.Xml;

// JSON Serializer
using Newtonsoft.Json;

// WebSocket Server
using SuperSocket.SocketBase;
using SuperSocket.SocketEngine;
using SuperWebSocket;

using Emgu.CV;
using Emgu.CV.CvEnum;
using Emgu.CV.Structure;
using Emgu.CV.UI;

// Kinect API
// using Microsoft.Kinect;

namespace dummy
{
	class MainClass
	{

		static void Main (string[] args)
		{
			socketServer_Initialize ();

			String win1 = "Test Window";

			using (Image<Bgr, Byte> img = new Image<Bgr, byte> (400, 200, new Bgr (255, 0, 0))) {
				//Create the font
				MCvFont f = new MCvFont (CvEnum.FONT.CV_FONT_HERSHEY_COMPLEX, 1.0, 1.0);

				//Draw "Hello, world." on the image using the specific font
				img.Draw ("Hello, world", ref f, new Point (10, 80), new Bgr (0, 255, 0)); 

				//Show the image using ImageViewer from Emgu.CV.UI
				ImageViewer.Show (img, "Test Window");
			}
		}

		static void socketServer_Initialize ()
		{
			// Initialize the server object
			SuperWebSocket.WebSocketServer socketServer = new WebSocketServer ();

			// Initialize basic server configurations
			SuperSocket.SocketBase.Config.RootConfig socketRootConfig = new SuperSocket.SocketBase.Config.RootConfig ();
			SuperSocket.SocketBase.Config.ServerConfig socketServerConfig = new SuperSocket.SocketBase.Config.ServerConfig ();
			SuperSocket.SocketEngine.SocketServerFactory socketServerFactory = new SuperSocket.SocketEngine.SocketServerFactory ();

			// Set the name, IP address and port number which the server is started on
			socketServerConfig.Name = "Quetzalcoatl Server";
			socketServerConfig.Ip = "127.0.0.1";
			socketServerConfig.Port = 1620;

			// Print boilerplate text when the console is first displayed
			logConsoleBoilerplate ();

			// Create the server using the specifications created above
			// If the server fails to start, write to the console
			if (!socketServer.Setup (socketRootConfig, socketServerConfig, socketServerFactory)) {
				Console.WriteLine ("Failed to initialize server at ws[s]://" + socketServer.Config.Ip + ":" + socketServer.Config.Port);
				Console.ReadKey ();
				return;
			}

			// Start the server
			// If the server fails to start, write to the console
			if (!socketServer.Start ()) {
				Console.WriteLine ("Server was successfully initialized at ws[s]://" + socketServer.Config.Ip + ":" + socketServer.Config.Port +
				" but failed to start. Ensure that no processes are currently running at the same address.");
				Console.ReadKey ();
				return;
			}

			// Notify the user that the server has successfully started and is awaiting connections
			Console.WriteLine ("Server initialized at ws[s]://" + socketServer.Config.Ip + ":" + socketServer.Config.Port + " at " + socketServer.StartedTime);
			Console.WriteLine ("Awaiting client connections...");
			Console.WriteLine ();

			// Bind listeners for server events
			socketServer.NewMessageReceived += new SessionHandler<WebSocketSession, string> (socketServer_NewMessageReceived);
			socketServer.NewSessionConnected += socketServer_NewSessionConnected;
			socketServer.SessionClosed += socketServer_SessionClosed;

			// Nullify all console inputs except for when the user types "exit"
			while (Console.ReadLine () != "exit") {
				continue;
			}

			// Properly shutdown the server by waiting on the buffer and freeing all used ports
			socketServer_Shutdown (socketServer);

			return;
		}

		static void logConsoleBoilerplate ()
		{
			Console.WriteLine (
				"QUETZALCOATL KINECT CONTROL SERVER" + "\n" +
				"This software requires the Quetzalcoatl Kinect Control System (QKCS) running on the client application" +
				" in order to function properly." + "\n" +
				"For access, email kl545@cornell.edu at the Cornell Program for Computer Graphics" + "\n" +
				"--------------------------------------------------------------------------------" + "\n"
			);
		}

		static void socketServer_Shutdown (WebSocketServer socketServer)
		{
			Console.WriteLine ("Shutting down server at ws[s]://" + socketServer.Config.Ip + ":" + socketServer.Config.Port);
			socketServer.Stop ();
			Console.WriteLine ("Connections purged. Goodbye!");

			// Close the main console window
			System.Environment.Exit (0);
		}

		static void socketServer_NewMessageReceived (WebSocketSession socketSession, string message)
		{
			// Do something here
		}

		static void socketServer_Send (WebSocketSession socketSession, string message)
		{
			socketSession.Send (message);
		}

		static void socketServer_SendToAll (WebSocketServer socketServer, string message)
		{
			foreach (var socketSession in socketServer.GetAllSessions()) {
				socketServer_Send (socketSession, message);
			}
		}

		static void socketServer_NewSessionConnected (WebSocketSession socketSession)
		{
			// Write socket information to the console
			Console.WriteLine ("Client " + socketSession.SessionID + " connected from " + socketSession.Origin + " at " + socketSession.StartTime);
		}

		static void socketServer_SessionClosed (WebSocketSession socketSession, CloseReason reason)
		{
			if (reason == CloseReason.ServerShutdown) {
				return;
			}

			Console.WriteLine ("Client " + socketSession.SessionID + " disconnected");
		}
	}
}
