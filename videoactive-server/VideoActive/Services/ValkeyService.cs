using System;
using System.Security.Authentication;
using StackExchange.Redis;

namespace VideoActive.Services
{
    public class ValkeyService
    {
        private readonly ConnectionMultiplexer _redis;
        private readonly IDatabase _db;

        public ValkeyService(string connectionString)
        {
            var options = ConfigurationOptions.Parse(connectionString);
            options.Ssl = true;  // Enable SSL
            options.SslProtocols = SslProtocols.Tls12;  // Force TLS 1.2 (or Tls13 if supported)
            options.AbortOnConnectFail = false;  // Prevent connection failures on startup

            // Ignore certificate name mismatch (for local dev)
            // The RemoteCertificateNameMismatch error happens when the SSL/TLS certificate's hostname does not match the server's hostname
            options.CertificateValidation += (sender, certificate, chain, sslPolicyErrors) => true;

            _redis = ConnectionMultiplexer.Connect(options);
            _db = _redis.GetDatabase();
        }

        /**
        * Sets a value in the Redis database with the specified key.
        * 
        * @param {string} key - The key under which the value is stored.
        * @param {string} value - The value to be stored in Redis.
        * 
        * @returns {void} - No return value.
        */
        public void SetValue(string key, string value)
        {
            _db.StringSet(key, value);
        }

        /**
        * Retrieves a value from the Redis database using the specified key.
        * 
        * @param {string} key - The key for the value to be retrieved.
        * 
        * @returns {string} - The value stored in Redis for the given key, or an empty string if not found.
        */
        public string GetValue(string key)
        {
            return _db.StringGet(key).ToString() ?? string.Empty;
        }


        /**
        * Subscribes to a Redis channel to listen for incoming messages.
        * 
        * @param {string} channel - The Redis channel to subscribe to.
        * @param {Action<RedisChannel, RedisValue>} handler - The callback handler to be invoked when a message is received on the channel.
        * 
        * @returns {void} - No return value.
        */
        public void Subscribe(string channel, Action<RedisChannel, RedisValue> handler)
        {
            var sub = _redis.GetSubscriber();
            sub.Subscribe(channel, handler);
        }

        /**
        * Publishes a message to a Redis channel. The message is serialized into JSON format before sending.
        * 
        * @param {string} channel - The Redis channel to publish the message to.
        * @param {string} message - The message to be published (in JSON format).
        * 
        * @returns {void} - No return value.
        */
        public void Publish(string channel, string message)
        {
            var sub = _redis.GetSubscriber();
            sub.Publish(channel, message);
        }
        
    }
}
