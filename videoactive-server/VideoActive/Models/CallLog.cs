using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VideoActive.Models
{
    /** 
     * Represents a log of a call between two users.
     * This model stores the details of the call including caller, callee, start and end times, and call type.
     */
    public class CallLog
    {
        /** 
         * Gets or sets the unique identifier for the call log.
         * This value is automatically generated as a GUID, which serves as the primary key.
         * 
         * @property {Guid} CID - The unique identifier for the call log.
         * This value is automatically generated and serves as the primary key.
         */
        [Key]
        public Guid CID { get; set; } = Guid.NewGuid(); // ✅ Primary key as UUID

        /** 
         * Gets or sets the caller's user ID.
         * This field is a foreign key that references the user who initiated the call.
         * 
         * @property {Guid} CallerId - The unique identifier for the caller.
         * This value is required and represents the user who initiated the call.
         */
        [Required]
        public Guid CallerId { get; set; } // ✅ Foreign key as UUID

        /** 
         * Gets or sets the callee's user ID.
         * This field is a foreign key that references the user who received the call.
         * 
         * @property {Guid} CalleeId - The unique identifier for the callee.
         * This value is required and represents the user who received the call.
         */
        [Required]
        public Guid CalleeId { get; set; } // ✅ Foreign key as UUID

        /** 
         * Gets or sets the time when the call was initiated.
         * This field is required and is automatically set to the current UTC time when a new call log is created.
         * 
         * @property {DateTime} CallTime - The timestamp for when the call was made.
         * This value is required and is set to the current UTC time by default.
         */
        [Required]
        public DateTime CallTime { get; set; } = DateTime.UtcNow;

        /** 
         * Gets or sets the time when the call ended.
         * This field is optional and may be null if the call has not yet ended.
         * 
         * @property {DateTime?} EndTime - The timestamp for when the call ended.
         * This value is optional and can be null.
         */
        public DateTime? EndTime { get; set; }

        /** 
         * Gets or sets the type of the call (e.g., voice, video, etc.).
         * This field is optional and provides additional information about the call type.
         * 
         * @property {string?} CallType - The type of the call.
         * This value is optional and can be used to specify whether the call was voice, video, or another type.
         */
        public string? CallType { get; set; }
    }
}
