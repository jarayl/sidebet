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

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://username:password@localhost/sidebet

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Development
DEBUG=True
```

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
   - Tailwind V4 absolutely LOVES to refuse to load/compile
   - If at any point you run the app and all styling just dissapears (if the app looks terrible), delete the .next folder in your IDE and re-run the app. This should fix the styling issues.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
