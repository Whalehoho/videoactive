using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VideoActive.Models
{
    public class Chatbox
    {
        [Key]
        public Guid CID { get; set; } = Guid.NewGuid(); // ✅ Primary key as UUID

        [Required]
        public Guid UserId1 { get; set; }

        [ForeignKey("UserId1")]
        public User User1 { get; set; }

        [Required]
        public Guid UserId2 { get; set; }

        [ForeignKey("UserId2")]
        public User User2 { get; set; }
    }
}
