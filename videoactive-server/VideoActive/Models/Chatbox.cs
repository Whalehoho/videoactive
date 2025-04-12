using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VideoActive.Models
{
    /** 
     * Represents a chatbox that contains two users involved in a conversation.
     * This model links two users via their respective UserId properties and includes necessary foreign key relationships.
     */
    public class Chatbox
    {
        /** 
         * Gets or sets the unique identifier for the chatbox. 
         * The value is generated automatically as a UUID and serves as the primary key for this entity.
         * 
         * @property {Guid} CID - The unique identifier for the chatbox (Primary Key).
         * This value is assigned automatically when a new chatbox is created.
         */
        [Key]
        public Guid CID { get; set; } = Guid.NewGuid(); // ✅ Primary key as UUID

        /** 
         * Gets or sets the identifier of the first user involved in the chatbox. 
         * This property is marked as required and forms a foreign key relationship to the User entity.
         * 
         * @property {Guid} UserId1 - The identifier of the first user in the chatbox. This is a foreign key reference to the User entity.
         */
        [Required]
        public Guid UserId1 { get; set; }

        /** 
         * Represents the first user in the chatbox. 
         * This is the navigation property that allows access to the associated User entity for the first user.
         * 
         * @property {User} User1 - The first user involved in the chatbox.
         * This property is used to load the associated User entity for UserId1.
         */
        [ForeignKey("UserId1")]
        public User User1 { get; set; }

        /** 
         * Gets or sets the identifier of the second user involved in the chatbox. 
         * This property is marked as required and forms a foreign key relationship to the User entity.
         * 
         * @property {Guid} UserId2 - The identifier of the second user in the chatbox. This is a foreign key reference to the User entity.
         */
        [Required]
        public Guid UserId2 { get; set; }

        /** 
         * Represents the second user in the chatbox. 
         * This is the navigation property that allows access to the associated User entity for the second user.
         * 
         * @property {User} User2 - The second user involved in the chatbox.
         * This property is used to load the associated User entity for UserId2.
         */
        [ForeignKey("UserId2")]
        public User User2 { get; set; }
    }
}
