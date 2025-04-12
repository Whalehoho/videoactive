using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using VideoActive.Models;
using System.Text.Json;

[Route("api/callLog")]
[ApiController]

/// <summary>
/// CallLogController Controller for recording call log for the users.
/// </summary>
public class CallLogController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly AuthService _authService;

    public CallLogController(ApplicationDbContext context, AuthService authService)
    {
        _context = context;
        _authService = authService;
    }

    /**
    * Logs the start of a call between two users.
    * 
    * @param {AddStartCallRequest} request - An object containing the CallerId, CalleeId, and CallType.
    * @returns {Task<IActionResult>} - A task representing the async operation,
    *                                  containing a success message if added successfully,
    *                                  or an error message if the request is invalid or unauthorized.
    */
    [HttpPost("startCall")]
    public async Task<IActionResult> StartCall([FromBody] AddStartCallRequest request)
    {
        // print callerId, calleeId, callType
        Console.WriteLine($"CallerId: {request.CallerId}, CalleeId: {request.CalleeId}, CallType: {request.CallType}");
        if (request == null)
            return BadRequest(new { message = "error", details = "Invalid request." });

        var user = await _authService.GetUserFromHeader(Request.Headers["Authorization"].ToString());
        // print user
        Console.WriteLine($"UserId: {user?.UID}");
        if (user == null)
            return Unauthorized(new { message = "error", details = "Invalid or expired token" });

        if (request.CallerId != user.UID){
            Console.WriteLine("Invalid caller");
            // print type of request.CallerId
            Console.WriteLine($"Type of request.CallerId: {request.CallerId.GetType()}");
            // print type of user.UID
            Console.WriteLine($"Type of user.UID: {user.UID.GetType()}");
            return Unauthorized(new { message = "error", details = "Invalid caller." });
        }

        var callee = await _context.Users.FirstOrDefaultAsync(u => u.UID == request.CalleeId);
        if (callee == null)
            return BadRequest(new { message = "error", details = "Invalid callee." });

        var callLog = new CallLog
        {
            CallerId = user.UID,
            CalleeId = callee.UID,
            CallType = request.CallType
        };
        _context.CallLogs.Add(callLog);
        await _context.SaveChangesAsync();

        return Ok(new { message = "success", details = "Call log added successfully." });
    }

    /**
    * Marks the end of an active call by updating the corresponding call log with the end time.
    * 
    * @param {AddEndCallRequest} request - An object containing the CallerId and CalleeId of the ongoing call.
    * @returns {Task<IActionResult>} - A task representing the async operation,
    *                                  containing a success message if updated successfully,
    *                                  or an error message if the call log is not found or unauthorized.
    */
    [HttpPost("endCall")]
    public async Task<IActionResult> EndCall([FromBody] AddEndCallRequest request)
    {
        if (request == null)
            return BadRequest(new { message = "error", details = "Invalid request." });

        var user = await _authService.GetUserFromHeader(Request.Headers["Authorization"].ToString());
        if (user == null)
            return Unauthorized(new { message = "error", details = "Invalid or expired token" });

        if (request.CallerId != user.UID)
            return Unauthorized(new { message = "error", details = "Invalid caller." });

        var callLog = await _context.CallLogs.FirstOrDefaultAsync(c => c.CallerId == request.CallerId && c.CalleeId == request.CalleeId && c.EndTime == null);
        if (callLog == null)
            return BadRequest(new { message = "error", details = "Call log not found." });

        callLog.EndTime = DateTime.UtcNow;
        _context.CallLogs.Update(callLog);
        await _context.SaveChangesAsync();

        return Ok(new { message = "success", details = "Call log updated successfully." });
    }
}

/**
 * Request model for starting a call.
 * 
 * @param {Guid} CallerId - The unique identifier of the user initiating the call.
 * @param {Guid} CalleeId - The unique identifier of the user receiving the call.
 * @param {string} CallType - The type of the call (e.g., audio, video).
 */
public class AddStartCallRequest
{
    public Guid CallerId { get; set; }
    public Guid CalleeId { get; set; }
    public string? CallType { get; set; }
}

/**
 * Request model for ending a call.
 * 
 * @param {Guid} CallerId - The unique identifier of the user who initiated the call.
 * @param {Guid} CalleeId - The unique identifier of the user who received the call.
 */
public class AddEndCallRequest
{
    public Guid CallerId { get; set; }
    public Guid CalleeId { get; set; }
}


