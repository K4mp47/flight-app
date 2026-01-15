# Flight Booking Application

A comprehensive flight booking system with a modern web interface and robust backend API. This application enables users to search for flights, book tickets, manage baggage, and handle airline operations through an intuitive dashboard.

## 🚀 Features

- **Flight Search & Booking**: Search for flights by route, date, and preferences
- **User Authentication**: Secure JWT-based authentication system
- **Baggage Management**: Handle baggage policies and additional baggage requests
- **Airline Dashboard**: Administrative interface for airlines to manage flights, routes, and aircraft
- **Real-time Updates**: Dynamic flight information and availability
- **Seat Selection**: Interactive seat map for choosing preferred seats
- **Multi-role Support**: Different interfaces for passengers, airlines, and administrators

## 🏗️ Architecture

This is a full-stack application with:

- **Frontend**: Next.js 15 with TypeScript, React 18, and Tailwind CSS
- **Backend**: Flask REST API with PostgreSQL database
- **Authentication**: JWT tokens with role-based access control
- **API Documentation**: Swagger/Flasgger integration

```
flight-app/
├── backend/          # Flask REST API
│   ├── api/         # API modules (controllers, models, queries, routes, validations)
│   ├── dataset/     # Sample data (airlines, airports, flights)
│   └── app.py       # Application entry point
│
└── frontend/        # Next.js application
    └── src/
        ├── app/     # Next.js pages (App Router)
        ├── components/  # React components
        ├── hooks/   # Custom React hooks
        ├── lib/     # Utilities and API client
        └── types/   # TypeScript definitions
```

## 📋 Prerequisites

- **Python**: 3.8 or higher
- **Node.js**: 18.x or higher
- **PostgreSQL**: 12 or higher
- **npm** or **yarn**: Latest version

## 🛠️ Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
Create a `.env` file in the backend directory with:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/flight_db
JWT_SECRET_KEY=your-secret-key-here
FLASK_ENV=development
```

5. Initialize the database:
```bash
python db.py  # Run database initialization script
```

6. Start the Flask server:
```bash
python app.py
```

The backend API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Configure environment variables:
Create a `.env.local` file in the frontend directory with:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The frontend application will be available at `http://localhost:3000`

## 🚦 Running the Application

1. **Start Backend**: 
   ```bash
   cd backend
   source venv/bin/activate
   python app.py
   ```

2. **Start Frontend** (in a new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the Application**: Open your browser to `http://localhost:3000`

4. **API Documentation**: Visit `http://localhost:5000/apidocs` for Swagger API documentation

## 📚 Tech Stack

### Backend
- **Framework**: Flask 3.1.1
- **ORM**: SQLAlchemy 2.0.41
- **Database**: PostgreSQL (via psycopg2-binary)
- **Authentication**: Flask-JWT-Extended 4.7.1
- **Validation**: Pydantic 2.11.7
- **API Docs**: Flasgger 0.9.7.1
- **CORS**: Flask-CORS 6.0.1

### Frontend
- **Framework**: Next.js 15
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Component Library**: Radix UI, shadcn/ui
- **Form Handling**: React Hook Form
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Date Handling**: date-fns
- **Drag & Drop**: dnd-kit

## 🗂️ Project Structure

### Backend API Structure

```
backend/api/
├── controllers/      # Request handlers
│   ├── airline_controller.py
│   ├── airport_controller.py
│   ├── baggage_controller.py
│   ├── flight_controller.py
│   ├── route_controller.py
│   └── user_controller.py
│
├── models/          # Database models
│   ├── airline.py
│   ├── airport.py
│   ├── flight.py
│   ├── route.py
│   ├── user.py
│   └── ...
│
├── query/           # Database query functions
│   ├── airline_query.py
│   ├── flight_query.py
│   └── ...
│
├── routes/          # API route definitions
│   ├── airline_routes.py
│   ├── flight_routes.py
│   └── ...
│
├── validations/     # Input validation
│   └── XSS_protection.py
│
└── utils/           # Utility functions
    ├── blacklist.py
    ├── geo.py
    └── role_checking.py
```

### Frontend Structure

```
frontend/src/
├── app/             # Next.js App Router pages
│   ├── dashboard/  # Admin/Airline dashboard
│   ├── flight/     # Flight pages
│   ├── login/      # Authentication
│   ├── profile/    # User profile
│   └── search/     # Flight search
│
├── components/      # React components (feature-based)
│   ├── auth/       # Authentication components
│   ├── booking/    # Booking flow components
│   ├── dashboard/  # Dashboard components
│   ├── flight/     # Flight search & display
│   ├── layout/     # Navigation & layout
│   ├── shared/     # Shared components
│   └── ui/         # UI primitives (shadcn)
│
├── hooks/          # Custom React hooks
├── lib/            # Utilities & API client
└── types/          # TypeScript type definitions
```

## 🔐 Authentication & Authorization

The application uses JWT (JSON Web Tokens) for authentication with role-based access control:

- **Passenger**: Can search flights, book tickets, manage bookings
- **Airline**: Can manage flights, routes, aircraft, pricing policies
- **Admin**: Full system access

## 🗄️ Database Schema

Key entities include:
- **Users**: Authentication and user profiles
- **Airlines**: Airline information and configurations
- **Airports**: Airport details and locations
- **Aircraft**: Aircraft types and specifications
- **Routes**: Flight routes with sections
- **Flights**: Scheduled flights
- **Tickets**: Passenger bookings
- **Baggage**: Baggage policies and tracking

## 🧪 API Endpoints

Main API routes:
- `/api/users` - User management
- `/api/airlines` - Airline operations
- `/api/airports` - Airport information
- `/api/flights` - Flight search and management
- `/api/routes` - Route configuration
- `/api/baggage` - Baggage handling
- `/api/aircraft` - Aircraft management
- `/api/manufacturers` - Aircraft manufacturers

See API documentation at `http://localhost:5000/apidocs` for detailed endpoint information.

## 🎨 UI Components

The frontend uses shadcn/ui and Radix UI for accessible, customizable components:
- Forms with validation
- Data tables with sorting and filtering
- Interactive charts and analytics
- Responsive navigation
- Modal dialogs
- Date pickers
- Search inputs with autocomplete

## 📝 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/flight_db
JWT_SECRET_KEY=your-secret-key
FLASK_ENV=development
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 👥 Authors

- Alberto Campagnolo
- Marco Stevanato
