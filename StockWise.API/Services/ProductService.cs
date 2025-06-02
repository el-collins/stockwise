using Microsoft.EntityFrameworkCore;
using StockWise.API.Data;
using StockWise.API.DTOs;
using StockWise.API.Models;
using AutoMapper;

namespace StockWise.API.Services
{
    public interface IProductService
    {
        Task<IEnumerable<ProductDto>> GetAllProductsAsync();
        Task<ProductDto?> GetProductByIdAsync(int id);
        Task<ProductDto?> GetProductBySkuAsync(string sku);
        Task<ProductDto> CreateProductAsync(CreateProductDto createProductDto);
        Task<ProductDto?> UpdateProductAsync(int id, UpdateProductDto updateProductDto);
        Task<bool> DeleteProductAsync(int id);
        Task<bool> UpdateStockAsync(int productId, int newQuantity);
        Task<IEnumerable<ProductDto>> GetLowStockProductsAsync();
    }

    public class ProductService : IProductService
    {
        private readonly StockWiseDbContext _context;
        private readonly ICacheService _cacheService;
        private readonly IMessageService _messageService;
        private readonly IMapper _mapper;
        private readonly ILogger<ProductService> _logger;
        private const string PRODUCT_CACHE_KEY = "product:";
        private const string ALL_PRODUCTS_CACHE_KEY = "products:all";
        private readonly TimeSpan _cacheExpiration = TimeSpan.FromMinutes(30);

        public ProductService(
            StockWiseDbContext context,
            ICacheService cacheService,
            IMessageService messageService,
            IMapper mapper,
            ILogger<ProductService> logger)
        {
            _context = context;
            _cacheService = cacheService;
            _messageService = messageService;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<IEnumerable<ProductDto>> GetAllProductsAsync()
        {
            var cachedProducts = await _cacheService.GetAsync<IEnumerable<ProductDto>>(ALL_PRODUCTS_CACHE_KEY);
            if (cachedProducts != null)
            {
                _logger.LogInformation("Retrieved products from cache");
                return cachedProducts;
            }

            var products = await _context.Products
                .Where(p => p.IsActive)
                .OrderBy(p => p.Name)
                .ToListAsync();

            var productDtos = _mapper.Map<IEnumerable<ProductDto>>(products);
            await _cacheService.SetAsync(ALL_PRODUCTS_CACHE_KEY, productDtos, _cacheExpiration);

            _logger.LogInformation("Retrieved {Count} products from database", products.Count);
            return productDtos;
        }

        public async Task<ProductDto?> GetProductByIdAsync(int id)
        {
            var cacheKey = $"{PRODUCT_CACHE_KEY}{id}";
            var cachedProduct = await _cacheService.GetAsync<ProductDto>(cacheKey);
            if (cachedProduct != null)
            {
                _logger.LogInformation("Retrieved product {Id} from cache", id);
                return cachedProduct;
            }

            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);

            if (product == null)
                return null;

            var productDto = _mapper.Map<ProductDto>(product);
            await _cacheService.SetAsync(cacheKey, productDto, _cacheExpiration);

            _logger.LogInformation("Retrieved product {Id} from database", id);
            return productDto;
        }

        public async Task<ProductDto?> GetProductBySkuAsync(string sku)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.SKU == sku && p.IsActive);

            return product == null ? null : _mapper.Map<ProductDto>(product);
        }

        public async Task<ProductDto> CreateProductAsync(CreateProductDto createProductDto)
        {
            var product = _mapper.Map<Product>(createProductDto);
            product.CreatedAt = DateTime.UtcNow;
            product.UpdatedAt = DateTime.UtcNow;

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            // Invalidate cache
            await _cacheService.RemoveAsync(ALL_PRODUCTS_CACHE_KEY);

            _logger.LogInformation("Created product {Id} with SKU {SKU}", product.Id, product.SKU);
            return _mapper.Map<ProductDto>(product);
        }

        public async Task<ProductDto?> UpdateProductAsync(int id, UpdateProductDto updateProductDto)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null || !product.IsActive)
                return null;

            var oldQuantity = product.StockQuantity;

            // Update only provided fields
            if (!string.IsNullOrEmpty(updateProductDto.Name))
                product.Name = updateProductDto.Name;
            if (!string.IsNullOrEmpty(updateProductDto.Description))
                product.Description = updateProductDto.Description;
            if (updateProductDto.Price.HasValue)
                product.Price = updateProductDto.Price.Value;
            if (updateProductDto.StockQuantity.HasValue)
                product.StockQuantity = updateProductDto.StockQuantity.Value;
            if (updateProductDto.LowStockThreshold.HasValue)
                product.LowStockThreshold = updateProductDto.LowStockThreshold.Value;
            if (!string.IsNullOrEmpty(updateProductDto.Category))
                product.Category = updateProductDto.Category;
            if (updateProductDto.IsActive.HasValue)
                product.IsActive = updateProductDto.IsActive.Value;

            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Invalidate cache
            await _cacheService.RemoveAsync($"{PRODUCT_CACHE_KEY}{id}");
            await _cacheService.RemoveAsync(ALL_PRODUCTS_CACHE_KEY);

            // Publish stock update event if quantity changed
            if (updateProductDto.StockQuantity.HasValue && oldQuantity != product.StockQuantity)
            {
                await _messageService.PublishStockUpdateAsync(product.Id, oldQuantity, product.StockQuantity);
                
                // Check for low stock alert
                if (product.StockQuantity <= product.LowStockThreshold)
                {
                    await _messageService.PublishLowStockAlertAsync(
                        product.Id, product.Name, product.StockQuantity, product.LowStockThreshold);
                }
            }

            _logger.LogInformation("Updated product {Id}", id);
            return _mapper.Map<ProductDto>(product);
        }

        public async Task<bool> DeleteProductAsync(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
                return false;

            product.IsActive = false;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Invalidate cache
            await _cacheService.RemoveAsync($"{PRODUCT_CACHE_KEY}{id}");
            await _cacheService.RemoveAsync(ALL_PRODUCTS_CACHE_KEY);

            _logger.LogInformation("Soft deleted product {Id}", id);
            return true;
        }

        public async Task<bool> UpdateStockAsync(int productId, int newQuantity)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null || !product.IsActive)
                return false;

            var oldQuantity = product.StockQuantity;
            product.StockQuantity = newQuantity;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Invalidate cache
            await _cacheService.RemoveAsync($"{PRODUCT_CACHE_KEY}{productId}");
            await _cacheService.RemoveAsync(ALL_PRODUCTS_CACHE_KEY);

            // Publish stock update event
            await _messageService.PublishStockUpdateAsync(productId, oldQuantity, newQuantity);

            // Check for low stock alert
            if (newQuantity <= product.LowStockThreshold)
            {
                await _messageService.PublishLowStockAlertAsync(
                    productId, product.Name, newQuantity, product.LowStockThreshold);
            }

            _logger.LogInformation("Updated stock for product {Id} from {OldQuantity} to {NewQuantity}", 
                productId, oldQuantity, newQuantity);
            return true;
        }

        public async Task<IEnumerable<ProductDto>> GetLowStockProductsAsync()
        {
            var products = await _context.Products
                .Where(p => p.IsActive && p.StockQuantity <= p.LowStockThreshold)
                .OrderBy(p => p.StockQuantity)
                .ToListAsync();

            _logger.LogInformation("Found {Count} low stock products", products.Count);
            return _mapper.Map<IEnumerable<ProductDto>>(products);
        }
    }
} 