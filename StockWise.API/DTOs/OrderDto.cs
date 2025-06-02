using System.ComponentModel.DataAnnotations;
using StockWise.API.Models;

namespace StockWise.API.DTOs
{
    public class OrderDto
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public OrderStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<OrderItemDto> OrderItems { get; set; } = new();
    }
    
    public class CreateOrderDto
    {
        [Required]
        [StringLength(100)]
        public string CustomerName { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        public string CustomerEmail { get; set; } = string.Empty;
        
        [Required]
        [MinLength(1, ErrorMessage = "At least one order item is required")]
        public List<CreateOrderItemDto> OrderItems { get; set; } = new();
    }
    
    public class OrderItemDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductSKU { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
    }
    
    public class CreateOrderItemDto
    {
        [Required]
        public int ProductId { get; set; }
        
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
        public int Quantity { get; set; }
    }
    
    public class UpdateOrderStatusDto
    {
        [Required]
        public OrderStatus Status { get; set; }
    }
} 