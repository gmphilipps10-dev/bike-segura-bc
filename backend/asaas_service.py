"""
Asaas Service - Integração com API v3 do Asaas
Para Bike Segura BC
"""
import os
import httpx
from datetime import datetime, timedelta

ASAAS_API_KEY = os.environ.get("ASAAS_API_KEY", "")
ASAAS_SANDBOX = os.environ.get("ASAAS_SANDBOX", "true").lower() == "true"

BASE_URL = "https://sandbox.asaas.com/api/v3" if ASAAS_SANDBOX else "https://api.asaas.com/api/v3"

HEADERS = {
    "access_token": ASAAS_API_KEY,
    "Content-Type": "application/json"
}

class AsaasService:
    """Serviço de integração com Asaas"""
    
    @staticmethod
    async def _request(method: str, endpoint: str, data: dict = None) -> dict:
        """Faz requisição para API Asaas"""
        url = f"{BASE_URL}{endpoint}"
        async with httpx.AsyncClient(timeout=30) as client:
            if method == "GET":
                response = await client.get(url, headers=HEADERS)
            elif method == "POST":
                response = await client.post(url, headers=HEADERS, json=data)
            elif method == "DELETE":
                response = await client.delete(url, headers=HEADERS)
            else:
                raise ValueError(f"Método não suportado: {method}")
            
            if response.status_code >= 400:
                error_data = response.json() if response.text else {}
                errors = error_data.get("errors", [{}])
                error_msg = errors[0].get("description", response.text) if errors else response.text
                raise Exception(f"Asaas API Error: {error_msg}")
            
            return response.json() if response.text else {}
    
    @classmethod
    async def create_customer(cls, user_data: dict) -> dict:
        """Criar cliente no Asaas"""
        payload = {
            "name": user_data.get("nome_completo"),
            "email": user_data.get("email"),
            "phone": user_data.get("telefone"),
            "cpfCnpj": user_data.get("cpf", "").replace(r"[^0-9]", ""),
            "mobilePhone": user_data.get("telefone"),
            "notificationDisabled": False
        }
        return await cls._request("POST", "/customers", payload)
    
    @classmethod
    async def create_subscription(cls, customer_id: str, value: float,
                                   description: str, cycle: str = "MONTHLY",
                                   billing_type: str = "UNDEFINED",
                                   next_due_date: str = None,
                                   external_reference: str = None) -> dict:
        """Criar assinatura mensal"""
        if not next_due_date:
            next_due_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        payload = {
            "customer": customer_id,
            "billingType": billing_type,
            "value": value,
            "cycle": cycle,
            "nextDueDate": next_due_date,
            "description": description,
            "externalReference": external_reference or f"SUB_{customer_id}_{int(datetime.now().timestamp())}"
        }
        return await cls._request("POST", "/subscriptions", payload)
    
    @classmethod
    async def cancel_subscription(cls, subscription_id: str) -> dict:
        """Cancelar assinatura"""
        return await cls._request("DELETE", f"/subscriptions/{subscription_id}")
    
    @classmethod
    async def get_pix_qr_code(cls, payment_id: str) -> dict:
        """Obter QR Code PIX"""
        return await cls._request("GET", f"/payments/{payment_id}/pixQrCode")

# Instância singleton
asaas_service = AsaasService()
