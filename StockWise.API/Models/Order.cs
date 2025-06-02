using System.ComponentModel.DataAnnotations;

namespace StockWise.API.Models
{
    public class Order
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(50)]
        public string OrderNumber { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string CustomerName { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        public string CustomerEmail { get; set; } = string.Empty;
        
        [Range(0.01, double.MaxValue, ErrorMessage = "Total amount must be greater than 0")]
        public decimal TotalAmount { get; set; }
        
        public OrderStatus Status { get; set; } = OrderStatus.Pending;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
    
    public enum OrderStatus
    {
        Pending = 0,
        Confirmed = 1,
        Processing = 2,
        Shipped = 3,
        Delivered = 4,
        Cancelled = 5
    }
} 