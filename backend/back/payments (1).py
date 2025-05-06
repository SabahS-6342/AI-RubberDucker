from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from starlette.middleware.sessions import SessionMiddleware
import stripe

app = FastAPI()

app.add_middleware(SessionMiddleware, secret_key="super-secret-key")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = "sqlite:///./app.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
Base = declarative_base()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

stripe.api_key = "your_stripe_secret_key"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String)
    provider_id = Column(String, unique=True)
    email = Column(String)

class Bundle(Base):
    __tablename__ = "bundles"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    price_cents = Column(Integer)

Base.metadata.create_all(bind=engine)

config = Config(".env")
oauth = OAuth(config)
oauth.register(
    name="google",
    client_id="your_google_client_id",
    client_secret="your_google_client_secret",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
def init_bundles():
    db = SessionLocal()
    if not db.query(Bundle).first():
        db.add_all([
            Bundle(title="Free Plan", description="3 AI interactions", price_cents=0),
            Bundle(title="Basic Bundle", description="10 daily interactions + materials", price_cents=999),
            Bundle(title="Pro Bundle", description="50 daily interactions, advanced help", price_cents=3999),
            Bundle(title="Premium Bundle", description="Unlimited, priority access", price_cents=9990),
        ])
        db.commit()

@app.get("/login/google")
async def login_via_google(request: Request):
    redirect_uri = request.url_for("auth_google")
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth/google")
async def auth_google(request: Request, db: Session = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    user_info = await oauth.google.parse_id_token(request, token)
    if not user_info:
        raise HTTPException(status_code=400, detail="Failed to get user info")
    user = db.query(User).filter_by(provider="google", provider_id=user_info["sub"]).first()
    if not user:
        user = User(provider="google", provider_id=user_info["sub"], email=user_info["email"])
        db.add(user)
        db.commit()
        db.refresh(user)
    request.session["user_id"] = user.id
    return RedirectResponse(url="/profile")

@app.get("/profile")
async def get_profile(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not logged in")
    user = db.query(User).get(user_id)
    return {"id": user.id, "email": user.email, "provider": user.provider}

@app.get("/logout")
async def logout(request: Request):
    request.session.pop("user_id", None)
    return {"message": "Logged out"}

@app.get("/bundles")
def list_bundles(db: Session = Depends(get_db)):
    bundles = db.query(Bundle).all()
    return [{"id": b.id, "title": b.title, "description": b.description, "price_cents": b.price_cents} for b in bundles]

@app.get("/bundle/{bundle_id}")
def view_bundle(bundle_id: int, db: Session = Depends(get_db)):
    bundle = db.query(Bundle).get(bundle_id)
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
    return {"id": bundle.id, "title": bundle.title, "description": bundle.description, "price_cents_
