using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace facerec
{
    /// <summary>
    /// An interface for any object capable of providing frames to the facial recognition engine
    /// </summary>
    public interface IFrameSource
    {
        /// <summary>
        /// Raised whenever new frame data is available
        /// </summary>
        event EventHandler<FrameData> FrameDataUpdated;
    }
}
