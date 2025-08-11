# Meeting Room Reservation System

A complete web-based meeting room reservation system with user authentication, room booking, and admin panel management.

## 🚀 Features

### 🔐 User Authentication
- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (User/Admin)

### 📅 Room Reservation
- Real-time room availability checking
- Booking with date/time selection
- Purpose and department tracking
- Email confirmations
- Reservation management (view, edit, cancel)

### 🧑‍💼 Admin Panel
- User management
- Room management (add, edit, delete)
- System statistics and analytics
- Reservation overview
- System logs and audit trail

### 📧 Notifications
- Email confirmations for bookings
- Cancellation notifications
- Update notifications

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **JWT** for authentication
- **Nodemailer** for email notifications
- **bcryptjs** for password hashing
- **Express Validator** for input validation

### Frontend
- **React.js** with hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **React Hook Form** for form handling
- **Axios** for API calls
- **Lucide React** for icons

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd meeting-room-reservation-system
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # Database Configuration (PostgreSQL)
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=meeting_reservation
   DB_USER=postgres
   DB_PASSWORD=your-password

   # Email Configuration (SMTP)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

4. **Set up the database**
   ```bash
   npm run setup-db
   ```

5. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend development server (port 3000).

## 📊 Database Schema

### Users Table
- `id` - Primary key
- `name` - User's full name
- `email` - Unique email address
- `password_hash` - Hashed password
- `role` - User role (user/admin)
- `department` - User's department
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

### Rooms Table
- `id` - Primary key
- `name` - Room name
- `location` - Room location
- `capacity` - Room capacity
- `available_from` - Start time of availability
- `available_to` - End time of availability
- `is_active` - Room status
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Reservations Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `room_id` - Foreign key to rooms
- `start_time` - Reservation start time
- `end_time` - Reservation end time
- `purpose` - Meeting purpose
- `department` - Department
- `status` - Reservation status
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Logs Table
- `id` - Primary key
- `action` - Action performed
- `actor_id` - User who performed the action
- `entity_type` - Type of entity affected
- `entity_id` - ID of affected entity
- `details` - Additional details (JSON)
- `timestamp` - Action timestamp

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/change-password` - Change password

### Reservations
- `POST /api/reservations` - Create reservation
- `GET /api/reservations/my-reservations` - Get user's reservations
- `GET /api/reservations/:id` - Get specific reservation
- `PUT /api/reservations/:id` - Update reservation
- `DELETE /api/reservations/:id` - Cancel reservation

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get specific room
- `GET /api/rooms/:id/availability` - Get room availability
- `GET /api/rooms/availability/all` - Get all rooms availability
- `POST /api/rooms/:id/check-availability` - Check room availability

### Admin (Admin only)
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/role` - Update user role
- `GET /api/admin/reservations` - Get all reservations
- `POST /api/admin/rooms` - Create room
- `PUT /api/admin/rooms/:id` - Update room
- `DELETE /api/admin/rooms/:id` - Delete room
- `GET /api/admin/statistics` - Get system statistics
- `GET /api/admin/logs` - Get system logs

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/upcoming-reservations` - Get upcoming reservations
- `GET /api/users/past-reservations` - Get past reservations
- `GET /api/users/statistics` - Get user statistics

## 👥 Default Admin Account

After running the database setup, a default admin account is created:

- **Email:** admin@company.com
- **Password:** admin123

## 🎨 Frontend Routes

- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - User dashboard
- `/book` - Room booking page
- `/reservations` - My reservations
- `/profile` - User profile
- `/admin` - Admin dashboard (admin only)

## 📧 Email Configuration

The system sends email notifications for:
- Reservation confirmations
- Reservation cancellations
- Reservation updates

To configure email:

1. **Gmail Setup:**
   - Enable 2-factor authentication
   - Generate an app password
   - Use the app password in SMTP_PASS

2. **Other SMTP Providers:**
   - Update SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS accordingly

## 🚀 Deployment

### Backend Deployment (Heroku/Render)
1. Set environment variables
2. Configure PostgreSQL database
3. Deploy the server folder

### Frontend Deployment (Netlify/Vercel)
1. Build the React app: `npm run build`
2. Deploy the build folder
3. Set environment variables for API URL

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Helmet.js security headers
- SQL injection prevention with parameterized queries

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the repository.

---

**Note:** This is a complete, production-ready meeting room reservation system. Make sure to update the JWT secret and other sensitive configuration values before deploying to production. 