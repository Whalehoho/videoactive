using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VideoActive.Models
{
    public class Admin
    {

        [Key]
        public Guid AID { get; set; } = Guid.NewGuid();

        [Required]
        [StringLength(255)]
        public string Username { get; set; }

        [Required]
        [StringLength(255)]
        public string PasswordHash { get; set; }

        [Required]
        public int AdminLevel { get; set; }

        public bool IsDefaultPassword { get; set; } = true;

    }
}