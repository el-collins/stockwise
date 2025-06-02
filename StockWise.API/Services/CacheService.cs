using StackExchange.Redis;
using System.Text.Json;

namespace StockWise.API.Services
{
    public class CacheService : ICacheService
    {
        private readonly IDatabase _database;
        private readonly IConnectionMultiplexer _connectionMultiplexer;
        private readonly ILogger<CacheService> _logger;

        public CacheService(IConnectionMultiplexer connectionMultiplexer, ILogger<CacheService> logger)
        {
            _connectionMultiplexer = connectionMultiplexer;
            _database = connectionMultiplexer.GetDatabase();
            _logger = logger;
        }

        public async Task<T?> GetAsync<T>(string key)
        {
            try
            {
                var value = await _database.StringGetAsync(key);
                if (!value.HasValue)
                    return default;

                return JsonSerializer.Deserialize<T>(value!);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting value from cache for key: {Key}", key);
                return default;
            }
        }

        public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null)
        {
            try
            {
                var serializedValue = JsonSerializer.Serialize(value);
                await _database.StringSetAsync(key, serializedValue, expiration);
                _logger.LogInformation("Cached value for key: {Key}", key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting value in cache for key: {Key}", key);
            }
        }

        public async Task RemoveAsync(string key)
        {
            try
            {
                await _database.KeyDeleteAsync(key);
                _logger.LogInformation("Removed cached value for key: {Key}", key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing value from cache for key: {Key}", key);
            }
        }

        public async Task RemoveByPatternAsync(string pattern)
        {
            try
            {
                var endpoints = _connectionMultiplexer.GetEndPoints();
                var server = _connectionMultiplexer.GetServer(endpoints.First());
                
                var keys = server.Keys(pattern: pattern);
                foreach (var key in keys)
                {
                    await _database.KeyDeleteAsync(key);
                }
                
                _logger.LogInformation("Removed cached values for pattern: {Pattern}", pattern);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing values from cache for pattern: {Pattern}", pattern);
            }
        }

        public async Task<bool> ExistsAsync(string key)
        {
            try
            {
                return await _database.KeyExistsAsync(key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if key exists in cache: {Key}", key);
                return false;
            }
        }
    }
} 