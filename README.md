# SideBet

A college prediction market platform built with Next.js and FastAPI, designed for Harvard students to create, share, and bet on ideas and predictions.

## 🚀 Quick Start

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

## 📁 Project Structure

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

## 🛠 Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS V4** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library
- **Radix UI** - Accessible component primitives

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Python SQL toolkit and ORM
- **PostgreSQL** - Primary database
- **Pydantic** - Data validation using Python type annotations
- **Uvicorn** - ASGI server implementation

## 🔧 Environment Configuration

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

## 🗄 Database Setup

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

## 🎯 Key Features

### Ideas System
- **Create Ideas**: Users can submit prediction ideas
- **Like & Bookmark**: Engage with ideas through likes and bookmarks
- **Comments**: Threaded discussions on ideas
- **Status Tracking**: Ideas can be pending, accepted, or rejected

### Prediction Markets
- **Market Categories**: Sports, IMs, Student Gov, Admin
- **Bookmarking**: Save markets for quick access
- **Real-time Updates**: Live market data and predictions
- **Position Tracking**: Monitor your bets and positions

### User Profiles
- **Profile Pictures**: Upload and manage profile images
- **Activity Tracking**: View user bets, posts, and replies
- **Follow System**: Follow other users
- **Settings**: Comprehensive profile and account management

### Authentication
- **Harvard Email Verification**: Restricted to @college.harvard.edu emails
- **Secure Sessions**: JWT-based authentication
- **Password Management**: Secure password updates

## 🚀 Development Workflow

### Frontend Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm start

# Lint code
npm run lint

# Type check
npm run type-check
```

### Backend Development
```bash
# Activate virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Start development server
uvicorn app.main:app --reload

# Run database migrations (if using Alembic)
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Description"
```

## 📝 API Documentation

When the backend is running, visit:
- **Interactive API Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

## 🧪 Testing

### Frontend Testing
```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch
```

### Backend Testing
```bash
# Run tests (when implemented)
pytest

# Run with coverage
pytest --cov=app
```

## 🔒 Security Considerations

- **Environment Variables**: Never commit `.env` files
- **Database**: Local database files are gitignored
- **User Uploads**: Profile pictures stored securely with size limits
- **Authentication**: Harvard email verification required
- **Input Validation**: All user inputs validated on both frontend and backend

## 📦 Deployment

### Frontend (Vercel)
```bash
# Build and deploy
npm run build
# Follow Vercel deployment instructions
```

### Backend (Railway/Heroku)
```bash
# Ensure requirements.txt is up to date
pip freeze > requirements.txt

# Set environment variables in your deployment platform
# Deploy following platform-specific instructions
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Code Style Guidelines

- **TypeScript**: Use functional components with TypeScript interfaces
- **Python**: Follow PEP 8 style guidelines
- **CSS**: Use Tailwind CSS utility classes
- **Naming**: Use descriptive variable names with auxiliary verbs

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check database credentials in `.env`
   - Verify database exists

2. **Frontend Build Errors**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run type-check`

3. **Backend Import Errors**
   - Ensure virtual environment is activated
   - Install requirements: `pip install -r requirements.txt`

4. **CORS Issues**
   - Check frontend/backend URLs match
   - Verify CORS settings in FastAPI

### Getting Help

- **Issues**: Open a GitHub issue
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check API docs at `/docs`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- API powered by [FastAPI](https://fastapi.tiangolo.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

---

**Happy coding! 🎉**
