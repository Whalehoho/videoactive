using Microsoft.EntityFrameworkCore;
using VideoActive.Models;

namespace VideoActive.Models
{
    /** 
     * Represents the application's database context.
     * This class manages the entity models and defines relationships between them,
     * as well as configuring constraints and indices for performance and data integrity.
     */
    public class ApplicationDbContext : DbContext
    {
        /** 
         * Initializes a new instance of the ApplicationDbContext class.
         * The constructor passes the DbContextOptions to the base class to configure the context.
         * 
         * @param {DbContextOptions<ApplicationDbContext>} options - Options for configuring the database context.
         */
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        /** 
         * Gets or sets the DbSet for users.
         * This represents the 'Users' table in the database.
         * 
         * @property {DbSet<User>} Users - The collection of User entities.
         */
        public DbSet<User> Users { get; set; }

        /** 
         * Gets or sets the DbSet for admins.
         * This represents the 'Admins' table in the database.
         * 
         * @property {DbSet<Admin>} Admins - The collection of Admin entities.
         */
        public DbSet<Admin> Admins { get; set; }

        /** 
         * Gets or sets the DbSet for relationships.
         * This represents the 'Relationships' table in the database.
         * 
         * @property {DbSet<Relationship>} Relationships - The collection of Relationship entities.
         */
        public DbSet<Relationship> Relationships { get; set; }

        /** 
         * Gets or sets the DbSet for messages.
         * This represents the 'Messages' table in the database.
         * 
         * @property {DbSet<Message>} Messages - The collection of Message entities.
         */
        public DbSet<Message> Messages { get; set; }

        /** 
         * Gets or sets the DbSet for chatboxes.
         * This represents the 'Chatboxes' table in the database.
         * 
         * @property {DbSet<Chatbox>} Chatboxes - The collection of Chatbox entities.
         */
        public DbSet<Chatbox> Chatboxes { get; set; }

        /** 
         * Gets or sets the DbSet for call logs.
         * This represents the 'CallLogs' table in the database.
         * 
         * @property {DbSet<CallLog>} CallLogs - The collection of CallLog entities.
         */
        public DbSet<CallLog> CallLogs { get; set; }

        /** 
         * Configures the model's relationships, constraints, and indices.
         * This method is called by EF Core during model creation to configure the entity models
         * and enforce business rules such as unique constraints and foreign key relationships.
         * 
         * @param {ModelBuilder} modelBuilder - The model builder used to configure the database schema.
         */
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Unique constraints for User and Admin usernames and emails
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique(); // ✅ Ensure unique usernames

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique(); // ✅ Ensure unique email addresses

            modelBuilder.Entity<Admin>()
                .HasIndex(a => a.Username)
                .IsUnique(); // ✅ Ensure unique admin usernames

            // Relationship constraints ensuring foreign keys are properly set up and deletes are restricted
            modelBuilder.Entity<Relationship>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict); // ✅ Restrict delete if user has relationships

            modelBuilder.Entity<Relationship>()
                .HasOne(r => r.Friend)
                .WithMany()
                .HasForeignKey(r => r.FriendId)
                .OnDelete(DeleteBehavior.Restrict); // ✅ Restrict delete if friend has relationships

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict); // ✅ Restrict delete if message sender exists

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Receiver)
                .WithMany()
                .HasForeignKey(m => m.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict); // ✅ Restrict delete if message receiver exists

            modelBuilder.Entity<Chatbox>()
                .HasOne(c => c.User1)
                .WithMany()
                .HasForeignKey(c => c.UserId1)
                .OnDelete(DeleteBehavior.Restrict); // ✅ Restrict delete if user1 exists in chatbox

            modelBuilder.Entity<Chatbox>()
                .HasOne(c => c.User2)
                .WithMany()
                .HasForeignKey(c => c.UserId2)
                .OnDelete(DeleteBehavior.Restrict); // ✅ Restrict delete if user2 exists in chatbox

            modelBuilder.Entity<CallLog>()
                .HasIndex(c => c.CID)
                .IsUnique(); // ✅ Ensure unique call log IDs
        }
    }
}
