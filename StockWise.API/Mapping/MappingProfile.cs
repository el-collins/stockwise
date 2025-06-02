using AutoMapper;
using StockWise.API.DTOs;
using StockWise.API.Models;

namespace StockWise.API.Mapping
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // what is mapping profile?
            // it is a class that defines the mappings between the entities and the DTOs
            // it is used to map the entities to the DTOs and vice versa. eg: Product to ProductDto
            
            // Product mappings
            CreateMap<Product, ProductDto>();
            CreateMap<CreateProductDto, Product>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.OrderItems, opt => opt.Ignore())
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true));

            // Order mappings
            CreateMap<Order, OrderDto>()
                .ForMember(dest => dest.OrderItems, opt => opt.MapFrom(src => src.OrderItems));
            
            CreateMap<CreateOrderDto, Order>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.OrderNumber, opt => opt.Ignore())
                .ForMember(dest => dest.TotalAmount, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.OrderItems, opt => opt.Ignore());

            // OrderItem mappings
            CreateMap<OrderItem, OrderItemDto>()
                .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product.Name))
                .ForMember(dest => dest.ProductSKU, opt => opt.MapFrom(src => src.Product.SKU))
                .ForMember(dest => dest.TotalPrice, opt => opt.MapFrom(src => src.Quantity * src.UnitPrice));
            
            CreateMap<CreateOrderItemDto, OrderItem>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.OrderId, opt => opt.Ignore())
                .ForMember(dest => dest.UnitPrice, opt => opt.Ignore())
                .ForMember(dest => dest.Order, opt => opt.Ignore())
                .ForMember(dest => dest.Product, opt => opt.Ignore());

            // User mappings
            CreateMap<User, UserDto>();
            
            CreateMap<RegisterDto, User>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())
                .ForMember(dest => dest.Role, opt => opt.Ignore())
                .ForMember(dest => dest.IsActive, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.Orders, opt => opt.Ignore());
        }
    }
} 