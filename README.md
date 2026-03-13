# Vrateez Backend API

Express + MongoDB backend for the main Vrateez storefront.

## Setup

1. Copy `.env.example` to `.env`
2. Fill MongoDB and JWT values
3. Install packages: `npm install`
4. Seed products: `npm run seed`
5. Start API: `npm run dev`

## Base URL

`http://localhost:3301`

## Routes

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)
- `GET /api/products`
- `GET /api/products/:slug`
- `POST /api/products` (admin)
- `PATCH /api/products/:id` (admin)
- `GET /api/cart` (auth)
- `POST /api/cart/items` (auth)
- `PATCH /api/cart/items/:productId` (auth)
- `DELETE /api/cart/items/:productId` (auth)
- `DELETE /api/cart` (auth)
- `POST /api/orders` (auth)
- `GET /api/orders/me` (auth)
- `GET /api/orders/:id` (auth)
- `PATCH /api/orders/:id/status` (admin)
- `POST /api/payments/intent` (auth)
- `POST /api/payments/confirm` (auth)

## Auth Header

Use this header for protected APIs:

`Authorization: Bearer <token>`
