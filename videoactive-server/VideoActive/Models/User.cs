using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VideoActive.Models
{
    public class User
    {
        [Key]
        public Guid UID { get; set; } = Guid.NewGuid(); // ✅ UUID as primary key

        [Required]
        [StringLength(255)]
        public string Username { get; set; }

        [Required]
        [StringLength(255)]
        [EmailAddress]
        public string Email { get; set; }

        public string? ProfilePic { get; set; }

        [Required]
        public UserStatus Status { get; set; } = UserStatus.Offline;

        [StringLength(300)]
        public string? Description { get; set; }

        public bool? Gender { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public enum UserStatus
    {
        Offline,
        Online,
        Busy
    }
}
