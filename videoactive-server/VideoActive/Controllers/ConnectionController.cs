using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VideoActive.Models;

/// <summary>
/// Connection Controller for user to get, add, accept, reject, contacts.
/// </summary>
[Route("api/connections")]
[ApiController]
public class ConnectionController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly AuthService _authService;

    public ConnectionController(ApplicationDbContext context, AuthService authService)
    {
        _context = context;
        _authService = authService;
    }


/**
 * Retrieves the list of accepted contacts for the authenticated user.
 * 
 * @returns {Task<IActionResult>} - A task representing the async operation,containing a success response with a list 
 * of contact user details,or an error response if the user is not authenticated.
 */
    public async Task<IActionResult> GetUserContacts()
    {
        var user = await _authService.GetUserFromHeader(Request.Headers["Authorization"].ToString());
        if (user == null)
            return Unauthorized(new { message = "error", details = "Invalid or expired token" });

        var contacts = await _context.Relationships
            .Where(r => (r.UserId == user.UID || r.FriendId == user.UID) && r.Status == RelationshipStatus.Accepted)
            .Include(r => r.User)
            .Include(r => r.Friend)
            .Select(r => new
            {
                ContactId = r.UserId == user.UID ? r.FriendId : r.UserId,
                ContactName = r.UserId == user.UID ? r.Friend.Username : r.User.Username,
                ProfilePic= r.UserId == user.UID ? r.Friend.ProfilePic : r.User.ProfilePic,
                Description= r.UserId == user.UID ? r.Friend.Description : r.User.Description
            })
            .ToListAsync();

        return Ok(new
        {
            message = "success",
            contacts
        });
    }

    /**
    * Sends a contact request to another user, unless already connected or pending.
    * 
    * @param {AddContactRequest} request - An object containing the target friend's user ID.
    * @returns {Task<IActionResult>} - A task representing the async operation,containing a success message if the 
    *   request was sent, or an error response if already connected, request pending, or invalid.
    */
    [HttpPost("addContact")]
    public async Task<IActionResult> AddContact([FromBody] AddContactRequest request)
    {
        if (request == null)
            return BadRequest(new { message = "error", details = "Invalid request." });

        var user = await _authService.GetUserFromHeader(Request.Headers["Authorization"].ToString());
        if (user == null)
            return Unauthorized(new { message = "error", details ="Invalid or expired token" });

        if (request.FriendId == user.UID)
            return BadRequest(new { message = "success", details ="You cannot add yourself as a contact." });

        // ✅ Check if the relationship already exists (both directions)
        var existingRelationship = await _context.Relationships.FirstOrDefaultAsync(r =>
            (r.UserId == user.UID && r.FriendId == request.FriendId) ||
            (r.UserId == request.FriendId && r.FriendId == user.UID)
        );

        if (existingRelationship != null)
        {
            if (existingRelationship.Status == RelationshipStatus.Pending)
                return BadRequest(new { message = "success", details = "Contact request already pending." });

            if (existingRelationship.Status == RelationshipStatus.Accepted)
                return BadRequest(new { message = "success", details = "You are already connected." });
        }

        // ✅ If no existing relationship, create a new one
        var newRelationship = new Relationship
        {
            UserId = user.UID,
            FriendId = request.FriendId,
            Status = RelationshipStatus.Pending
        };

        _context.Relationships.Add(newRelationship);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            return StatusCode(500, new { message = "Database error occurred while saving. Please try again.", error = ex.Message });
        }

        return Ok(new { message = "success", details ="Contact request sent successfully." });
    }


    /// <summary>
    /// Request model for initiating a new contact (friend) request.
    /// </summary>
    public class AddContactRequest
    {
        public Guid FriendId { get; set; }
    }

    /**
    * Accepts a friend request by creating a relationship with Accepted status.
    * 
    * @param {AddContactRequest} request - The friend request object containing the target user's ID.
    * @returns {Task<IActionResult>} - A task representing the async operation,
    *                                  containing a success message if the relationship is created or already exists,
    *                                  or an error response for invalid input or database issues.
    */
    [HttpPost("acceptContact")]
    public async Task<IActionResult> AcceptContact([FromBody] AddContactRequest request)
    {
        // Console.WriteLine($"Friend ID: {request.FriendId}");
        if (request == null)
            return BadRequest(new { message = "error", details = "Invalid request." });

        var user = await _authService.GetUserFromHeader(Request.Headers["Authorization"].ToString());
        if (user == null)
            return Unauthorized(new { message = "error", details = "Invalid or expired token" });

        // Check if the relationship exists and is already accepted
        var relationship = await _context.Relationships.FirstOrDefaultAsync(r =>
    (r.UserId == request.FriendId && r.FriendId == user.UID || r.UserId == user.UID && r.FriendId == request.FriendId) 
    && r.Status == RelationshipStatus.Accepted
);

        // If already accepted, return success
        if (relationship != null)
        {
            Console.WriteLine("Friend request already accepted.");
            return Ok(new { message = "success", details = "Friend request already accepted." });
        }
        else
        {
            Console.WriteLine("Creating new relationship.");
            // ✅ Directly create a new relationship with Accepted status, as there will not be any pending requests
            var newRelationship = new Relationship
            {
                UserId = user.UID,
                FriendId = request.FriendId,
                Status = RelationshipStatus.Accepted
            };

            _context.Relationships.Add(newRelationship);
        }

        try
        {
            await _context.SaveChangesAsync();
            return Ok(new { message = "success", details = "Friend request accepted successfully." });
        }
        catch (DbUpdateException ex)
        {
            return StatusCode(500, new { message = "error", details = "Database error while saving relationship.", error = ex.Message });
        }
    }

    /**
    * Rejects a pending friend request by removing the pending relationship entry.
    * 
    * @param {AddContactRequest} request - The request object containing the friend's ID.
    * @returns {Task<IActionResult>} - A task representing the async operation,
    *                                  containing a success message if the relationship is removed,
    *                                  or an error response if not found or if a database issue occurs.
    */
    [HttpPost("rejectContact")]
    public async Task<IActionResult> RejectContact([FromBody] AddContactRequest request)
    {
        if (request == null)
            return BadRequest(new { message = "error" , details ="Invalid request body." });

        var user = await _authService.GetUserFromHeader(Request.Headers["Authorization"].ToString());
        if (user == null)
            return Unauthorized(new { message = "error" , details = "Invalid or expired token" });

        // ✅ Find the existing pending relationship
        var relationship = await _context.Relationships.FirstOrDefaultAsync(r =>
            r.UserId == request.FriendId && r.FriendId == user.UID && r.Status == RelationshipStatus.Pending
        );

        if (relationship == null)
            return NotFound(new { message = "error", details = "No pending friend request found." });

        // ✅ Remove the relationship from the database
        _context.Relationships.Remove(relationship);

        try
        {
            await _context.SaveChangesAsync();
            return Ok(new { message = "success" , details = "Friend request rejected successfully." });
        }
        catch (DbUpdateException ex)
        {
            return StatusCode(500, new { message = "error" , details= "Database error while deleting relationship.", error = ex.Message });
        }
    }   
}