using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VideoActive.Models
{
    /**
     * Represents a user in the system.
     * This model is used for user-related operations, such as authentication and profile management.
     */
    public class User
    {
        /** 
         * Gets or sets the unique identifier for the user.
         * This is a GUID-based primary key that uniquely identifies each user in the database.
         * 
         * @property {Guid} UID - The unique identifier for the user, automatically generated if not provided.
         */
        [Key]
        public Guid UID { get; set; } = Guid.NewGuid(); // ✅ UUID as primary key

        /** 
         * Gets or sets the username of the user.
         * The username must be unique and cannot exceed 255 characters.
         * 
         * @property {string} Username - The username used to identify the user in the system.
         */
        [Required]
        [StringLength(255)]
        public string Username { get; set; }

        /** 
         * Gets or sets the email of the user.
         * The email is required, must be a valid email address format, and cannot exceed 255 characters.
         * 
         * @property {string} Email - The email address of the user, used for authentication.
         */
        [Required]
        [StringLength(255)]
        [EmailAddress]
        public string Email { get; set; }

        /** 
         * Gets or sets the URL of the user's profile picture.
         * This field is optional and may be left null if no profile picture is provided.
         * 
         * @property {string?} ProfilePic - The URL pointing to the user's profile picture.
         */
        public string? ProfilePic { get; set; }

        /** 
         * Gets or sets the status of the user.
         * The status is required and represents the current availability of the user (e.g., Online, Offline, Busy).
         * Default value is Offline.
         * 
         * @property {UserStatus} Status - The current status of the user.
         */
        [Required]
        public UserStatus Status { get; set; } = UserStatus.Offline;

        /** 
         * Gets or sets the description of the user.
         * This field allows the user to write a brief description about themselves. It is optional and can be left null.
         * The description cannot exceed 300 characters.
         * 
         * @property {string?} Description - A brief description of the user, optional field.
         */
        [StringLength(300)]
        public string? Description { get; set; }

        /** 
         * Gets or sets the gender of the user.
         * This field is optional and stores a boolean indicating the gender of the user.
         * True represents male, false represents female, and null means not specified.
         * 
         * @property {bool?} Gender - The gender of the user, optional field.
         */
        public bool? Gender { get; set; }

        /** 
         * Gets or sets the date and time when the user was created.
         * This field is automatically set to the current UTC time when the user is created.
         * 
         * @property {DateTime} CreatedAt - The timestamp of when the user was created.
         */
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    /** 
     * Represents the possible status values for a user.
     * These values indicate the current state of the user (e.g., Online, Offline, Busy).
     */
    public enum UserStatus
    {
        /** 
         * User is not currently online.
         */
        Offline,

        /** 
         * User is currently online and available.
         */
        Online,

        /** 
         * User is online but unavailable or busy.
         */
        Busy
    }
}
