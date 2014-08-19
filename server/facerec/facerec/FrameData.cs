using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Kinect;

namespace facerec
{
    /// <summary>
    /// Frame data necessary for performing face recognition
    /// </summary>
    public class FrameData
    {
        /// <summary>
        /// Initializes a new instance of the frame data class
        /// </summary>
        /// <param name="colorFrame">A color image from the Kinect's RGB camera</param>
        /// <param name="depthFrame">A depth image from the Kinect's depth camera</param>
        /// <param name="trackedSkeleton">Skeletal data from the Kinect for the current body being tracked</param>
        public FrameData(ColorImageFrame colorFrame, DepthImageFrame depthFrame, Skeleton trackedSkeleton)
        {
            this.ColorFrame = colorFrame;
            this.DepthFrame = depthFrame;
            this.TrackedSkeleton = trackedSkeleton;
        }

        /// <summary>
        /// Gets or sets the color frame
        /// </summary>
        public ColorImageFrame ColorFrame { get; set; }

        /// <summary>
        /// Gets or sets the depth frame
        /// </summary>
        public DepthImageFrame DepthFrame { get; set; }

        /// <summary>
        ///  Gets or sets the tracked skeleton
        /// </summary>
        public Skeleton TrackedSkeleton { get; set; }
    }
}
