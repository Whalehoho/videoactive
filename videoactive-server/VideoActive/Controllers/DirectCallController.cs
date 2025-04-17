using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using Newtonsoft.Json;
using VideoActive.Services;
using VideoActive.Models;
using Microsoft.EntityFrameworkCore;
    /// <summary>
    /// Direct Call Controller handles WebSocket connections including fowarding, receiving messages. 
    /// Manages Contact List including notifying online/offline status.
    /// </summary>
namespace VideoActive.WebSocketHandlers
{
    public class DirectCallHandler
    {
        private static ApplicationDbContext _context;

        /**
        * Initializes the WebSocket handler with the provided database context.
        * 
        * @param {ApplicationDbContext} context - The application database context.
        */
        public static void Initialize(ApplicationDbContext context)
        {
            _context = context;
        }

        /**
        * Static constructor to load configuration settings.
        */
        static DirectCallHandler()
        {
            var configuration = new ConfigurationBuilder().AddJsonFile("appsettings.json").Build();
        }
        // Dictionary to track client contacts
        private static readonly Dictionary<string, List<string>> clientContacts = new()
        {
            
        };
        // Dictionary to track connected WebSocket clients
        private static readonly Dictionary<string, WebSocket?> clientPools = new()
        {
            
        };
        // Concurrent dictionary to manage active WebSocket connections
        private static ConcurrentDictionary<string, WebSocket> activeSockets = new();

        
        /**
        * Handles a new WebSocket connection for a client, assigns them an ID, and processes incoming messages.
        * 
        * @param {WebSocket} socket - The WebSocket connection instance.
        * @param {string} clientId - The unique identifier for the client.
        * @returns {Task} - A task representing the async operation.
        */
        public static async Task HandleWebSocketAsync(WebSocket socket, string? clientId)
        {
            // Console.WriteLine($"valkeyConnectionString: {_valkeyConnectionString}");
            // Console.WriteLine($"valkeyConnection: {_valkeyService}");
            // Console.WriteLine($"Getting value from valkey: {_valkeyService.GetValue("test-key")}");

            if (clientId is null)
            {
                Console.WriteLine("Client ID not provided.");
                return;
            }

            // Check if client is already connected
            // if (clientPools.ContainsKey(clientId) && clientPools[clientId] != null)
            // {
            //     Console.WriteLine($"Client {clientId} is already connected.");
            //     return;
            // }
            // Add client to clientPools
            clientPools[clientId] = socket;
            // Set now to valkey
            // _valkeyService.SetValue(clientId, DateTime.Now.ToString());
           

            // Broadcast online contacts to all clients
            await Online(clientId);

            // Handle incoming messages
            await ReceiveMessages(socket, clientId);
        }

        /**
        * Receives messages from a WebSocket connection, processes them, and forwards to the target client if needed.
        * 
        * @param {WebSocket} socket - The WebSocket connection instance.
        * @param {string} clientId - The unique identifier for the client sending the message.
        * @returns {Task} - A task representing the async operation.
        */
        private static async Task ReceiveMessages(WebSocket socket, string clientId)
        {
            var buffer = new byte[8192]; 
            var messageBuilder = new StringBuilder();

            try
            { 
                while (socket.State == WebSocketState.Open)
                {
                    var result = await socket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        clientPools[clientId] = null;
                        // _valkeyService.SetValue(clientId, "");
                        await Offline(clientId); //notify all clients that this client is offline
                        await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closed by client", CancellationToken.None);
                    }
                    else
                    {
                        Console.WriteLine($"Received message from {clientId}");
                        // First check if it's a ping message before processing
                        var messageChunk = Encoding.UTF8.GetString(buffer, 0, result.Count);
                        
                        // Try to parse as JSON to check for ping
                        try
                        {
                            var json = JsonConvert.DeserializeObject<dynamic>(messageChunk);
                            if (json?.type == "ping")
                            {
                                // Skip ping messages completely
                                continue;
                            }
                        }
                        catch
                        {
                            // ignore parse errors (not JSON or not ping)
                        }

                        // Only process non-ping messages
                        messageBuilder.Append(messageChunk);
                        if (result.EndOfMessage)
                        {
                            var message = messageBuilder.ToString();
                            await ForwardMessage(socket, message);
                            messageBuilder.Clear();
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ReceiveMessages Error: {ex.Message}");
            }
        }

        /**
        * Sends a message to a target client identified by their clientId.
        * 
        * @param {string} targetClientId - The unique identifier for the target client.
        * @param {string} message - The message to be sent.
        * @returns {Task} - A task representing the async operation.
        */
        private static async Task SendMessageToTargetClient(string targetClientId, string message)
        {
            if (clientPools.TryGetValue(targetClientId, out WebSocket? targetSocket) && targetSocket?.State == WebSocketState.Open)
            {
                var buffer = Encoding.UTF8.GetBytes(message);
                await targetSocket.SendAsync(
                    new ArraySegment<byte>(buffer),
                    WebSocketMessageType.Text,
                    true,
                    CancellationToken.None
                );
            }
            else
            {
                Console.WriteLine($"Target client {targetClientId} not found or not connected.");
            }
        }

        /**
        * Forwards a message from one client to the target client based on the 'to' field in the message.
        * 
        * @param {WebSocket} sender - The WebSocket instance of the sender.
        * @param {string} message - The message to be forwarded.
        * @returns {Task} - A task representing the async operation.
        */
        private static async Task ForwardMessage(WebSocket sender, string message)
        {
            if(clientPools.FirstOrDefault(x => x.Value == sender).Key is string senderId)
            {
                // Console.WriteLine($"Forwarding message from {senderId}");
                var messageObject = JsonConvert.DeserializeObject<dynamic>(message);
                // Console.WriteLine($"Message object: {messageObject}");
                var targetClientId = messageObject?.to.ToString();
                // Console.WriteLine($"Target client ID: {targetClientId}");

                // Fetch target client's socket and send the message
                await SendMessageToTargetClient(targetClientId, message);

            }
        }

        /**
        * Marks a client as online and notifies their contacts.
        * 
        * @param {string} clientId - The unique identifier of the client.
        * @returns {Task} - A task representing the async operation.
        */
        public static async Task Online(string clientId)
        {

            // Set user status to online in the database
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UID == Guid.Parse(clientId));
            if (user != null)
            {
                user.Status = UserStatus.Online;
                await _context.SaveChangesAsync();
            }

            var contacts = await _context.Relationships
            .Where(r => (r.UserId == Guid.Parse(clientId) || r.FriendId == Guid.Parse(clientId)) && r.Status == RelationshipStatus.Accepted)
            .Select(r => new
            {
                ContactId = r.UserId == Guid.Parse(clientId) ? r.FriendId : r.UserId,
                ContactName = r.UserId == Guid.Parse(clientId) ? r.Friend.Username : r.User.Username
            })
            .ToListAsync();
            //iterate and print the contacts
            foreach (var contact in contacts)
            {
                Console.WriteLine($"Contact: {contact}");
            }
            //Contact: { ContactId = 2, ContactName = whale hoho }
            //Contact: { ContactId = 3, ContactName = 蓝鲸吼 }

            // Get my username
            var myUsername = await _context.Users
                .Where(u => u.UID == Guid.Parse(clientId))
                .Select(u => u.Username)
                .FirstOrDefaultAsync();

            // Iterate through clientPools to find contact, if found, tell them that the client is online
            foreach (var contact in contacts)
            {
                if (clientPools.TryGetValue(contact.ContactId.ToString(), out WebSocket? contactSocket) && contactSocket?.State == WebSocketState.Open)
                {
                    var message = JsonConvert.SerializeObject(new
                    {
                        type = "contact-online",
                        contact = new
                        {
                            contactId = clientId,
                            contactName = myUsername
                        }
                    });

                    var messageBuffer = Encoding.UTF8.GetBytes(message);
                    await contactSocket.SendAsync(new ArraySegment<byte>(messageBuffer), WebSocketMessageType.Text, true, CancellationToken.None);
                }
            }

            // Use contacts to get user's online contacts from clientPools (socket is not null and state is open) and tell user that they are online
            if (clientPools.TryGetValue(clientId, out WebSocket? clientSocket) && clientSocket?.State == WebSocketState.Open)
            {
                var onlineContacts = contacts.Where(c => clientPools.TryGetValue(c.ContactId.ToString(), out WebSocket? contactSocket) && contactSocket?.State == WebSocketState.Open)
                    .Select(c => new
                    {
                        contactId = c.ContactId,
                        contactName = c.ContactName
                    });

                var message = JsonConvert.SerializeObject(new
                {
                    type = "online-contacts",
                    contacts = onlineContacts
                });

                var messageBuffer = Encoding.UTF8.GetBytes(message);
                await clientSocket.SendAsync(new ArraySegment<byte>(messageBuffer), WebSocketMessageType.Text, true, CancellationToken.None);
            }
        }

        /**
        * Marks a client as offline and notifies their contacts.
        * 
        * @param {string} clientId - The unique identifier of the client.
        * @returns {Task} - A task representing the async operation.
        */
        public static async Task Offline(string clientId)
        {
            // Set user status to offline in the database
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UID == Guid.Parse(clientId));
            if (user != null)
            {
                user.Status = UserStatus.Offline;
                await _context.SaveChangesAsync();
            }


            var contacts = await _context.Relationships
            .Where(r => (r.UserId == Guid.Parse(clientId) || r.FriendId == Guid.Parse(clientId)) && r.Status == RelationshipStatus.Accepted)
            .Select(r => new
            {
                ContactId = r.UserId == Guid.Parse(clientId) ? r.FriendId : r.UserId,
                ContactName = r.UserId == Guid.Parse(clientId) ? r.Friend.Username : r.User.Username
            })
            .ToListAsync();

            // Get my username
            var myUsername = await _context.Users
                .Where(u => u.UID == Guid.Parse(clientId))
                .Select(u => u.Username)
                .FirstOrDefaultAsync();

            foreach (var contact in contacts)
            {
                if (clientPools.TryGetValue(contact.ContactId.ToString(), out WebSocket? contactSocket) && contactSocket?.State == WebSocketState.Open)
                {
                    var message = JsonConvert.SerializeObject(new
                    {
                        type = "contact-offline",
                        contact = new
                        {
                            contactId = clientId,
                            contactName = myUsername
                        }
                    });

                    var messageBuffer = Encoding.UTF8.GetBytes(message);
                    await contactSocket.SendAsync(new ArraySegment<byte>(messageBuffer), WebSocketMessageType.Text, true, CancellationToken.None);
                }
            }
        }

    }
}
