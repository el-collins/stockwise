using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using StockWise.API.DTOs;
using StockWise.API.Models;
using StockWise.API.Services;

namespace StockWise.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private readonly ILogger<OrdersController> _logger;

        public OrdersController(IOrderService orderService, ILogger<OrdersController> logger)
        {
            _orderService = orderService;
            _logger = logger;
        }

        /// <summary>
        /// Get all orders
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderDto>>> GetOrders()
        {
            try
            {
                var orders = await _orderService.GetAllOrdersAsync();
                return Ok(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving orders");
                return StatusCode(500, "An error occurred while retrieving orders");
            }
        }

        /// <summary>
        /// Get a specific order by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<OrderDto>> GetOrder(int id)
        {
            try
            {
                var order = await _orderService.GetOrderByIdAsync(id);
                if (order == null)
                    return NotFound($"Order with ID {id} not found");

                return Ok(order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving order {Id}", id);
                return StatusCode(500, "An error occurred while retrieving the order");
            }
        }

        /// <summary>
        /// Get an order by order number
        /// </summary>
        [HttpGet("number/{orderNumber}")]
        public async Task<ActionResult<OrderDto>> GetOrderByNumber(string orderNumber)
        {
            try
            {
                var order = await _orderService.GetOrderByNumberAsync(orderNumber);
                if (order == null)
                    return NotFound($"Order with number {orderNumber} not found");

                return Ok(order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving order {OrderNumber}", orderNumber);
                return StatusCode(500, "An error occurred while retrieving the order");
            }
        }

        /// <summary>
        /// Create a new order
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<OrderDto>> CreateOrder(CreateOrderDto createOrderDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var order = await _orderService.CreateOrderAsync(createOrderDto);
                if (order == null)
                    return BadRequest("Unable to create order. Please check product availability.");

                return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating order");
                return StatusCode(500, "An error occurred while creating the order");
            }
        }

        /// <summary>
        /// Update order status
        /// </summary>
        [HttpPatch("{id}/status")]
        public async Task<ActionResult<OrderDto>> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto updateStatusDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var order = await _orderService.UpdateOrderStatusAsync(id, updateStatusDto.Status);
                if (order == null)
                    return NotFound($"Order with ID {id} not found");

                return Ok(order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating order status {Id}", id);
                return StatusCode(500, "An error occurred while updating the order status");
            }
        }

        /// <summary>
        /// Cancel an order
        /// </summary>
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            try
            {
                var result = await _orderService.CancelOrderAsync(id);
                if (!result)
                    return NotFound($"Order with ID {id} not found or cannot be cancelled");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling order {Id}", id);
                return StatusCode(500, "An error occurred while cancelling the order");
            }
        }
    }

    public class UpdateOrderStatusDto
    {
        public OrderStatus Status { get; set; }
    }
} 