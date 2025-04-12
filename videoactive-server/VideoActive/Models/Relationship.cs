using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace VideoActive.Models
{
    /** 
     * Represents a relationship between two users in the system.
     * This model stores information about a user's relationship with another user, such as a friendship request.
     */
    public class Relationship
    {
        /** 
         * Gets or sets the unique identifier for the relationship.
         * This GUID-based primary key uniquely identifies each relationship in the database.
         * 
         * @property {Guid} RID - The unique identifier for the relationship, automatically generated if not provided.
         */
        [Key]
        public Guid RID { get; set; } = Guid.NewGuid(); // ✅ UUID for Relationship ID

        /** 
         * Gets or sets the ID of the user initiating or involved in the relationship.
         * This is a foreign key to the User table, indicating which user is part of the relationship.
         * 
         * @property {Guid} UserId - The unique identifier of the user in the relationship.
         */
        [Required]
        public Guid UserId { get; set; } // ✅ FK to User

        /** 
         * Gets or sets the associated User for the relationship.
         * This navigation property links to the User entity, providing access to the user initiating the relationship.
         * 
         * @property {User} User - The user involved in the relationship, linked via the UserId foreign key.
         */
        [ForeignKey("UserId")]
        public User User { get; set; }

        /** 
         * Gets or sets the ID of the friend in the relationship.
         * This is a foreign key to the User table, indicating the second user in the relationship.
         * 
         * @property {Guid} FriendId - The unique identifier of the friend in the relationship.
         */
        [Required]
        public Guid FriendId { get; set; } // ✅ FK to User

        /** 
         * Gets or sets the associated Friend for the relationship.
         * This navigation property links to the User entity, providing access to the friend in the relationship.
         * 
         * @property {User} Friend - The friend in the relationship, linked via the FriendId foreign key.
         */
        [ForeignKey("FriendId")]
        public User Friend { get; set; }

        /** 
         * Gets or sets the status of the relationship.
         * The status indicates whether the relationship request is still pending or has been accepted.
         * The default status is set to "Pending".
         * 
         * @property {RelationshipStatus} Status - The current status of the relationship (Pending or Accepted).
         */
        [Required]
        public RelationshipStatus Status { get; set; } = RelationshipStatus.Pending;
    }

    /** 
     * Represents the possible status values for a relationship.
     * This enum defines the various stages of a relationship (e.g., Pending or Accepted).
     */
    public enum RelationshipStatus
    {
        /** 
         * The relationship is pending approval.
         * The user has sent a request, but the other party has not yet accepted it.
         */
        Pending,

        /** 
         * The relationship has been accepted.
         * Both users have agreed to the relationship, indicating a confirmed friendship.
         */
        Accepted
    }
}
