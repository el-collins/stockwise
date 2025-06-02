using System.ComponentModel.DataAnnotations;

namespace StockWise.API.DTOs
{
    public class ProductDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string SKU { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public int LowStockThreshold { get; set; }
        public string? Category { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
    
    public class CreateProductDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        [Required]
        [StringLength(50)]
        public string SKU { get; set; } = string.Empty;
        
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than 0")]
        public decimal Price { get; set; }
        
        [Required]
        [Range(0, int.MaxValue, ErrorMessage = "Stock quantity cannot be negative")]
        public int StockQuantity { get; set; }
        
        [Required]
        [Range(0, int.MaxValue, ErrorMessage = "Low stock threshold cannot be negative")]
        public int LowStockThreshold { get; set; }
        
        [StringLength(50)]
        public string? Category { get; set; }
    }
    
    public class UpdateProductDto
    {
        [StringLength(100)]
        public string? Name { get; set; }
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than 0")]
        public decimal? Price { get; set; }
        
        [Range(0, int.MaxValue, ErrorMessage = "Stock quantity cannot be negative")]
        public int? StockQuantity { get; set; }
        
        [Range(0, int.MaxValue, ErrorMessage = "Low stock threshold cannot be negative")]
        public int? LowStockThreshold { get; set; }
        
        [StringLength(50)]
        public string? Category { get; set; }
        
        public bool? IsActive { get; set; }
    }
} 