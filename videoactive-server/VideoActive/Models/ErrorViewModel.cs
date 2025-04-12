namespace VideoActive.Models;

public class ErrorViewModel
    {
        /** 
         * Gets or sets the unique identifier associated with the error request.
         * This can be used for tracking or logging the specific request that resulted in an error.
         * 
         * @property {string?} RequestId - The unique identifier for the error request. 
         * This value may be null if not available.
         */
        public string? RequestId { get; set; }

        /** 
         * Determines whether the RequestId should be shown.
         * Returns true if the RequestId is not null or empty, indicating the request can be tracked.
         * 
         * @property {bool} ShowRequestId - A boolean that indicates whether the RequestId should be displayed.
         * It checks if the RequestId is non-null and non-empty.
         */
        public bool ShowRequestId => !string.IsNullOrEmpty(RequestId);
    }
