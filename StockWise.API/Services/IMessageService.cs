namespace StockWise.API.Services
{
    public interface IMessageService
    {
        Task PublishAsync<T>(string exchange, string routingKey, T message);
        Task PublishStockUpdateAsync(int productId, int oldQuantity, int newQuantity);
        Task PublishLowStockAlertAsync(int productId, string productName, int currentStock, int threshold);
        Task PublishOrderPlacedAsync(int orderId, string orderNumber, decimal totalAmount);
        Task PublishOrderCancelledAsync(int orderId, string orderNumber);
    }
} 