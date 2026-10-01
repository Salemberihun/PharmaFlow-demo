# PharmaFlow — Pharmacy Inventory & Dispensing System

PharmaFlow is a full-stack pharmacy inventory and dispensing management application built to streamline pharmacy operations with intuitive inventory tracking, automated FEFO (First-Expired, First-Out) dispensing, stock level alerts, and real-time operational reporting.

The visual interface is an authentic recreation of the Figma design screens located in `design/`.

---

## 🏗️ Architecture & Technology Stack

- **Backend**: Python 3.11, Flask 3.1, Flask-SQLAlchemy 3.1, Flask-Migrate 4.1, Flask-CORS, Psycopg2
- **Database**: PostgreSQL 18
- **Frontend**: React 19, Vite 8, Tailwind CSS v4, Lucide React
- **Testing**: pytest

```
PharmaFlow/
├── backend/
│   ├── app/
│   │   ├── models/            # SQLAlchemy ORM models (User, Medicine, Batch, Dispensation, etc.)
│   │   ├── routes/            # Modular REST API Blueprints (medicines, dispensing, dashboard, reports, etc.)
│   │   └── __init__.py        # Application factory & error handlers
│   ├── migrations/            # Flask-Migrate / Alembic migration scripts
│   ├── tests/                 # pytest test suite
│   ├── config.py              # Configuration classes
│   ├── run.py                 # Flask server runner
│   ├── seed.py                # Database seeder matching Figma sample data
│   ├── requirements.txt       # Python dependencies
│   └── .env.example           # Environment template
│
├── frontend/
│   ├── src/
│   │   ├── components/        # UI components (Sidebar, ReceiveMedicineModal)
│   │   ├── pages/             # Recreated Figma screens (Dashboard, Inventory, Dispense, History, Reports, Settings)
│   │   ├── services/          # API HTTP client layer
│   │   ├── App.jsx            # Main app shell and tab routing
│   │   ├── main.jsx           # React DOM root entry
│   │   └── index.css          # Tailwind CSS styles
│   ├── package.json
│   └── vite.config.js         # Vite configuration with proxy to Flask
│
├── design/                    # Exported Figma source reference screens
├── README.md
└── .gitignore
```

---

## 🗄️ Database Setup (PostgreSQL)

If the `pharmaflow` database does not exist on your PostgreSQL server yet, run the following command in PowerShell or cmd:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres pharmaflow
```

*Or via SQL in `psql`:*
```sql
CREATE DATABASE pharmaflow;
```

### Environment Configuration

Create `backend/.env` (you can copy from `backend/.env.example`):

```ini
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/pharmaflow
TEST_DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/pharmaflow
FLASK_ENV=development
SECRET_KEY=pharmaflow-secret-key-2026
PORT=5000
```

Replace `YOUR_PASSWORD` with your local PostgreSQL password.

---

## 🚀 Running the Application

### 1. Backend (Terminal 1)

```powershell
cd "C:\Users\HP G8\PycharmProjects\PharmaFlow\backend"

# Activate the virtual environment
.\venv\Scripts\Activate.ps1

# Run database migrations
$env:FLASK_APP="run.py"
flask db upgrade

# Seed database with Figma reference data
python seed.py

# Start the Flask API server
python run.py
```

The Flask REST API will start at: `http://127.0.0.1:5000`

### 2. Frontend (Terminal 2)

```powershell
cd "C:\Users\HP G8\PycharmProjects\PharmaFlow\frontend"

# Install dependencies (already installed)
npm install

# Start the Vite development server
npm run dev
```

The React application will be accessible at: `http://localhost:5173`

---

## 🧪 Running Independent API Tests

To execute the automated backend test suite:

```powershell
cd "C:\Users\HP G8\PycharmProjects\PharmaFlow\backend"
.\venv\Scripts\Activate.ps1
pytest -v
```

---

## 🖥️ Recreated Figma Screens

| Screen | Description | Features |
|---|---|---|
| **Dashboard** (`dashboard.png.png`) | Executive pharmacy overview | 4 stat cards (Total medicines, Low stock, Expiring soon, Dispensed today), Low stock list, Expiring soon panel, Recent dispensing feed with "View all" |
| **Inventory** (`inventory.png`) | Comprehensive stock catalog | Dynamic medicine & batch counter, full-text medicine search, stock status badges (`In Stock`, `Low Stock`), `+ Receive Medicine` modal |
| **Dispense Medicine** (`dispense.png`) | Point-of-dispense workflow | Real-time medicine search dropdown, automatic FEFO batch selection, quantity validation against batch stock, pharmacist assignment, receipt confirmation |
| **Dispensing History** (`history.png`) | Full dispensing transaction log | Timestamped logs (date & time), medicine name & strength, batch numbers, dispensed boxes, pharmacist attribution, instant search filter |
| **Reports** (`reports.png`) | Daily & operational reporting | Segmented pill tabs for Daily Dispensing, Current Inventory Valuation, and Expiring Batches |
| **Settings** | Pharmacy configuration | Active pharmacist staff management, PostgreSQL connection status, alert safety thresholds |
