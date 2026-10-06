# 🎉 EventSphere

EventSphere is a full-stack event management platform.  
It allows users to create, manage, and register for events with secure authentication and role-based access control.

---

## 🚀 Tech Stack

### Frontend
- React.js
- Vite
- Plain CSS with design tokens (no UI framework)
- Axios

### Backend
- Python 3.11+
- FastAPI
- PostgreSQL 16
- SQLAlchemy 2.0 (async, asyncpg)
- Alembic (migrations)
- Pydantic v2
- JWT authentication

### Tools
- Git & GitHub
- Docker (local Postgres only — not required in production)
- uv (Python package management)
- pytest

---

## ✨ Features

- 🔐 User Authentication (JWT-based, cookie session)
- 👥 Role-based Access (Admin / SuperAdmin / Organizer / Attendee)
- 📅 Create, Update, Delete Events with approval workflow
- 🎟️ Event Registration & Ticket Management
- 📂 Image Upload Support (Cloudinary)
- 📊 Organizer Dashboard
- 🔒 Ownership checks on every mutating route
- 🔍 Full-text event search

