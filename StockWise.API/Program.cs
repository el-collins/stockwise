using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;
using RabbitMQ.Client;
using System.Text;
using StockWise.API.Data;
using StockWise.API.Services;
using StockWise.API.BackgroundServices;
using StockWise.API.Mapping;
using Serilog;
using FluentValidation.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/stockwise-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddControllers()
    .AddFluentValidation(fv => fv.RegisterValidatorsFromAssemblyContaining<Program>());

// Entity Framework
builder.Services.AddDbContext<StockWiseDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
var key = Encoding.ASCII.GetBytes(secretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; // Set to true in production
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
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
    
    // Add JWT debugging
    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            Log.Warning("JWT Authentication failed: {Error}", context.Exception.Message);
            return Task.CompletedTask;
        },
        OnChallenge = context =>
        {
            Log.Warning("JWT Challenge: {Error}", context.Error);
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            Log.Information("JWT Token validated successfully for user: {User}", context.Principal?.Identity?.Name);
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// Redis - Optional in development
try
{
    builder.Services.AddSingleton<IConnectionMultiplexer>(provider =>
    {
        var connectionString = builder.Configuration.GetConnectionString("Redis");
        return ConnectionMultiplexer.Connect(connectionString ?? "localhost:6379");
    });
}
catch
{
    // Redis not available - will fallback to in-memory caching
    Log.Warning("Redis not available - using in-memory caching");
}

// RabbitMQ - Optional in development
try
{
    builder.Services.AddSingleton<IConnectionFactory>(provider =>
    {
        var factory = new ConnectionFactory()
        {
            HostName = builder.Configuration.GetValue<string>("RabbitMQ:HostName") ?? "localhost",
            Port = builder.Configuration.GetValue<int>("RabbitMQ:Port", 5672),
            UserName = builder.Configuration.GetValue<string>("RabbitMQ:UserName") ?? "guest",
            Password = builder.Configuration.GetValue<string>("RabbitMQ:Password") ?? "guest",
            VirtualHost = builder.Configuration.GetValue<string>("RabbitMQ:VirtualHost") ?? "/",
            AutomaticRecoveryEnabled = true,
            NetworkRecoveryInterval = TimeSpan.FromSeconds(10)
        };
        return factory;
    });
}
catch
{
    // RabbitMQ not available - messaging features will be disabled
    Log.Warning("RabbitMQ not available - messaging features disabled");
}

// AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile));

// Application Services
builder.Services.AddScoped<ICacheService, CacheService>();
builder.Services.AddSingleton<IMessageService, MessageService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// Background Services
builder.Services.AddHostedService<LowStockMonitoringService>();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "StockWise API", Version = "v1" });
    
    // Add JWT security definition
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "StockWise API V1");
    });
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<StockWiseDbContext>();
        context.Database.EnsureCreated();
        Log.Information("Database initialized successfully");
    }
    catch (Exception ex)
    {
        Log.Fatal(ex, "Database initialization failed");
        throw;
    }
}

Log.Information("StockWise API starting up...");

app.Run();
