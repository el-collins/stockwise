using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using StockWise.API.Data;
using StockWise.API.Models;
using StockWise.API.DTOs;

namespace StockWise.API.Services;

public interface IAuthService
{
    Task<AuthResponseDto?> LoginAsync(LoginDto loginDto);
    Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto);
    Task<UserDto?> GetUserByIdAsync(int userId);
    Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto);
    Task<UserDto?> UpdateUserAsync(int userId, UpdateUserDto updateUserDto);
    string GenerateToken(User user);
    bool ValidateToken(string token);
}

public class AuthService : IAuthService
{
    private readonly StockWiseDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IMapper _mapper;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        StockWiseDbContext context,
        IConfiguration configuration,
        IMapper mapper,
        ILogger<AuthService> logger)
    {
        _context = context;
        _configuration = configuration;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto loginDto)
    {
        try
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == loginDto.Username && u.IsActive);

            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
            {
                _logger.LogWarning("Failed login attempt for username: {Username}", loginDto.Username);
                return null;
            }

            var token = GenerateToken(user);
            var userDto = _mapper.Map<UserDto>(user);

            _logger.LogInformation("User {Username} logged in successfully", user.Username);

            return new AuthResponseDto
            {
                Token = token,
                Expires = DateTime.UtcNow.AddHours(24),
                User = userDto
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for username: {Username}", loginDto.Username);
            return null;
        }
    }

    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto)
    {
        try
        {
            // Check if username or email already exists
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == registerDto.Username || u.Email == registerDto.Email);

            if (existingUser != null)
            {
                _logger.LogWarning("Registration failed - user already exists: {Username}, {Email}", 
                    registerDto.Username, registerDto.Email);
                return null;
            }

            var user = new User
            {
                Username = registerDto.Username,
                Email = registerDto.Email,
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                Role = "User", // Default role
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = GenerateToken(user);
            var userDto = _mapper.Map<UserDto>(user);

            _logger.LogInformation("New user registered: {Username}", user.Username);

            return new AuthResponseDto
            {
                Token = token,
                Expires = DateTime.UtcNow.AddHours(24),
                User = userDto
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration for username: {Username}", registerDto.Username);
            return null;
        }
    }

    public async Task<UserDto?> GetUserByIdAsync(int userId)
    {
        try
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

            return user != null ? _mapper.Map<UserDto>(user) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by ID: {UserId}", userId);
            return null;
        }
    }

    public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null || !user.IsActive)
                return false;

            if (!BCrypt.Net.BCrypt.Verify(changePasswordDto.CurrentPassword, user.PasswordHash))
                return false;

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(changePasswordDto.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Password changed for user: {Username}", user.Username);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password for user ID: {UserId}", userId);
            return false;
        }
    }

    public async Task<UserDto?> UpdateUserAsync(int userId, UpdateUserDto updateUserDto)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null || !user.IsActive)
                return null;

            if (!string.IsNullOrEmpty(updateUserDto.FirstName))
                user.FirstName = updateUserDto.FirstName;

            if (!string.IsNullOrEmpty(updateUserDto.LastName))
                user.LastName = updateUserDto.LastName;

            if (!string.IsNullOrEmpty(updateUserDto.Email))
            {
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == updateUserDto.Email && u.Id != userId);
                if (existingUser != null)
                    return null; // Email already exists

                user.Email = updateUserDto.Email;
            }

            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("User updated: {Username}", user.Username);
            return _mapper.Map<UserDto>(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user ID: {UserId}", userId);
            return null;
        }
    }

    public string GenerateToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
        var key = Encoding.ASCII.GetBytes(secretKey);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role),
            new("firstName", user.FirstName ?? ""),
            new("lastName", user.LastName ?? "")
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(24),
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }

    public bool ValidateToken(string token)
    {
        try
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
            var key = Encoding.ASCII.GetBytes(secretKey);

            var tokenHandler = new JwtSecurityTokenHandler();
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidateAudience = true,
                ValidAudience = jwtSettings["Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
            return true;
        }
        catch
        {
            return false;
        }
    }
} 