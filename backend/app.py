
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from backend.routes.customer import router as customer_router
from backend.routes.employee import router as employee_router
from backend.routes.admin import router as admin_router
from backend.services.database import init_db
from backend.routes.auth import router as auth_router
from fastapi.middleware.cors import CORSMiddleware
from backend.services.users_db import init_users_db

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],     # React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


init_users_db()
init_db()
app.include_router(auth_router)
app.include_router(customer_router)
app.include_router(employee_router)
app.include_router(admin_router)


app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/")
def root():
    return {"message": "Backend is running"}








