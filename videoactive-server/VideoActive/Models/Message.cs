using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace VideoActive.Models
{
    /** 
     * Represents a message exchanged between two users within a chatbox.
     * This model stores information about the sender, receiver, chatbox, message content, and the timestamp of the message.
     */
    public class Message
    {
        /** 
         * Gets or sets the unique identifier for the message.
         * This GUID-based primary key uniquely identifies each message in the database.
         * 
         * @property {Guid} MID - The unique identifier for the message, automatically generated if not provided.
         */
        [Key]
        public Guid MID { get; set; } = Guid.NewGuid(); // ✅ UUID for message ID

        /** 
         * Gets or sets the ID of the user sending the message.
         * This is a foreign key to the User table, indicating the sender of the message.
         * 
         * @property {Guid} SenderId - The unique identifier of the user sending the message.
         */
        [Required]
        public Guid SenderId { get; set; } // ✅ UUID FK to User

        /** 
         * Gets or sets the associated Sender for the message.
         * This navigation property links to the User entity, providing access to the sender of the message.
         * 
         * @property {User} Sender - The user who sent the message, linked via the SenderId foreign key.
         */
        [ForeignKey("SenderId")]
        public User Sender { get; set; }

        /** 
         * Gets or sets the ID of the user receiving the message.
         * This is a foreign key to the User table, indicating the receiver of the message.
         * 
         * @property {Guid} ReceiverId - The unique identifier of the user receiving the message.
         */
        [Required]
        public Guid ReceiverId { get; set; } // ✅ UUID FK to User

        /** 
         * Gets or sets the associated Receiver for the message.
         * This navigation property links to the User entity, providing access to the receiver of the message.
         * 
         * @property {User} Receiver - The user who received the message, linked via the ReceiverId foreign key.
         */
        [ForeignKey("ReceiverId")]
        public User Receiver { get; set; }

        /** 
         * Gets or sets the ID of the chatbox in which the message was sent.
         * This is a foreign key to the Chatbox table, indicating the chatbox where the message was exchanged.
         * 
         * @property {Guid} CID - The unique identifier of the chatbox the message belongs to.
         */
        [Required]
        public Guid CID { get; set; } // ✅ UUID FK to Chatbox

        /** 
         * Gets or sets the associated Chatbox for the message.
         * This navigation property links to the Chatbox entity, providing access to the chatbox where the message was sent.
         * 
         * @property {Chatbox} Chatbox - The chatbox in which the message was sent, linked via the CID foreign key.
         */
        [ForeignKey("CID")]
        public Chatbox Chatbox { get; set; }

        /** 
         * Gets or sets the text content of the message.
         * This field stores the actual content of the message sent by the sender.
         * 
         * @property {string} MessageText - The content of the message sent by the sender.
         */
        public string? MessageText { get; set; }

        /** 
         * Gets or sets the timestamp when the message was created.
         * This field stores the UTC timestamp representing when the message was created.
         * The default value is set to the current UTC time at the moment of message creation.
         * 
         * @property {DateTime} CreatedAt - The timestamp when the message was created, defaulting to the current UTC time.
         */
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
