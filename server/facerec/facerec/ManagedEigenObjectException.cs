using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace facerec
{
    /// <summary>
    /// An exception thrown from the ManagedEigenObjectRecognition code
    /// </summary>
    public class ManagedEigenObjectException : ApplicationException
    {
        /// <summary>
        /// Initializes a new instance of the ManagedEigenObjectException class with a message
        /// </summary>
        public ManagedEigenObjectException(string message): base(message) { }
    }
}