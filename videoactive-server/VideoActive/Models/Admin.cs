using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VideoActive.Models
{
    /** 
     * Represents an administrator within the application.
     * This class contains the admin's credentials, access level, and password status.
     */
    public class Admin
    {
        /** 
         * Gets or sets the Admin ID.
         * This is a unique identifier for each admin, set as a UUID.
         * 
         * @property {Guid} AID - The unique admin identifier.
         */
        [Key]
        public Guid AID { get; set; } = Guid.NewGuid(); // ✅ Admin ID as UUID

        /** 
         * Gets or sets the admin's username.
         * The username must be unique and is required for authentication.
         * 
         * @property {string} Username - The admin's username.
         */
        [Required]
        [StringLength(255)]
        public string Username { get; set; } // ✅ Admin's unique username

        /** 
         * Gets or sets the password hash for the admin account.
         * The password is stored in a hashed format for security.
         * 
         * @property {string} PasswordHash - The hashed password of the admin.
         */
        [Required]
        [StringLength(255)]
        public string PasswordHash { get; set; } // ✅ Admin's hashed password

        /** 
         * Gets or sets the admin's level of access.
         * Higher values represent more privileged access within the system.
         * 
         * @property {int} AdminLevel - The access level of the admin.
         */
        [Required]
        public int AdminLevel { get; set; } // ✅ Admin's access level

        /** 
         * Gets or sets the status of the admin's password.
         * This flag indicates whether the admin is using a default password.
         * 
         * @property {bool} IsDefaultPassword - Indicates if the admin is using the default password.
         */
        public bool IsDefaultPassword { get; set; } = true; // ✅ Default password flag
    }
}
