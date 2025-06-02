using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using StockWise.API.DTOs;
using StockWise.API.Services;

namespace StockWise.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _productService;
        private readonly ILogger<ProductsController> _logger;

        public ProductsController(IProductService productService, ILogger<ProductsController> logger)
        {
            _productService = productService;
            _logger = logger;
        }

        /// <summary>
        /// Get all active products
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts()
        {
            try
            {
                var products = await _productService.GetAllProductsAsync();
                return Ok(products);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving products");
                return StatusCode(500, "An error occurred while retrieving products");
            }
        }

        /// <summary>
        /// Get a specific product by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductDto>> GetProduct(int id)
        {
            try
            {
                var product = await _productService.GetProductByIdAsync(id);
                if (product == null)
                    return NotFound($"Product with ID {id} not found");

                return Ok(product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product {Id}", id);
                return StatusCode(500, "An error occurred while retrieving the product");
            }
        }

        /// <summary>
        /// Get a product by SKU
        /// </summary>
        [HttpGet("sku/{sku}")]
        public async Task<ActionResult<ProductDto>> GetProductBySku(string sku)
        {
            try
            {
                var product = await _productService.GetProductBySkuAsync(sku);
                if (product == null)
                    return NotFound($"Product with SKU {sku} not found");

                return Ok(product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product with SKU {SKU}", sku);
                return StatusCode(500, "An error occurred while retrieving the product");
            }
        }

        /// <summary>
        /// Create a new product
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ProductDto>> CreateProduct(CreateProductDto createProductDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var product = await _productService.CreateProductAsync(createProductDto);
                return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product");
                return StatusCode(500, "An error occurred while creating the product");
            }
        }

        /// <summary>
        /// Update an existing product
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<ProductDto>> UpdateProduct(int id, UpdateProductDto updateProductDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var product = await _productService.UpdateProductAsync(id, updateProductDto);
                if (product == null)
                    return NotFound($"Product with ID {id} not found");

                return Ok(product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product {Id}", id);
                return StatusCode(500, "An error occurred while updating the product");
            }
        }

        /// <summary>
        /// Delete a product (soft delete)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            try
            {
                var result = await _productService.DeleteProductAsync(id);
                if (!result)
                    return NotFound($"Product with ID {id} not found");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product {Id}", id);
                return StatusCode(500, "An error occurred while deleting the product");
            }
        }

        /// <summary>
        /// Update product stock quantity
        /// </summary>
        [HttpPatch("{id}/stock")]
        public async Task<IActionResult> UpdateStock(int id, [FromBody] UpdateStockDto updateStockDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var result = await _productService.UpdateStockAsync(id, updateStockDto.Quantity);
                if (!result)
                    return NotFound($"Product with ID {id} not found");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating stock for product {Id}", id);
                return StatusCode(500, "An error occurred while updating the stock");
            }
        }

        /// <summary>
        /// Get products with low stock
        /// </summary>
        [HttpGet("low-stock")]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetLowStockProducts()
        {
            try
            {
                var products = await _productService.GetLowStockProductsAsync();
                return Ok(products);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving low stock products");
                return StatusCode(500, "An error occurred while retrieving low stock products");
            }
        }
    }

    public class UpdateStockDto
    {
        public int Quantity { get; set; }
    }
} 