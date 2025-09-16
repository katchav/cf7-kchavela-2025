# Book Lending Library System

Final project for Coding Factory 7 - Athens University of Economics and Business

**Made by:** Aikaterini Chavela

## About This Project

This is a web application for managing a book lending library. Members can borrow and return books, while librarians can manage the book catalog and handle loans.

## Main Features

**For Members:**
- Browse and search for books
- Borrow books (up to 10 at a time)
- Return books
- View their loan history

**For Librarians:**
- Add, edit and delete books
- View all member loans
- Process book returns
- See library statistics

## Technical Requirements

- Domain Model: Book Lending Library with Users, Books, BookLoans, Categories, BookCategories
- Backend: Node.js with Express (DAO/Repository/DTO/Service/Controllers pattern)
- Frontend: React with Vite
- Database: PostgreSQL
- Authentication: JWT-based login system
- Testing: Unit and integration tests

## How to Install

### What You Need First
- Node.js (version 18 or newer)
- PostgreSQL database
- Git

### Step 1: Get the Code
```bash
git clone [repository-url]
cd cf7-kchavela-2025
```

### Step 2: Set Up Database
1. Create a new database in PostgreSQL:
```sql
CREATE DATABASE library_db;
```

**Note for first-time PostgreSQL users:**
- The default username is usually 'postgres'
- You need the password you set during PostgreSQL installation
- On Windows: The installer asked you to set this password
- On Mac/Linux: You might need to set it up manually

### Step 3: Set Up Backend
```bash
cd backend
npm install
```

Create a `.env` file in the backend folder with these settings:
- Copy the text below
- Replace 'your_password' with your actual PostgreSQL password  
- Save the file as `.env` (no .txt or other extension!)

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=library_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=any_secret_key
JWT_REFRESH_SECRET=another_secret_key
```

Run database setup:
```bash
npm run migrate
npm run seed
```

### Step 4: Set Up Frontend
```bash
cd ../frontend
npm install
```

## Before You Run the Application

Quick checklist - make sure you have:
- ✓ PostgreSQL is running (you can check pgAdmin or psql)
- ✓ Database 'library_db' exists
- ✓ Created the .env file in backend folder with your database password
- ✓ Ran 'npm install' in both backend and frontend folders
- ✓ Ran 'npm run migrate' and 'npm run seed' in the backend folder

## How to Run

### Start Backend (in one terminal):
```bash
cd backend
npm run dev
```
Backend runs at: http://localhost:5001

### Start Frontend (in another terminal):
```bash
cd frontend
npm run dev
```
Frontend runs at: http://localhost:3000

## Test Accounts

After running `npm run seed`, you can login with:

**Librarian:**
- Email: librarian@library.com
- Password: LibPass123!

**Member:**
- Email: member@library.com
- Password: MemPass123!

## How to Use the System

### As a Member:
1. Login with member account
2. Browse books on the main page
3. Click on a book to see details
4. Click "Borrow This Book" to borrow it
5. Go to "My Loans" to see your borrowed books
6. Click "Return" to return a book

### As a Librarian:
1. Login with librarian account
2. Go to "Manage Books" to add/edit/delete books
3. Go to "All Loans" to see all member loans
4. Go to "Dashboard" to see statistics

## Running Tests

Backend tests:
```bash
cd backend
npm test
```

Frontend tests:
```bash
cd frontend
npm test
```

## Building the Project for Submission

To build the frontend for production:
```bash
cd frontend
npm run build
```
This creates a `dist/` folder with the production files.

To run the backend in production mode:
```bash
cd backend
NODE_ENV=production npm start
```

## Environment Configuration

All environment variables needed:

**Backend (.env file in backend folder):**
```
NODE_ENV=development
PORT=5001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=library_db
DB_USER=postgres
DB_PASSWORD=your_database_password
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_token_secret
```

**Frontend (.env file in frontend folder):**
```
VITE_API_URL=http://localhost:5001/api
```

## Database Tables

- **users**: Member and librarian accounts
- **books**: All books in the library
- **book_loans**: Records of who borrowed what
- **categories**: Book categories (Fiction, Science, etc.)
- **book_categories**: Links books to categories

## API Endpoints

**Authentication:**
- POST /api/auth/register - Create new account
- POST /api/auth/login - Login to system
- GET /api/auth/me - Get current user info

**Books:**
- GET /api/books - Get all books
- GET /api/books/:id - Get one book
- POST /api/books - Add new book (librarians only)
- PUT /api/books/:id - Edit book (librarians only)
- DELETE /api/books/:id - Delete book (librarians only)

**Loans:**
- GET /api/loans/my-loans - Get your loans
- POST /api/loans/borrow - Borrow a book
- POST /api/loans/:id/return - Return a book
- GET /api/loans - Get all loans (librarians only)
