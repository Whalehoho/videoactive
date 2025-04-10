using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VideoActive.Models
{
    public class Relationship
    {
        [Key]
        public Guid RID { get; set; } = Guid.NewGuid(); // ✅ UUID for Relationship ID

        [Required]
        public Guid UserId { get; set; } // ✅ FK to User
        [ForeignKey("UserId")]
        public User User { get; set; }

        [Required]
        public Guid FriendId { get; set; } // ✅ FK to User
        [ForeignKey("FriendId")]
        public User Friend { get; set; }

        [Required]
        public RelationshipStatus Status { get; set; } = RelationshipStatus.Pending;
    }

    public enum RelationshipStatus
    {
        Pending,
        Accepted
    }
}
