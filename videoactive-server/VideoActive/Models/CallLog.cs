using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VideoActive.Models
{
    public class CallLog
    {
        [Key]
        public Guid CID { get; set; } = Guid.NewGuid(); // ✅ Primary key as UUID

        [Required]
        public Guid CallerId { get; set; } // ✅ Foreign key as UUID

        [Required]
        public Guid CalleeId { get; set; } // ✅ Foreign key as UUID

        [Required]
        public DateTime CallTime { get; set; } = DateTime.UtcNow;

        public DateTime? EndTime { get; set; }

        public string? CallType { get; set; }
    }
}
