using Microsoft.EntityFrameworkCore;
using StockWise.API.Data;
using StockWise.API.DTOs;
using StockWise.API.Models;
using AutoMapper;

namespace StockWise.API.Services
{
    public interface IOrderService
    {
        Task<IEnumerable<OrderDto>> GetAllOrdersAsync();
        Task<OrderDto?> GetOrderByIdAsync(int id);
        Task<OrderDto?> GetOrderByNumberAsync(string orderNumber);
        Task<OrderDto> CreateOrderAsync(CreateOrderDto createOrderDto);
        Task<OrderDto?> UpdateOrderStatusAsync(int id, OrderStatus status);
        Task<bool> CancelOrderAsync(int id);
    }

    public class OrderService : IOrderService
    {
        private readonly StockWiseDbContext _context;
        private readonly IProductService _productService;
        private readonly IMessageService _messageService;
        private readonly IMapper _mapper;
        private readonly ILogger<OrderService> _logger;

        public OrderService(
            StockWiseDbContext context,
            IProductService productService,
            IMessageService messageService,
            IMapper mapper,
            ILogger<OrderService> logger)
        {
            _context = context;
            _productService = productService;
            _messageService = messageService;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<IEnumerable<OrderDto>> GetAllOrdersAsync()
        {
            var orders = await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            return _mapper.Map<IEnumerable<OrderDto>>(orders);
        }

        public async Task<OrderDto?> GetOrderByIdAsync(int id)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == id);

            return order == null ? null : _mapper.Map<OrderDto>(order);
        }

        public async Task<OrderDto?> GetOrderByNumberAsync(string orderNumber)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);

            return order == null ? null : _mapper.Map<OrderDto>(order);
        }

        public async Task<OrderDto> CreateOrderAsync(CreateOrderDto createOrderDto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            
            try
            {
                // Validate stock availability for all items
                var stockValidationTasks = createOrderDto.OrderItems.Select(async item =>
                {
                    var product = await _context.Products.FindAsync(item.ProductId);
                    if (product == null || !product.IsActive)
                        throw new InvalidOperationException($"Product with ID {item.ProductId} not found or inactive");
                    
                    if (product.StockQuantity < item.Quantity)
                        throw new InvalidOperationException($"Insufficient stock for product {product.Name}. Available: {product.StockQuantity}, Requested: {item.Quantity}");
                    
                    return new { Product = product, RequestedQuantity = item.Quantity };
                });

                var stockValidationResults = await Task.WhenAll(stockValidationTasks);

                // Create order
                var order = new Order
                {
                    OrderNumber = GenerateOrderNumber(),
                    CustomerName = createOrderDto.CustomerName,
                    CustomerEmail = createOrderDto.CustomerEmail,
                    Status = OrderStatus.Pending,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                // Create order items and update stock
                decimal totalAmount = 0;
                foreach (var validationResult in stockValidationResults)
                {
                    var product = validationResult.Product;
                    var requestedQuantity = validationResult.RequestedQuantity;

                    var orderItem = new OrderItem
                    {
                        OrderId = order.Id,
                        ProductId = product.Id,
                        Quantity = requestedQuantity,
                        UnitPrice = product.Price
                    };

                    _context.OrderItems.Add(orderItem);
                    totalAmount += orderItem.TotalPrice;

                    // Update stock
                    product.StockQuantity -= requestedQuantity;
                    product.UpdatedAt = DateTime.UtcNow;

                    // Publish stock update event
                    await _messageService.PublishStockUpdateAsync(
                        product.Id, 
                        product.StockQuantity + requestedQuantity, 
                        product.StockQuantity);

                    // Check for low stock alert
                    if (product.StockQuantity <= product.LowStockThreshold)
                    {
                        await _messageService.PublishLowStockAlertAsync(
                            product.Id, product.Name, product.StockQuantity, product.LowStockThreshold);
                    }
                }

                order.TotalAmount = totalAmount;
                order.Status = OrderStatus.Confirmed;
                order.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Publish order placed event
                await _messageService.PublishOrderPlacedAsync(order.Id, order.OrderNumber, order.TotalAmount);

                _logger.LogInformation("Created order {OrderNumber} with total amount {TotalAmount}", 
                    order.OrderNumber, order.TotalAmount);

                // Fetch the complete order with items for response
                var createdOrder = await GetOrderByIdAsync(order.Id);
                return createdOrder!;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating order");
                throw;
            }
        }

        public async Task<OrderDto?> UpdateOrderStatusAsync(int id, OrderStatus status)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
                return null;

            order.Status = status;
            order.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated order {Id} status to {Status}", id, status);
            return await GetOrderByIdAsync(id);
        }

        public async Task<bool> CancelOrderAsync(int id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            
            try
            {
                var order = await _context.Orders
                    .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                    .FirstOrDefaultAsync(o => o.Id == id);

                if (order == null || order.Status == OrderStatus.Cancelled)
                    return false;

                // Can only cancel pending or confirmed orders
                if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Confirmed)
                    throw new InvalidOperationException($"Cannot cancel order with status {order.Status}");

                // Restore stock for all items
                foreach (var orderItem in order.OrderItems)
                {
                    var product = orderItem.Product;
                    var oldQuantity = product.StockQuantity;
                    product.StockQuantity += orderItem.Quantity;
                    product.UpdatedAt = DateTime.UtcNow;

                    // Publish stock update event
                    await _messageService.PublishStockUpdateAsync(
                        product.Id, oldQuantity, product.StockQuantity);
                }

                order.Status = OrderStatus.Cancelled;
                order.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Publish order cancelled event
                await _messageService.PublishOrderCancelledAsync(order.Id, order.OrderNumber);

                _logger.LogInformation("Cancelled order {OrderNumber} and restored stock", order.OrderNumber);
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error cancelling order {Id}", id);
                throw;
            }
        }

        private string GenerateOrderNumber()
        {
            return $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
        }
    }
} 