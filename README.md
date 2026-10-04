# 💊 MediStore — Online Pharmacy Marketplace (Backend)

MediStore is a robust multi-vendor e-commerce backend platform designed for online medicine ordering and healthcare product management. Built with modern backend technologies, it supports fine-grained role-based access control for Customers, Sellers, and Administrators.

### ✨ Key Features
- **Multi-Role Authentication:** Secure JWT-based auth with `CUSTOMER`, `SELLER`, and `ADMIN` roles.
- **Medicine & Inventory Management:** Full CRUD operations for sellers to manage medicine stock, categories, and pricing.
- **Order Processing Workflow:** Complete lifecycle management (`PLACED` ➔ `PROCESSING` ➔ `SHIPPED` ➔ `DELIVERED`).
- **Price Caching:** Historical order pricing protection against stock price changes.
- **Data Validation & Safety:** Zod input validation and Prisma relational integrity.

### 🛠️ Tech Stack
- **Language:** TypeScript
- **Runtime:** Node.js / Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma