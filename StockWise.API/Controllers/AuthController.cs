using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using StockWise.API.DTOs;
using StockWise.API.Services;

namespace StockWise.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.LoginAsync(loginDto);
            if (result == null)
                return Unauthorized(new { message = "Invalid username or password" });

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            return StatusCode(500, new { message = "An error occurred during login" });
        }
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto registerDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.RegisterAsync(registerDto);
            if (result == null)
                return BadRequest(new { message = "Username or email already exists" });

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration");
            return StatusCode(500, new { message = "An error occurred during registration" });
        }
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetProfile()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var user = await _authService.GetUserByIdAsync(userId.Value);
            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user profile");
            return StatusCode(500, new { message = "An error occurred while retrieving profile" });
        }
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<ActionResult<UserDto>> UpdateProfile([FromBody] UpdateUserDto updateUserDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var result = await _authService.UpdateUserAsync(userId.Value, updateUserDto);
            if (result == null)
                return BadRequest(new { message = "Failed to update profile. Email may already be in use." });

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user profile");
            return StatusCode(500, new { message = "An error occurred while updating profile" });
        }
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var result = await _authService.ChangePasswordAsync(userId.Value, changePasswordDto);
            if (!result)
                return BadRequest(new { message = "Current password is incorrect" });

            return Ok(new { message = "Password changed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password");
            return StatusCode(500, new { message = "An error occurred while changing password" });
        }
    }

    [HttpPost("validate-token")]
    public ActionResult ValidateToken([FromBody] string token)
    {
        try
        {
            var isValid = _authService.ValidateToken(token);
            return Ok(new { isValid });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating token");
            return StatusCode(500, new { message = "An error occurred while validating token" });
        }
    }

    [HttpPost("logout")]
    [Authorize]
    public ActionResult Logout()
    {
        // For JWT tokens, logout is typically handled client-side by removing the token
        // In a more advanced scenario, you might maintain a blacklist of tokens
        return Ok(new { message = "Logged out successfully" });
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
} 