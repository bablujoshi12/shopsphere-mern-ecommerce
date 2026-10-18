# 🛒 ShopSphere — MERN Stack E-Commerce Platform

ShopSphere is a full-stack e-commerce web application built using the MERN stack. It provides a complete shopping experience for customers and a dedicated admin dashboard to manage products, orders, users, and other store operations.

## ✨ Features

### 👤 Customer Features

- User registration and login
- Secure authentication
- Browse products and view product details
- Search, filter, sort, and paginate products
- Shopping cart management
- Wishlist management
- Checkout with Cash on Delivery (COD) and Razorpay integration
- Order history and order tracking
- Order cancellation and return/refund workflows
- Invoice support
- User profile and address management
- Product reviews and ratings

### 🛠️ Admin Dashboard

- Admin dashboard and analytics
- Product management
- Category management
- Order management
- User management
- Coupon management
- Banner management
- Review management

### 🔐 Security and Validation

- JWT-based authentication
- Role-based access control
- Password hashing using bcryptjs
- Server-side input validation using Joi
- Protected routes
- Centralized error handling

## 💻 Tech Stack

| Technology      | Purpose                    |
| --------------- | -------------------------- |
| React.js        | Frontend UI                |
| Bootstrap / CSS | Responsive styling         |
| React Router    | Client-side routing        |
| Node.js         | Backend runtime            |
| Express.js      | REST API                   |
| MongoDB         | Database                   |
| Mongoose        | Database modeling          |
| JWT             | Authentication             |
| bcryptjs        | Password hashing           |
| Joi             | Request validation         |
| Multer          | File uploads               |
| Razorpay        | Online payment integration |

## 📁 Project Structure

```text
ShopSphere/
├── frontend/          # React frontend
├── backend/           # Node.js and Express API
├── .gitignore
└── README.md
```

_Folder names may differ depending on your repository structure._

## ⚙️ Installation and Setup

### Prerequisites

- Node.js and npm
- MongoDB
- Git

### 1. Clone the repository

```bash
git clone https://github.com/bablujoshi12/shopsphere-mern-ecommerce
cd ShopSphere
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create a `.env` file in the backend directory and add the variables required by your application.

```env
PORT=8080
MONGO_URL=your_mongodb_connection_string
JWT_SECRET_KEY=your_jwt_secret
```

Add any additional variables required by your implementation, such as Razorpay credentials or frontend origin settings.

**Important:** Never upload `.env` files, database credentials, JWT secrets, or payment secrets to GitHub.

### 4. Install frontend dependencies

Open another terminal:

```bash
cd frontend
npm install
```

Configure the frontend API URL using the environment-variable name expected by your project.

### 5. Run the application

Start the backend using the script configured in `backend/package.json`. For example:

```bash
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open the local URL displayed by your frontend development server.

## 🚀 Deployment

The frontend and backend can be deployed separately using suitable hosting providers.

Before deploying:

- Configure production environment variables.
- Set up the production MongoDB connection.
- Configure backend CORS settings.
- Configure Razorpay credentials if online payments are enabled.
- Verify file-upload storage and API URLs.
- Test customer and admin functionality.

## 📸 Screenshots

Add screenshots of the following pages to showcase the project:

- Homepage
- Products listing
- Product details
- Shopping cart and checkout
- Customer orders
- Admin dashboard

## 🔮 Future Improvements

- Wishlist analytics
- Automated testing
- Improved accessibility
- Enhanced performance and monitoring

## 👨‍💻 Author

**Bablu Joshi**

Full Stack Developer | MERN Stack

## 📄 License

A license has not been specified yet. Add a `LICENSE` file if you intend to distribute this project under an open-source license.
