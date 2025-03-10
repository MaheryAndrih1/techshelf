# TechShelf API Documentation

## Overview

The TechShelf API provides programmatic access to TechShelf's e-commerce platform functionality. This document provides instructions for accessing and using the API.

## Base URL

All API endpoints are relative to the base URL: `http://localhost:8000/`

## Authentication

TechShelf API uses JWT (JSON Web Token) authentication. To access protected endpoints, you need to include the access token in the Authorization header.

### Getting an Access Token

**Endpoint:** `users/api/login/`  
**Method:** `POST`  
**Content Type:** `application/json`  

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "your_password"
}
```

**Response:**
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
        "id": 1,
        "username": "user",
        "email": "user@example.com",
        "role": "BUYER"
    }
}
```

### Using the Access Token

Include the access token in the `Authorization` header for all protected API requests:
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### Refreshing Access Token

Access tokens expire after 30 minutes. Use the refresh token to get a new access token.

**Endpoint:** `users/api/token/refresh/`  
**Method:** `POST`  
**Content Type:** `application/json`  

**Request Body:**
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response:**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Logout

**Endpoint:** `users/api/logout/`  
**Method:** `POST`  
**Content Type:** `application/json`  
**Authentication:** Required  

**Request Body:**
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response:** `205 Reset Content` on success.

## User Management

### Register New User

**Endpoint:** `users/api/register/`  
**Method:** `POST`  
**Content Type:** `application/json`  

**Request Body:**
```json
{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "complex_password",
    "password2": "complex_password"
}
```

**Response:**
```json
{
    "username": "newuser",
    "email": "newuser@example.com"
}
```

### Get User Profile

**Endpoint:** `users/api/profile/`  
**Method:** `GET`  
**Authentication:** Required  

**Response:**
```json
{
    "id": 1,
    "username": "user",
    "email": "user@example.com",
    "role": "BUYER",
    "date_joined": "2023-01-01T12:00:00Z",
    "last_login": "2023-01-02T12:00:00Z"
}
```

### Update User Profile

**Endpoint:** `users/api/profile/`  
**Method:** `PUT`  
**Content Type:** `application/json`  
**Authentication:** Required  

**Request Body:**
```json
{
    "username": "updated_username",
    "email": "updated_email@example.com"
}
```

**Response:** Updated user profile object.

### Get Billing Information

**Endpoint:** `users/api/billing/`  
**Method:** `GET`  
**Authentication:** Required  

**Response:**
```json
{
    "card_number": "**** **** **** 1234",
    "expiry_date": "12/2025",
    "billing_address": "123 Main St, City, Country"
}
```

### Update Billing Information

**Endpoint:** `users/api/billing/`  
**Method:** `PUT`  
**Content Type:** `application/json`  
**Authentication:** Required  

**Request Body:**
```json
{
    "card_number": "4111111111111111",
    "expiry_date": "12/2025",
    "cvv": "123",
    "billing_address": "123 Main St, City, Country"
}
```

**Response:** Updated billing info object with masked card number.

### Upgrade to Seller

**Endpoint:** `users/api/upgrade-seller/`  
**Method:** `POST`  
**Authentication:** Required  

**Response:**
```json
{
    "message": "Account upgraded to seller successfully."
}
```

## Stores

### List All Stores

**Endpoint:** `stores/api/`  
**Method:** `GET`  
**Authentication:** Not Required  

**Query Parameters:**
- `search`: Search term for store name or subdomain
- `ordering`: Field to order by (e.g., `created_at`, `-created_at`, `store_name`, etc.)
- `page`: Page number for pagination

**Response:**
```json
{
    "count": 10,
    "next": "http://localhost:8000/stores/api/?page=2",
    "previous": null,
    "results": [
        {
            "store_id": "store_tech_store",
            "store_name": "Tech Store",
            "subdomain_name": "tech-store",
            "user": "seller1",
            "created_at": "2023-01-01T12:00:00Z"
        },
        // More stores...
    ]
}
```

### Get Store Details

**Endpoint:** `stores/api/<subdomain>/`  
**Method:** `GET`  
**Authentication:** Not Required  

**Response:**
```json
{
    "store_id": "store_tech_store",
    "store_name": "Tech Store",
    "subdomain_name": "tech-store",
    "user": "seller1",
    "theme": {
        "theme_id": "theme_store_tech_store",
        "primary_color": "#3498db",
        "secondary_color": "#2ecc71",
        "font": "Roboto",
        "logo_url": "http://localhost:8000/media/store_logos/tech_store_logo.png",
        "banner_url": "http://localhost:8000/media/store_banners/tech_store_banner.png"
    },
    "created_at": "2023-01-01T12:00:00Z"
}
```

### Get Store Products

**Endpoint:** `stores/api/<subdomain>/products/`  
**Method:** `GET`  
**Authentication:** Not Required  

**Response:**
```json
{
    "count": 5,
    "next": null,
    "previous": null,
    "results": [
        {
            "product_id": "prod_laptop",
            "name": "Laptop",
            "price": "999.99",
            "stock": 10,
            "category": "Computers",
            "description": "Powerful laptop with high performance",
            "image": "http://localhost:8000/media/product_images/laptop.jpg",
            "store": "store_tech_store",
            "store_name": "Tech Store",
            "likes": 5,
            "created_at": "2023-01-02T10:30:00Z",
            "updated_at": "2023-01-03T14:20:00Z"
        },
        // More products...
    ]
}
```

### Create Store

**Endpoint:** `stores/api/create/`  
**Method:** `POST`  
**Content Type:** `application/json`  
**Authentication:** Required (Seller role)  

**Request Body:**
```json
{
    "store_name": "New Tech Store",
    "subdomain_name": "new-tech-store"
}
```

**Response:**
```json
{
    "store_id": "store_new_tech_store",
    "store_name": "New Tech Store",
    "subdomain_name": "new-tech-store",
    "user": "seller1",
    "created_at": "2023-01-05T09:15:00Z"
}
```

### Update Store

**Endpoint:** `stores/api/<subdomain>/update/`  
**Method:** `PUT`  
**Content Type:** `application/json`  
**Authentication:** Required (Store owner)  

**Request Body:**
```json
{
    "store_name": "Updated Tech Store",
    "subdomain_name": "updated-tech-store"
}
```

**Response:** Updated store object.

### Update Store Theme

**Endpoint:** `stores/api/<subdomain>/theme/`  
**Method:** `PUT`  
**Content Type:** `multipart/form-data`  
**Authentication:** Required (Store owner)  

**Request Body:**
```
primary_color: #ff5733
secondary_color: #33ff57
font: Montserrat
logo_url: [file upload]
banner_url: [file upload]
```

**Response:** Updated theme object.

### Get Store Ratings

**Endpoint:** `stores/api/<subdomain>/ratings/`  
**Method:** `GET`  
**Authentication:** Not Required  

**Response:**
```json
{
    "count": 3,
    "next": null,
    "previous": null,
    "results": [
        {
            "rating_id": "rating_2_store_tech_store",
            "user": "buyer1",
            "score": 5,
            "comment": "Great store with excellent service!",
            "timestamp": "2023-01-10T16:30:00Z"
        },
        // More ratings...
    ]
}
```

### Rate Store

**Endpoint:** `stores/api/<subdomain>/rate/`  
**Method:** `POST`  
**Content Type:** `application/json`  
**Authentication:** Required  

**Request Body:**
```json
{
    "score": 5,
    "comment": "Excellent service and fast shipping!"
}
```

**Response:** Created rating object.

## Products

### List Products

**Endpoint:** `products/api/`  
**Method:** `GET`  
**Authentication:** Not Required  

**Query Parameters:**
- `search`: Search term for product name, description, or category
- `category`: Filter by category
- `min_price`: Minimum price filter
- `max_price`: Maximum price filter
- `sort`: Sorting option (`price_low`, `price_high`, `name`, `popularity`, `newest`)
- `page`: Page number for pagination

**Response:**
```json
{
    "count": 20,
    "next": "http://localhost:8000/products/api/?page=2",
    "previous": null,
    "results": [
        {
            "product_id": "prod_smartphone",
            "name": "Smartphone",
            "price": "699.99",
            "stock": 15,
            "category": "Mobile",
            "description": "Latest smartphone with advanced features",
            "image": "http://localhost:8000/media/product_images/smartphone.jpg",
            "store": "store_tech_store",
            "store_name": "Tech Store",
            "likes": 8,
            "created_at": "2023-01-04T11:20:00Z",
            "updated_at": "2023-01-05T09:10:00Z"
        },
        // More products...
    ]
}
```

### Get Product Details

**Endpoint:** `products/api/<product_id>/`  
**Method:** `GET`  
**Authentication:** Not Required  

**Response:**
```json
{
    "product_id": "prod_smartphone",
    "name": "Smartphone",
    "price": "699.99",
    "stock": 15,
    "category": "Mobile",
    "description": "Latest smartphone with advanced features",
    "image": "http://localhost:8000/media/product_images/smartphone.jpg",
    "store": "store_tech_store",
    "store_name": "Tech Store",
    "likes": 8,
    "created_at": "2023-01-04T11:20:00Z",
    "updated_at": "2023-01-05T09:10:00Z"
}
```

### List Products by Category

**Endpoint:** `products/api/category/<category>/`  
**Method:** `GET`  
**Authentication:** Not Required  

**Response:** List of products in the specified category.

### Create Product

**Endpoint:** `products/api/create/`  
**Method:** `POST`  
**Content Type:** `multipart/form-data`  
**Authentication:** Required (Seller role)  

**Request Body:**
```
name: New Smartwatch
price: 299.99
stock: 20
category: Wearables
description: Advanced smartwatch with health tracking features
image: [file upload]
```

**Response:**
```json
{
    "product_id": "prod_new_smartwatch",
    "name": "New Smartwatch",
    "price": "299.99",
    "stock": 20,
    "category": "Wearables",
    "description": "Advanced smartwatch with health tracking features",
    "image": "http://localhost:8000/media/product_images/new_smartwatch.jpg",
    "store": "store_tech_store",
    "store_name": "Tech Store",
    "likes": 0,
    "created_at": "2023-01-15T10:30:00Z",
    "updated_at": "2023-01-15T10:30:00Z"
}
```

### Update Product

**Endpoint:** `products/api/<product_id>/update/`  
**Method:** `PUT`  
**Content Type:** `multipart/form-data`  
**Authentication:** Required (Product owner)  

**Request Body:**
```
name: Updated Smartwatch
price: 349.99
stock: 25
category: Wearables
description: Updated description with new features
image: [optional file upload]
```

**Response:** Updated product object.

### Like/Unlike Product

**Endpoint:** `products/api/<product_id>/like/`  
**Method:** `POST`  
**Authentication:** Required  

**Response:**
```json
{
    "message": "Product liked successfully."
}
```
or
```json
{
    "message": "Product unliked successfully."
}
```

## Orders

### Get Cart

**Endpoint:** `orders/api/cart/`  
**Method:** `GET`  
**Authentication:** Required  

**Response:**
```json
{
    "cart_id": "cart_abc123",
    "user": 1,
    "items": [
        {
            "product_id": "prod_smartphone",
            "product_name": "Smartphone",
            "quantity": 1,
            "total_price": "699.99"
        },
        // More items...
    ],
    "total": "699.99",
    "created_at": "2023-01-15T14:30:00Z",
    "updated_at": "2023-01-15T15:20:00Z"
}
```

### Add to Cart

**Endpoint:** `orders/api/cart/add/`  
**Method:** `POST`  
**Content Type:** `application/json`  
**Authentication:** Required  

**Request Body:**
```json
{
    "product_id": "prod_laptop",
    "quantity": 1
}
```

**Response:** Updated cart object.

### Remove from Cart

**Endpoint:** `orders/api/cart/remove/<product_id>/`  
**Method:** `DELETE`  
**Authentication:** Required  

**Response:** Updated cart object.

### Update Cart Item

**Endpoint:** `orders/api/cart/update/<product_id>/`  
**Method:** `PUT`  
**Content Type:** `application/json`  
**Authentication:** Required  

**Request Body:**
```json
{
    "quantity": 2
}
```

**Response:** Updated cart object.

### Checkout

**Endpoint:** `orders/api/checkout/`  
**Method:** `POST`  
**Content Type:** `application/json`  
**Authentication:** Required  

**Request Body:**
```json
{
    "shipping_address": "123 Main St",
    "city": "Anytown",
    "country": "USA",
    "postal_code": "12345",
    "payment_info": {
        "card_number": "4111111111111111",
        "expiry_date": "12/2025",
        "cvv": "123",
        "name_on_card": "John Doe"
    },
    "save_card": true
}
```

**Response:** Created order object.

### List Orders

**Endpoint:** `orders/api/orders/`  
**Method:** `GET`  
**Authentication:** Required  

**Response:**
```json
{
    "count": 2,
    "next": null,
    "previous": null,
    "results": [
        {
            "order_id": "order_xyz789",
            "user": 1,
            "total_amount": "1004.99",
            "tax_rate": "8.00",
            "shipping_cost": "5.00",
            "payment_status": "PAID",
            "order_status": "PROCESSING",
            "shipping_info": {
                "id": 1,
                "shipping_address": "123 Main St",
                "city": "Anytown",
                "country": "USA",
                "postal_code": "12345"
            },
            "items": [
                {
                    "product_id": "prod_smartphone",
                    "quantity": 1,
                    "price": "699.99"
                },
                {
                    "product_id": "prod_accessory",
                    "quantity": 2,
                    "price": "150.00"
                }
            ],
            "created_at": "2023-01-16T09:30:00Z",
            "updated_at": "2023-01-16T09:35:00Z"
        },
        // More orders...
    ]
}
```

### Get Order Details

**Endpoint:** `orders/api/orders/<order_id>/`  
**Method:** `GET`  
**Authentication:** Required  

**Response:** Order object with details.

### Cancel Order

**Endpoint:** `orders/api/orders/<order_id>/cancel/`  
**Method:** `POST`  
**Authentication:** Required  

**Response:** Updated order object.

### Apply Promotion

**Endpoint:** `orders/api/promotions/apply/`  
**Method:** `POST`  
**Content Type:** `application/json`  
**Authentication:** Required  

**Request Body:**
```json
{
    "discount_code": "SUMMER20"
}
```

**Response:**
```json
{
    "promotion_id": "promo_summer20",
    "discount_code": "SUMMER20",
    "discount_percentage": "20.00",
    "expiry_date": "2023-08-31"
}
```

## Notifications

### List Notifications

**Endpoint:** `notifications/api/`  
**Method:** `GET`  
**Authentication:** Required  

**Response:**
```json
{
    "count": 3,
    "next": null,
    "previous": null,
    "results": [
        {
            "notification_id": "notif_abc123",
            "user": 1,
            "message": "Your order #order_xyz789 has been shipped.",
            "is_read": false,
            "created_at": "2023-01-17T14:30:00Z"
        },

    ]
}
```

### Mark Notification as Read

**Endpoint:** `notifications/api/<notification_id>/mark-read/`  
**Method:** `PUT`  
**Authentication:** Required  

**Response:** Updated notification object.

### List Sales Reports (Sellers Only)

**Endpoint:** `notifications/api/reports/`  
**Method:** `GET`  
**Authentication:** Required (Seller role)  

**Response:**
```json
{
    "count": 2,
    "next": null,
    "previous": null,
    "results": [
        {
            "report_id": "report_abc123",
            "store": "store_tech_store",
            "store_name": "Tech Store",
            "total_sales": "2500.00",
            "report_date": "2023-01-10T10:00:00Z",
            "start_date": "2023-01-01",
            "end_date": "2023-01-07"
        },
        // More reports...
    ]
}
```

### Generate Sales Report (Sellers Only)

**Endpoint:** `notifications/api/reports/generate/`  
**Method:** `POST`  
**Content Type:** `application/json`  
**Authentication:** Required (Seller role)  

**Request Body:**
```json
{
    "start_date": "2023-01-08",
    "end_date": "2023-01-14"
}
```

**Response:** Created report object.

### Get Report Details (Sellers Only)

**Endpoint:** `notifications/api/reports/<report_id>/`  
**Method:** `GET`  
**Authentication:** Required (Seller role)  

**Response:** Detailed report object.

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of a request:

- `200 OK`: The request was successful.
- `201 Created`: A resource was successfully created.
- `400 Bad Request`: The request was invalid or cannot be served.
- `401 Unauthorized`: Authentication failed or user doesn't have permissions.
- `403 Forbidden`: The request is valid but the user doesn't have permissions.
- `404 Not Found`: The requested resource could not be found.
- `500 Internal Server Error`: An error occurred on the server.

Error responses include a JSON object with details about the error:

```json
{
    "error": "Detailed error message"
}
```

or

```json
{
    "field_name": ["Error message related to this field"]
}
```

## Conclusion

This documentation covers the main endpoints of the TechShelf API. For additional assistance or questions, please contact the API team at api@techshelf.com.

