using RabbitMQ.Client;
using System.Text;
using System.Text.Json;

namespace StockWise.API.Services
{
    public class MessageService : IMessageService, IDisposable
    {
        private readonly IConnection _connection;
        private readonly IModel _channel;
        private readonly ILogger<MessageService> _logger;

        public MessageService(IConnectionFactory connectionFactory, ILogger<MessageService> logger)
        {
            _logger = logger;
            _connection = connectionFactory.CreateConnection();
            _channel = _connection.CreateModel();
            
            // Declare exchanges
            _channel.ExchangeDeclare("stock.events", ExchangeType.Topic, true);
            _channel.ExchangeDeclare("order.events", ExchangeType.Topic, true);
            _channel.ExchangeDeclare("alert.events", ExchangeType.Topic, true);
        }

        public async Task PublishAsync<T>(string exchange, string routingKey, T message)
        {
            try
            {
                var json = JsonSerializer.Serialize(message);
                var body = Encoding.UTF8.GetBytes(json);

                var properties = _channel.CreateBasicProperties();
                properties.Persistent = true;
                properties.Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds());

                _channel.BasicPublish(
                    exchange: exchange,
                    routingKey: routingKey,
                    basicProperties: properties,
                    body: body);

                _logger.LogInformation("Published message to {Exchange}/{RoutingKey}: {Message}", 
                    exchange, routingKey, json);

                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish message to {Exchange}/{RoutingKey}", 
                    exchange, routingKey);
                throw;
            }
        }

        public async Task PublishStockUpdateAsync(int productId, int oldQuantity, int newQuantity)
        {
            var message = new
            {
                ProductId = productId,
                OldQuantity = oldQuantity,
                NewQuantity = newQuantity,
                Timestamp = DateTime.UtcNow
            };

            await PublishAsync("stock.events", "stock.updated", message);
        }

        public async Task PublishLowStockAlertAsync(int productId, string productName, int currentStock, int threshold)
        {
            var message = new
            {
                ProductId = productId,
                ProductName = productName,
                CurrentStock = currentStock,
                Threshold = threshold,
                Timestamp = DateTime.UtcNow
            };

            await PublishAsync("alert.events", "stock.low", message);
        }

        public async Task PublishOrderPlacedAsync(int orderId, string orderNumber, decimal totalAmount)
        {
            var message = new
            {
                OrderId = orderId,
                OrderNumber = orderNumber,
                TotalAmount = totalAmount,
                Timestamp = DateTime.UtcNow
            };

            await PublishAsync("order.events", "order.placed", message);
        }

        public async Task PublishOrderCancelledAsync(int orderId, string orderNumber)
        {
            var message = new
            {
                OrderId = orderId,
                OrderNumber = orderNumber,
                Timestamp = DateTime.UtcNow
            };

            await PublishAsync("order.events", "order.cancelled", message);
        }

        public void Dispose()
        {
            _channel?.Close();
            _channel?.Dispose();
            _connection?.Close();
            _connection?.Dispose();
        }
    }
} 