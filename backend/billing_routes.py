"""
Billing Routes - Endpoints para cobrança no Bike Segura BC
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from jose import JWTError, jwt
import os

from asaas_service import asaas_service
from billing_service import (
    sync_customer, create_device_subscription, cancel_device_subscription,
    can_monitor, PRICES
)
security = HTTPBearer()
SECRET_KEY = os.environ.get('SECRET_KEY', 'sua-chave-secreta-aqui')
ALGORITHM = "HS256"

billing_router = APIRouter(prefix="/api/billing")

class SubscriptionRequest(BaseModel):
    bike_id: str
    billing_cycle: str = "MONTHLY"
    billing_type: str = "UNDEFINED"

class CancelSubscriptionRequest(BaseModel):
    reason: Optional[str] = ""

class WebhookPayload(BaseModel):
    event: dict
    payment: dict
async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

@billing_router.post("/subscriptions")
async def create_subscription(
    request: SubscriptionRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Criar assinatura de serviço para uma bike"""
    try:
        from server import db
        # TODO: Pegar user_id do token JWT
        user_id = await get_current_user_id(credentials)
        result = await create_device_subscription(
            db, user_id, request.bike_id,
            request.billing_cycle, request.billing_type
        )
        return {
            "success": True,
            "data": {
                "subscription_id": str(result["subscription"]["_id"]),
                "asaas_subscription_id": result["asaas_subscription"]["id"],
                "status": result["subscription"]["status"],
                "amount": result["subscription"]["amount"],
                "billing_cycle": result["subscription"]["billing_cycle"],
                "next_billing_date": result["subscription"]["next_billing_date"],
                "bike_id": result["subscription"]["bike_id"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@billing_router.get("/subscriptions")
async def list_subscriptions():
    """Listar assinaturas do usuário"""
    from server import db
    subs = await db.subscriptions.find().sort("created_at", -1).to_list(None)
    for sub in subs:
        sub["id"] = str(sub["_id"])
        del sub["_id"]
    return {"success": True, "data": subs}

@billing_router.get("/prices")
async def get_prices():
    """Obter preços atuais"""
    return {
        "success": True,
        "data": {
            "service": {
                "monthly": {
                    "amount": PRICES["SERVICE"]["MONTHLY"],
                    "formatted": "R$ 19,90",
                    "cycle": "Mensal"
                },
                "annual": {
                    "amount": PRICES["SERVICE"]["ANNUAL"],
                    "formatted": "R$ 199,00",
                    "cycle": "Anual",
                    "savings": "16% de desconto"
                }
            }
        }
    }

@billing_router.post("/webhooks/asaas")
async def asaas_webhook(payload: WebhookPayload):
    """Receber webhooks do Asaas"""
    return {"success": True, "message": "Webhook received"}
