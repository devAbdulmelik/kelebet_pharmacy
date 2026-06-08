# Pharmacy Management System for Kelebet Pharmacy

## Academic Project Information

**College of Technology and Built Environment**  
**Department of SW Eng.**

**Project Title:** Pharmacy Management System for Kelebet Pharmacy

**Team Members**

| No. | Name | ID Number |
|---|---|---|
| 1 | Abulmalik Mohammed | ATE/8678/2016 |
| 2 | Edlawit Dibaba | ATE/0375/2016 |
| 3 | Elias Esubalw | ATE/7216/2016 |
| 4 | Ephraim Zewdie | ATE/6742/2016 |
| 5 | Kaleab Alemayehu | ATE/0157/2016 |
| 6 | Michael Belay | ATE/2059/2016 |

**Advisor:** Instructor Aderaw

Kelebet Pharmacy Management System is a class project built to support the day-to-day workflow of a pharmacy. It combines inventory management, sales processing, reporting, and staff access control in a single web application.

## Project Overview

This system helps pharmacy staff:

- manage medicines and stock levels
- process sales through a POS interface
- manage customers and suppliers
- track reports such as daily sales, low-stock items, and near-expiry medicines
- manage staff accounts with role-based access control

The application is designed around three user roles:

- `Admin`: full access to the system
- `Pharmacist`: medicine and inventory operations, plus inventory-related reports
- `Cashier`: sales, customer handling, receipts, and daily sales reporting

## Main Features

- Authentication with role-based access
- Medicine management
- Supplier management
- Customer management
- POS / sales processing
- Receipt generation and printing
- Customer-linked purchase history
- Dashboard with role-aware summaries
- Reports for:
  - daily sales
  - low stock
  - near expiry
- Admin user management for creating cashier and pharmacist accounts
- Optional demo data seeding for presentations

## Technology Stack

### Backend

- Django
- Django REST Framework
- Token Authentication
- PostgreSQL on production / SQLite for local development

### Frontend

- React
- TypeScript
- Vite
- Bootstrap

### Deployment

- Render

## Project Structure

```text
kelebet_pharmacy/
├── api/                  # API views, serializers, auth, permissions
├── inventory/            # Inventory domain models
├── sales/                # Sales, customers, and receipts
├── frontend/             # React frontend
├── templates/            # Django template overrides
├── static/               # Static assets
├── manage.py
├── render.yaml
└── DEPLOYMENT.md
```

## Role Access Summary

| Feature | Admin | Pharmacist | Cashier |
|---|---|---|---|
| Dashboard | Yes | Yes | Yes |
| Medicines | Yes | Yes | No |
| POS / Sales | Yes | No | Yes |
| Customers | Yes | No | Yes |
| Suppliers | Yes | No | No |
| User Management | Yes | No | No |
| Low Stock Report | Yes | Yes | No |
| Near Expiry Report | Yes | Yes | No |
| Daily Sales Report | Yes | No | Yes |

## Local Setup

### 1. Clone the project

```bash
git clone <your-repository-url>
cd kelebet_pharmacy
```

### 2. Install backend dependencies

```bash
pipenv install
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 4. Apply migrations

```bash
pipenv run python manage.py migrate
```

### 5. Create an admin account

```bash
pipenv run python manage.py createsuperuser
```

### 6. Start the backend

```bash
pipenv run python manage.py runserver
```

### 7. Start the frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

## Demo Data

This project includes a demo data seeder for presentation purposes.

Run:

```bash
pipenv run python manage.py seed_demo_data
```

It creates:

- 30 medicines
- 20 sales
- 5 customers
- 5 suppliers

## Deployment

This project is prepared for deployment on Render.

See:

- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [render.yaml](./render.yaml)

## Default Render Demo Admin

For free-tier Render deployment, the project supports automatic superadmin creation during deploy.

Default configured credentials:

- Username: `admin`
- Password: `admin123`

This should be changed if the project will remain publicly accessible.

## Academic Note

This project was prepared as a class project and demonstrates:

- full-stack web application development
- role-based access control
- inventory and sales workflow design
- report generation
- deployment to a cloud platform

## Submission Note

This repository represents the implementation of the Pharmacy Management System for Kelebet Pharmacy as a software engineering academic project.
