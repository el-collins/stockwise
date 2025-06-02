using Microsoft.EntityFrameworkCore;
using StockWise.API.Models;

namespace StockWise.API.Data
{
    public class StockWiseDbContext : DbContext
    {
        public StockWiseDbContext(DbContextOptions<StockWiseDbContext> options) : base(options)
        {
        }
        
        public DbSet<Product> Products { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<User> Users { get; set; }
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Product configuration
            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.SKU).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.Category).HasMaxLength(50);
                entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
                entity.HasIndex(e => e.SKU).IsUnique();
                entity.HasIndex(e => e.Name);
                entity.HasIndex(e => e.Category);
            });
            
            // Order configuration
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.OrderNumber).IsRequired().HasMaxLength(50);
                entity.Property(e => e.CustomerName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.CustomerEmail).IsRequired().HasMaxLength(200);
                entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
                entity.HasIndex(e => e.OrderNumber).IsUnique();
                entity.HasIndex(e => e.CustomerEmail);
            });
            
            // OrderItem configuration
            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
                
                entity.HasOne(e => e.Order)
                    .WithMany(o => o.OrderItems)
                    .HasForeignKey(e => e.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(e => e.Product)
                    .WithMany(p => p.OrderItems)
                    .HasForeignKey(e => e.ProductId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
            
            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Username).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.Property(e => e.FirstName).HasMaxLength(100);
                entity.Property(e => e.LastName).HasMaxLength(100);
                entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
            });
            
            // Seed data
            SeedData(modelBuilder);
        }
        
        private void SeedData(ModelBuilder modelBuilder)
        {
            // Seed Users
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    Id = 1,
                    Username = "admin",
                    Email = "admin@stockwise.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"), // Default password
                    FirstName = "Admin",
                    LastName = "User",
                    Role = "Admin",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new User
                {
                    Id = 2,
                    Username = "demo",
                    Email = "demo@stockwise.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("demo123"), // Default password
                    FirstName = "Demo",
                    LastName = "User",
                    Role = "User",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            );

            // Seed Products
            modelBuilder.Entity<Product>().HasData(
                new Product
                {
                    Id = 1,
                    Name = "Laptop",
                    Description = "High-performance laptop",
                    SKU = "LAP001",
                    Price = 999.99m,
                    StockQuantity = 50,
                    LowStockThreshold = 10,
                    Category = "Electronics",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    Id = 2,
                    Name = "Wireless Mouse",
                    Description = "Ergonomic wireless mouse",
                    SKU = "MOU001",
                    Price = 29.99m,
                    StockQuantity = 100,
                    LowStockThreshold = 20,
                    Category = "Electronics",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Product
                {
                    Id = 3,
                    Name = "Mechanical Keyboard",
                    Description = "RGB mechanical keyboard",
                    SKU = "KEY001",
                    Price = 79.99m,
                    StockQuantity = 5,
                    LowStockThreshold = 10,
                    Category = "Electronics",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            );
        }
    }
} 