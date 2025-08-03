# SideBet

A college prediction market platform built with Next.js and FastAPI, designed for Harvard students to create, share, and bet on ideas and predictions.

## Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (3.11 or higher)
- **PostgreSQL** (v14 or higher)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/sidebet.git
cd sidebet
```

### 2. Frontend Setup (Next.js)

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 3. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Set up database
python init_db.py

# Start development server
uvicorn main:app
```

The backend API will be available at `http://localhost:8000`

## Project Structure

```
sidebet/
├── src/                          # Frontend source code
│   ├── app/                      # Next.js App Router pages
│   │   ├── (auth)/              # Authentication pages (login, register)
│   │   ├── dashboard/           # User dashboard
│   │   ├── ideas/               # Ideas feed and detail pages
│   │   ├── markets/             # Prediction markets
│   │   ├── profile/             # User profiles
│   │   └── settings/            # User settings
│   ├── components/              # Reusable React components
│   │   ├── ui/                  # Base UI components (shadcn/ui)
│   │   ├── idea-card.tsx        # Individual idea display
│   │   ├── market-card.tsx      # Market prediction cards
│   │   ├── navbar.tsx           # Navigation bar
│   │   └── ...
│   ├── lib/                     # Utility functions and types
│   └── utils/                   # Helper utilities
├── backend/                     # Backend API source code
│   ├── app/
│   │   ├── api/v1/endpoints/    # API route handlers
│   │   ├── core/                # Core configuration
│   │   ├── db/                  # Database configuration
│   │   ├── models/              # SQLAlchemy database models
│   │   └── schemas/             # Pydantic data schemas
│   └── requirements.txt         # Python dependencies
├── public/                      # Static assets
└── README.md                    # This file
```

## Tech Stack

### Frontend
- **Next.js 14** 
- **TypeScript** 
- **Tailwind CSS V4** 
- **shadcn/ui**
- **Radix UI** 

### Backend
- **FastAPI** 
- **SQLAlchemy** 
- **PostgreSQL** 
- **Pydantic** 
- **Uvicorn** 

## Environment Configuration

### Frontend Setup
Create a `.env` file in the root directory:
```env
# For local development (default)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

### Backend Setup
Create a `.env` file in the `backend` directory:
```env
# Database Config
POSTGRES_SERVER=localhost
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DB=sidebet

# Security
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=11520

# API URLs
API_BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Environment Variables Explained
- **API_BASE_URL**: Backend server URL (used for static file serving)
- **FRONTEND_URL**: Frontend URL (used for CORS and email links)
- **NEXT_PUBLIC_***: Variables accessible in the browser (frontend only)
- **Backward Compatibility**: If environment variables are empty, defaults to localhost URLs

## Database Setup

### Using PostgreSQL

1. **Install PostgreSQL** (if not already installed)
   ```bash
   # macOS with Homebrew
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. **Create Database**
   ```bash
   # Connect to PostgreSQL
   psql postgres
   
   # Create database and user
   CREATE DATABASE sidebet;
   CREATE USER sidebet_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE sidebet TO sidebet_user;
   \q
   ```

3. **Initialize Database Tables**
   ```bash
   cd backend
   python init_db.py
   ```

## Troubleshooting

### Common Issues

1. **Tailwind Styling Error**
   - Tailwind V4 often fails to load/compile
   - If component styling suddenly dissapears, delete the .next folder in your IDE and restart the app.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
