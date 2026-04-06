from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "seu-secret-key-super-seguro-aqui-mude-em-producao")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

security = HTTPBearer()

# Create the main app
app = FastAPI(title="BIKE SEGURA BC API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class UserRegister(BaseModel):
    nome_completo: str
    cpf: str
    data_nascimento: str
    telefone: str
    email: EmailStr
    senha: str

class UserLogin(BaseModel):
    email: EmailStr
    senha: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserResponse(BaseModel):
    id: str
    nome_completo: str
    cpf: str
    data_nascimento: str
    telefone: str
    email: str

class BikeCreate(BaseModel):
    marca: str
    modelo: str
    cor: str
    numero_serie: str
    fotos: List[str]  # base64 strings
    tipo: str
    valor_estimado: Optional[float] = None
    caracteristicas: Optional[str] = None
    link_rastreamento: Optional[str] = None

class BikeUpdate(BaseModel):
    marca: Optional[str] = None
    modelo: Optional[str] = None
    cor: Optional[str] = None
    numero_serie: Optional[str] = None
    fotos: Optional[List[str]] = None
    tipo: Optional[str] = None
    valor_estimado: Optional[float] = None
    caracteristicas: Optional[str] = None
    link_rastreamento: Optional[str] = None
    status: Optional[str] = None

class BikeResponse(BaseModel):
    id: str
    proprietario_id: str
    marca: str
    modelo: str
    cor: str
    numero_serie: str
    fotos: List[str]
    tipo: str
    valor_estimado: Optional[float] = None
    caracteristicas: Optional[str] = None
    status: str
    link_rastreamento: Optional[str] = None
    data_furto: Optional[str] = None
    created_at: str

class AlertFurto(BaseModel):
    bike_id: str

# ============ HELPER FUNCTIONS ============

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception
    return user

# ============ AUTH ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "BIKE SEGURA BC API", "status": "online"}


@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )
    
    # Check CPF
    existing_cpf = await db.users.find_one({"cpf": user_data.cpf})
    if existing_cpf:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CPF já cadastrado"
        )
    
    # Create user
    user_dict = {
        "nome_completo": user_data.nome_completo,
        "cpf": user_data.cpf,
        "data_nascimento": user_data.data_nascimento,
        "telefone": user_data.telefone,
        "email": user_data.email,
        "senha_hash": get_password_hash(user_data.senha),
        "created_at": datetime.utcnow().isoformat()
    }
    
    result = await db.users.insert_one(user_dict)
    user_id = str(result.inserted_id)
    
    # Create token
    access_token = create_access_token(data={"sub": user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "nome_completo": user_data.nome_completo,
            "email": user_data.email
        }
    }

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.senha, user["senha_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )
    
    user_id = str(user["_id"])
    access_token = create_access_token(data={"sub": user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "nome_completo": user["nome_completo"],
            "email": user["email"]
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "nome_completo": current_user["nome_completo"],
        "cpf": current_user["cpf"],
        "data_nascimento": current_user["data_nascimento"],
        "telefone": current_user["telefone"],
        "email": current_user["email"]
    }

# ============ BIKE ROUTES ============

@api_router.post("/bikes", response_model=BikeResponse)
async def create_bike(bike_data: BikeCreate, current_user: dict = Depends(get_current_user)):
    if len(bike_data.fotos) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="É necessário enviar pelo menos 3 fotos da bicicleta"
        )
    
    bike_dict = {
        "proprietario_id": str(current_user["_id"]),
        "marca": bike_data.marca,
        "modelo": bike_data.modelo,
        "cor": bike_data.cor,
        "numero_serie": bike_data.numero_serie,
        "fotos": bike_data.fotos,
        "tipo": bike_data.tipo,
        "valor_estimado": bike_data.valor_estimado,
        "caracteristicas": bike_data.caracteristicas,
        "status": "Ativa",
        "link_rastreamento": bike_data.link_rastreamento,
        "data_furto": None,
        "created_at": datetime.utcnow().isoformat()
    }
    
    result = await db.bikes.insert_one(bike_dict)
    bike_dict["id"] = str(result.inserted_id)
    
    return bike_dict

@api_router.get("/bikes", response_model=List[BikeResponse])
async def get_bikes(current_user: dict = Depends(get_current_user)):
    bikes = await db.bikes.find({"proprietario_id": str(current_user["_id"])}).to_list(1000)
    
    result = []
    for bike in bikes:
        bike["id"] = str(bike["_id"])
        del bike["_id"]
        result.append(bike)
    
    return result

@api_router.get("/bikes/{bike_id}", response_model=BikeResponse)
async def get_bike(bike_id: str, current_user: dict = Depends(get_current_user)):
    try:
        bike = await db.bikes.find_one({"_id": ObjectId(bike_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bicicleta não encontrada"
        )
    
    if not bike:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bicicleta não encontrada"
        )
    
    if bike["proprietario_id"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar esta bicicleta"
        )
    
    bike["id"] = str(bike["_id"])
    del bike["_id"]
    return bike

@api_router.put("/bikes/{bike_id}", response_model=BikeResponse)
async def update_bike(bike_id: str, bike_data: BikeUpdate, current_user: dict = Depends(get_current_user)):
    try:
        bike = await db.bikes.find_one({"_id": ObjectId(bike_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bicicleta não encontrada"
        )
    
    if not bike:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bicicleta não encontrada"
        )
    
    if bike["proprietario_id"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para editar esta bicicleta"
        )
    
    # Update only provided fields
    update_data = {k: v for k, v in bike_data.dict().items() if v is not None}
    
    if update_data:
        await db.bikes.update_one(
            {"_id": ObjectId(bike_id)},
            {"$set": update_data}
        )
    
    # Get updated bike
    updated_bike = await db.bikes.find_one({"_id": ObjectId(bike_id)})
    updated_bike["id"] = str(updated_bike["_id"])
    del updated_bike["_id"]
    
    return updated_bike

@api_router.delete("/bikes/{bike_id}")
async def delete_bike(bike_id: str, current_user: dict = Depends(get_current_user)):
    try:
        bike = await db.bikes.find_one({"_id": ObjectId(bike_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bicicleta não encontrada"
        )
    
    if not bike:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bicicleta não encontrada"
        )
    
    if bike["proprietario_id"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para deletar esta bicicleta"
        )
    
    await db.bikes.delete_one({"_id": ObjectId(bike_id)})
    
    return {"message": "Bicicleta deletada com sucesso"}

@api_router.post("/bikes/{bike_id}/alert-furto")
async def alert_furto(bike_id: str, current_user: dict = Depends(get_current_user)):
    try:
        bike = await db.bikes.find_one({"_id": ObjectId(bike_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bicicleta não encontrada"
        )
    
    if not bike:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bicicleta não encontrada"
        )
    
    if bike["proprietario_id"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para alterar esta bicicleta"
        )
    
    # Update bike status
    await db.bikes.update_one(
        {"_id": ObjectId(bike_id)},
        {"$set": {
            "status": "Furtada",
            "data_furto": datetime.utcnow().isoformat()
        }}
    )
    
    # Get updated bike
    updated_bike = await db.bikes.find_one({"_id": ObjectId(bike_id)})
    updated_bike["id"] = str(updated_bike["_id"])
    del updated_bike["_id"]
    
    return updated_bike

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()