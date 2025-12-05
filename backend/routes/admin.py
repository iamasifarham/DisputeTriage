from fastapi import APIRouter
from backend.services.ingest import process_excel
from backend.services.database import insert_cases, get_case, get_connection, init_db
from backend.services.database import auto_age
from fastapi import Depends
from backend.auth.jwt_handler import admin_required
from backend.services.notify import notify_password_changed
from fastapi import Depends, HTTPException
from pydantic import BaseModel
from backend.auth.jwt_handler import admin_required
from backend.services.users_db import (
    create_user,
    get_user_by_id,
    get_user_by_username,
    update_password
)
from backend.services.users_db import get_users_connection

router = APIRouter(prefix="/admin", tags=["admin"])


# -----------------------------------
# PROCESS EXCEL FILE
# -----------------------------------
@router.get("/process")
def process_file(current_user = Depends(admin_required)):
    path = "backend/data/raw/disputes.xlsx"

    data = process_excel(path)
    init_db()
    insert_cases(data)

    return {
        "total_cases": len(data),
        "sample": data[:5]
    }


# -----------------------------------
# SORTED CASES (for internal use)
# -----------------------------------
@router.get("/cases/sorted")
def admin_sorted_cases(current_user = Depends(admin_required)):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT * FROM cases
        ORDER BY 
            triage_score DESC,
            amount DESC,
            days_open DESC
    """)

    rows = cur.fetchall()
    conn.close()

    return {
        "total": len(rows),
        "cases": [auto_age(row) for row in rows]
    }



# -----------------------------------
# LEGACY STATUS ENDPOINT
# -----------------------------------
@router.get("/status/{ticket_id}")
def admin_case_details(ticket_id: str, current_user = Depends(admin_required)):
    row = get_case(ticket_id)

    if not row:
        return {"error": "ticket not found"}

    return dict(row)

#-------------
#   MODELS
#--------------
class CreateUserRequest(BaseModel):
    full_name: str
    username: str
    email: str
    phone: str
    password: str
    role: str  # "employee" or "admin"


class EditUserRequest(BaseModel):
    full_name: str
    email: str
    phone: str
    role: str


class ResetPasswordRequest(BaseModel):
    new_password: str

#_________________
#   CREATE USER
#___________________
@router.post("/users/create")
def create_new_user(req: CreateUserRequest, current_user = Depends(admin_required)):
    # Prevent duplicate usernames
    existing = get_user_by_username(req.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    if req.role not in ["admin", "employee"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    create_user(
        full_name=req.full_name,
        username=req.username,
        email=req.email,
        phone=req.phone,
        password=req.password,
        role=req.role
    )

    return {"message": "User created successfully", "username": req.username}

#________________
#   USER LIST
#_______________
@router.get("/users")
def list_users(current_user = Depends(admin_required)):
    # Direct DB read (simple query)
    conn = get_users_connection()
    cur = conn.cursor()

    cur.execute("SELECT id, full_name, username, email, phone, role, created_at FROM users")
    rows = cur.fetchall()
    conn.close()

    return [dict(row) for row in rows]

#_________________
#    EDIT USER DATA
#__________________

@router.get("/users/{user_id}")
def get_single_user(user_id: int, current_user = Depends(admin_required)):
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(user)


@router.put("/users/{user_id}")
def edit_user_profile(user_id: int, req: EditUserRequest, current_user = Depends(admin_required)):
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.role not in ["admin", "employee"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    conn = get_users_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE users
        SET full_name = ?, email = ?, phone = ?, role = ?
        WHERE id = ?
    """, (req.full_name, req.email, req.phone, req.role, user_id))

    conn.commit()
    conn.close()

    return {"message": "User updated successfully"}

#___________________
#  RESET USER PASSWORD
#____________________
@router.post("/users/{user_id}/reset-password")
def reset_user_password(user_id: int, req: ResetPasswordRequest, current_user = Depends(admin_required)):
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_password(user_id, req.new_password)
    
    notify_password_changed(user)

    return {"message": f"Password reset successfully for user {user_id}"}
