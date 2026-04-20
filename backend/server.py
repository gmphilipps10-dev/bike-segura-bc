from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import HTMLResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles
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
load_dotenv(ROOT_DIR / '.env', override=False)

# MongoDB connection with Atlas-friendly settings
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(
    mongo_url,
    serverSelectionTimeoutMS=5000,  # 5 second timeout for server selection
    connectTimeoutMS=10000,  # 10 second connection timeout
    socketTimeoutMS=10000,  # 10 second socket timeout
    retryWrites=True,  # Enable retryable writes
    retryReads=True,  # Enable retryable reads
    maxPoolSize=10,  # Connection pool size
)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ['SECRET_KEY']
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
    foto_perfil: Optional[str] = None  # Base64 da foto

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
    foto_perfil: Optional[str] = None

class BikeCreate(BaseModel):
    marca: str
    modelo: str
    cor: str
    numero_serie: str
    fotos: dict  # {"frente": "base64", "tras": "base64", "lateral_direita": "base64", "lateral_esquerda": "base64", "numero_quadro": "base64"}
    tipo: str
    caracteristicas: Optional[str] = None
    link_rastreamento: Optional[str] = None
    nota_fiscal: Optional[str] = None  # Base64 da nota fiscal (foto ou PDF)

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
    fotos: dict
    tipo: str
    caracteristicas: Optional[str] = None
    status: str  # Ativa, Furtada, Offline
    link_rastreamento: Optional[str] = None
    nota_fiscal: Optional[str] = None
    data_furto: Optional[str] = None
    ultima_atualizacao: Optional[str] = None
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
        "foto_perfil": user_data.foto_perfil,
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
        "email": current_user["email"],
        "foto_perfil": current_user.get("foto_perfil")
    }

class UpdateFotoPerfil(BaseModel):
    foto_perfil: str

@api_router.put("/auth/foto-perfil", response_model=UserResponse)
async def update_foto_perfil(data: UpdateFotoPerfil, current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"foto_perfil": data.foto_perfil}}
    )
    updated_user = await db.users.find_one({"_id": current_user["_id"]})
    return {
        "id": str(updated_user["_id"]),
        "nome_completo": updated_user["nome_completo"],
        "cpf": updated_user["cpf"],
        "data_nascimento": updated_user["data_nascimento"],
        "telefone": updated_user["telefone"],
        "email": updated_user["email"],
        "foto_perfil": updated_user.get("foto_perfil")
    }

# ============ ADMIN ROUTES ============

ADMIN_EMAIL = "gmphilipps10@gmail.com"
VALOR_PLANO_ANUAL_PADRAO = 49.90  # Valor padrão do plano anual

async def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalido")
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario nao encontrado")
        
        email = user.get("email", "").strip().lower()
        admin = ADMIN_EMAIL.strip().lower()
        
        if email != admin:
            raise HTTPException(status_code=403, detail="Acesso restrito")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalido")

@api_router.get("/admin/stats")
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    if current_user["email"] != ADMIN_EMAIL:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito ao administrador")
    
    total_users = await db.users.count_documents({})
    total_bikes = await db.bikes.count_documents({})
    total_bikes_furtadas = await db.bikes.count_documents({"status": "Furtada"})
    total_bikes_ativas = await db.bikes.count_documents({"status": "Ativa"})
    total_bikes_recuperadas = await db.bikes.count_documents({"status": "Recuperada"})
    
    recent_users_cursor = db.users.find(
        {}, {"nome_completo": 1, "email": 1, "created_at": 1}
    ).sort("created_at", -1).limit(5)
    recent_users = []
    async for u in recent_users_cursor:
        recent_users.append({
            "nome": u.get("nome_completo", ""),
            "email": u.get("email", ""),
            "data": str(u.get("created_at", ""))
        })
    
    return {
        "total_users": total_users, "total_bikes": total_bikes,
        "bikes_ativas": total_bikes_ativas, "bikes_furtadas": total_bikes_furtadas,
        "bikes_recuperadas": total_bikes_recuperadas, "recent_users": recent_users
    }

@api_router.get("/admin/users")
async def get_admin_users(admin_email: str = Depends(verify_admin)):
    # Buscar contagem de bikes por usuario em uma unica query
    bike_counts = {}
    pipeline = [
        {"$group": {
            "_id": "$proprietario_id",
            "total": {"$sum": 1},
            "furtadas": {"$sum": {"$cond": [{"$eq": ["$status", "Furtada"]}, 1, 0]}}
        }}
    ]
    async for doc in db.bikes.aggregate(pipeline):
        bike_counts[doc["_id"]] = {"total": doc["total"], "furtadas": doc["furtadas"]}
    
    users_cursor = db.users.find({}).sort("created_at", -1)
    users = []
    async for u in users_cursor:
        user_id = str(u["_id"])
        counts = bike_counts.get(user_id, {"total": 0, "furtadas": 0})
        
        pagamento = u.get("pagamento", {})
        status_pgto = pagamento.get("status", "pendente")
        data_venc = pagamento.get("data_vencimento")
        if data_venc and status_pgto == "ativo":
            try:
                venc = datetime.fromisoformat(data_venc)
                if venc < datetime.utcnow():
                    status_pgto = "vencido"
                    await db.users.update_one({"_id": u["_id"]}, {"$set": {"pagamento.status": "vencido"}})
            except:
                pass
        
        users.append({
            "id": user_id,
            "nome": u.get("nome_completo", ""),
            "email": u.get("email", ""),
            "cpf": u.get("cpf", ""),
            "telefone": u.get("telefone", ""),
            "data_inicio": u.get("created_at", ""),
            "total_bikes": counts["total"],
            "bikes_furtadas": counts["furtadas"],
            "pagamento": {
                "status": status_pgto,
                "data_inicio": pagamento.get("data_inicio"),
                "data_vencimento": data_venc,
                "tipo": pagamento.get("tipo", "pendente"),
                "valor": pagamento.get("valor", VALOR_PLANO_ANUAL_PADRAO),
                "descricao": pagamento.get("descricao", ""),
            }
        })
    return users

@api_router.put("/admin/users/{user_id}/pagamento")
async def update_user_pagamento(user_id: str, data: dict, admin_email: str = Depends(verify_admin)):
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")
    
    now = datetime.utcnow()
    tipo = data.get("tipo", "manual")
    valor = data.get("valor", VALOR_PLANO_ANUAL_PADRAO)
    descricao = data.get("descricao", "")
    
    # Tentar converter valor para float
    try:
        valor = float(valor)
    except (ValueError, TypeError):
        valor = VALOR_PLANO_ANUAL_PADRAO
    
    pagamento = {
        "status": "ativo",
        "data_inicio": now.isoformat(),
        "data_vencimento": (now + timedelta(days=365)).isoformat(),
        "tipo": tipo,
        "valor": valor,
        "descricao": descricao,
        "ultima_atualizacao": now.isoformat()
    }
    
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"pagamento": pagamento}}
    )
    
    # Registrar no historico de pagamentos
    historico_entry = {
        "user_id": user_id,
        "user_nome": user.get("nome_completo", ""),
        "user_email": user.get("email", ""),
        "acao": "pagamento_ativado",
        "valor": valor,
        "tipo": tipo,
        "descricao": descricao,
        "status_anterior": user.get("pagamento", {}).get("status", "pendente"),
        "status_novo": "ativo",
        "data": now.isoformat(),
        "admin_email": admin_email
    }
    await db.payment_history.insert_one(historico_entry)
    
    return {"message": "Pagamento atualizado", "pagamento": pagamento}

@api_router.put("/admin/users/{user_id}/cancelar-pagamento")
async def cancelar_pagamento(user_id: str, admin_email: str = Depends(verify_admin)):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")
    
    now = datetime.utcnow()
    pagamento_atual = user.get("pagamento", {})
    
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"pagamento.status": "cancelado", "pagamento.ultima_atualizacao": now.isoformat()}}
    )
    
    # Registrar no historico
    historico_entry = {
        "user_id": user_id,
        "user_nome": user.get("nome_completo", ""),
        "user_email": user.get("email", ""),
        "acao": "pagamento_cancelado",
        "valor": pagamento_atual.get("valor", 0),
        "tipo": pagamento_atual.get("tipo", ""),
        "descricao": "Cancelamento pelo administrador",
        "status_anterior": pagamento_atual.get("status", "pendente"),
        "status_novo": "cancelado",
        "data": now.isoformat(),
        "admin_email": admin_email
    }
    await db.payment_history.insert_one(historico_entry)
    
    return {"message": "Pagamento cancelado"}

@api_router.get("/admin/dashboard")
async def get_admin_dashboard(admin_email: str = Depends(verify_admin)):
    total_users = await db.users.count_documents({})
    total_bikes = await db.bikes.count_documents({})
    furtadas = await db.bikes.count_documents({"status": "Furtada"})
    ativas = await db.bikes.count_documents({"status": "Ativa"})
    
    pgto_ativos = await db.users.count_documents({"pagamento.status": "ativo"})
    pgto_pendentes = await db.users.count_documents({"$or": [{"pagamento": {"$exists": False}}, {"pagamento.status": "pendente"}]})
    pgto_vencidos = await db.users.count_documents({"pagamento.status": "vencido"})
    
    # Calcular receita real a partir dos valores dos usuarios ativos
    receita_total_anual = 0
    async for u in db.users.find({"pagamento.status": "ativo"}, {"pagamento.valor": 1}):
        valor = u.get("pagamento", {}).get("valor", VALOR_PLANO_ANUAL_PADRAO)
        try:
            receita_total_anual += float(valor)
        except (ValueError, TypeError):
            receita_total_anual += VALOR_PLANO_ANUAL_PADRAO
    
    return {
        "total_users": total_users, "total_bikes": total_bikes,
        "bikes_furtadas": furtadas, "bikes_ativas": ativas,
        "pagamentos_ativos": pgto_ativos, "pagamentos_pendentes": pgto_pendentes + (total_users - pgto_ativos - pgto_vencidos),
        "pagamentos_vencidos": pgto_vencidos,
        "receita_mensal_estimada": receita_total_anual / 12,
        "receita_anual_total": receita_total_anual,
    }

@api_router.get("/admin/users/{user_id}/historico-pagamentos")
async def get_historico_pagamentos(user_id: str, admin_email: str = Depends(verify_admin)):
    historico = []
    cursor = db.payment_history.find({"user_id": user_id}).sort("data", -1)
    async for entry in cursor:
        entry["id"] = str(entry["_id"])
        del entry["_id"]
        historico.append(entry)
    return historico

@api_router.get("/admin/panel", response_class=HTMLResponse)
async def admin_panel():
    html_path = ROOT_DIR / "admin_panel.html"
    if html_path.exists():
        return HTMLResponse(content=html_path.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>Painel não encontrado</h1>", status_code=404)

# ============ BIKE ROUTES ============

@api_router.post("/bikes", response_model=BikeResponse)
async def create_bike(bike_data: BikeCreate, current_user: dict = Depends(get_current_user)):
    # Fotos são opcionais (permite array vazio para testes no navegador)
    # Validar que as fotos obrigatórias foram enviadas (se houver fotos)
    if bike_data.fotos and isinstance(bike_data.fotos, dict):
        required_photos = ['frente', 'tras', 'lateral_direita', 'lateral_esquerda', 'numero_quadro']
        missing = [p for p in required_photos if not bike_data.fotos.get(p)]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Fotos obrigatórias faltando: {', '.join(missing)}"
            )
    
    bike_dict = {
        "proprietario_id": str(current_user["_id"]),
        "marca": bike_data.marca,
        "modelo": bike_data.modelo,
        "cor": bike_data.cor,
        "numero_serie": bike_data.numero_serie,
        "fotos": bike_data.fotos if bike_data.fotos else {},
        "tipo": bike_data.tipo,
        "caracteristicas": bike_data.caracteristicas,
        "status": "Ativa",
        "link_rastreamento": bike_data.link_rastreamento,
        "nota_fiscal": bike_data.nota_fiscal,
        "data_furto": None,
        "ultima_atualizacao": datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow().isoformat()
    }
    
    result = await db.bikes.insert_one(bike_dict)
    bike_dict["id"] = str(result.inserted_id)
    
    return bike_dict

@api_router.get("/bikes", response_model=List[BikeResponse])
async def get_bikes(current_user: dict = Depends(get_current_user)):
    bikes = await db.bikes.find(
        {"proprietario_id": str(current_user["_id"])}
    ).limit(100).to_list(100)
    
    result = []
    for bike in bikes:
        bike["id"] = str(bike["_id"])
        del bike["_id"]
        # Migrar fotos de array legado para dict
        if isinstance(bike.get("fotos"), list):
            bike["fotos"] = {}
        if not isinstance(bike.get("fotos"), dict):
            bike["fotos"] = {}
        # Garantir nota_fiscal existe
        if "nota_fiscal" not in bike:
            bike["nota_fiscal"] = None
        # Garantir ultima_atualizacao existe
        if "ultima_atualizacao" not in bike:
            bike["ultima_atualizacao"] = bike.get("created_at")
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
    # Migrar fotos legado
    if isinstance(bike.get("fotos"), list):
        bike["fotos"] = {}
    if not isinstance(bike.get("fotos"), dict):
        bike["fotos"] = {}
    if "nota_fiscal" not in bike:
        bike["nota_fiscal"] = None
    if "ultima_atualizacao" not in bike:
        bike["ultima_atualizacao"] = bike.get("created_at")
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
            "data_furto": datetime.utcnow().isoformat(),
            "ultima_atualizacao": datetime.utcnow().isoformat()
        }}
    )
    
    # Get updated bike
    updated_bike = await db.bikes.find_one({"_id": ObjectId(bike_id)})
    updated_bike["id"] = str(updated_bike["_id"])
    del updated_bike["_id"]
    
    return updated_bike

@api_router.post("/bikes/{bike_id}/recuperar")
async def recuperar_bike(bike_id: str, current_user: dict = Depends(get_current_user)):
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
    
    await db.bikes.update_one(
        {"_id": ObjectId(bike_id)},
        {"$set": {
            "status": "Ativa",
            "data_furto": None,
            "ultima_atualizacao": datetime.utcnow().isoformat()
        }}
    )
    
    updated_bike = await db.bikes.find_one({"_id": ObjectId(bike_id)})
    updated_bike["id"] = str(updated_bike["_id"])
    del updated_bike["_id"]
    
    return updated_bike

# Include the router in the main app
app.include_router(api_router)

# Health check endpoints for Kubernetes
@api_router.get("/status")
async def root():
    """Root endpoint for health checks"""
    return {"status": "online", "app": "BIKE SEGURA BC", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    """Dedicated health check endpoint"""
    try:
        await db.command("ping")
        return {"status": "healthy", "database": "connected", "app": "BIKE SEGURA BC"}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unavailable")

@app.get("/favicon.ico")
async def favicon():
    """Return 204 for favicon requests to avoid 404 errors"""
    from fastapi.responses import Response
    return Response(status_code=204)

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

# ============ SERVE FRONTEND STATIC FILES ============
# Serve PWA static files (built Vite app)
STATIC_DIR = ROOT_DIR / "static_frontend"
if STATIC_DIR.exists():
    # Serve static assets (js, css, images, manifest, sw)
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="static-assets")

    @app.get("/manifest.json")
    async def serve_manifest():
        return FileResponse(str(STATIC_DIR / "manifest.json"), media_type="application/json")

    @app.get("/sw.js")
    async def serve_sw():
        return FileResponse(str(STATIC_DIR / "sw.js"), media_type="application/javascript")

    @app.get("/logo.jpg")
    async def serve_logo():
        return FileResponse(str(STATIC_DIR / "logo.jpg"), media_type="image/jpeg")

    @app.get("/icon-192.png")
    async def serve_icon192():
        return FileResponse(str(STATIC_DIR / "icon-192.png"), media_type="image/png")

    @app.get("/icon-512.png")
    async def serve_icon512():
        return FileResponse(str(STATIC_DIR / "icon-512.png"), media_type="image/png")

    @app.get("/apple-touch-icon.png")
    async def serve_apple_icon():
        return FileResponse(str(STATIC_DIR / "apple-touch-icon.png"), media_type="image/png")

    # SPA fallback - serve index.html for all non-API routes
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = STATIC_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(STATIC_DIR / "index.html"), media_type="text/html")
