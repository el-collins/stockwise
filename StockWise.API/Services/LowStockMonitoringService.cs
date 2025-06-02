using StockWise.API.Services;

namespace StockWise.API.BackgroundServices
{
    public class LowStockMonitoringService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<LowStockMonitoringService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(30); // Check every 30 minutes

        public LowStockMonitoringService(
            IServiceProvider serviceProvider,
            ILogger<LowStockMonitoringService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Low Stock Monitoring Service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckLowStockProducts();
                    await Task.Delay(_checkInterval, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("Low Stock Monitoring Service is stopping");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred in Low Stock Monitoring Service");
                    await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken); // Wait 5 minutes on error
                }
            }
        }

        private async Task CheckLowStockProducts()
        {
            using var scope = _serviceProvider.CreateScope();
            var productService = scope.ServiceProvider.GetRequiredService<IProductService>();
            var messageService = scope.ServiceProvider.GetRequiredService<IMessageService>();

            try
            {
                var lowStockProducts = await productService.GetLowStockProductsAsync();
                
                foreach (var product in lowStockProducts)
                {
                    await messageService.PublishLowStockAlertAsync(
                        product.Id, 
                        product.Name, 
                        product.StockQuantity, 
                        product.LowStockThreshold);
                    
                    _logger.LogWarning("Low stock alert sent for product: {ProductName} (ID: {ProductId}), Current Stock: {CurrentStock}, Threshold: {Threshold}",
                        product.Name, product.Id, product.StockQuantity, product.LowStockThreshold);
                }

                if (lowStockProducts.Any())
                {
                    _logger.LogInformation("Processed {Count} low stock alerts", lowStockProducts.Count());
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking low stock products");
            }
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Low Stock Monitoring Service is stopping...");
            await base.StopAsync(stoppingToken);
        }
    }
} 