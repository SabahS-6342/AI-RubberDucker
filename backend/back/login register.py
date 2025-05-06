from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sqlite3

app = FastAPI()

class User(BaseModel):
    username: str
    password: str


def check_credentials(username: str, password: str) -> bool:
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password))
    user = cursor.fetchone()
    conn.close()
    return user is not None


def username_exists(username: str) -> bool:
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    return user is not None


def register_user(username: str, password: str):
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, password))
    conn.commit()
    conn.close()


@app.post("/login")
def login(user: User):
    if not user.username or not user.password:
        raise HTTPException(status_code=400, detail="Username and password are required")

    if check_credentials(user.username, user.password):
        return {"message": "Login successful"}
    else:
        raise HTTPException(status_code=401, detail="Incorrect username or password")


@app.post("/register")
def register(user: User):
    if not user.username or not user.password:
        raise HTTPException(status_code=400, detail="Username and password are required")

    if username_exists(user.username):
        raise HTTPException(status_code=400, detail="Username already exists")

    register_user(user.username, user.password)
    return {"message": "Registration successful"}
