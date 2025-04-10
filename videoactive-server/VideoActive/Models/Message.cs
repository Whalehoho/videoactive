using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VideoActive.Models
{
    public class Message
    {
        [Key]
        public Guid MID { get; set; } = Guid.NewGuid(); // ✅ UUID for message ID

        [Required]
        public Guid SenderId { get; set; } // ✅ UUID FK to User
        [ForeignKey("SenderId")]
        public User Sender { get; set; }

        [Required]
        public Guid ReceiverId { get; set; } // ✅ UUID FK to User
        [ForeignKey("ReceiverId")]
        public User Receiver { get; set; }

        [Required]
        public Guid CID { get; set; } // ✅ UUID FK to Chatbox
        [ForeignKey("CID")]
        public Chatbox Chatbox { get; set; }

        public string? MessageText { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
