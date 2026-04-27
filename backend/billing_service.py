"""
Billing Service - Lógica de cobrança do Bike Segura BC
"""
from datetime import datetime, timedelta
from bson import ObjectId
from asaas_service import asaas_service

PRICES = {
    "SERVICE": {
        "MONTHLY": 1990,
        "ANNUAL": 19900
    }
}

async def sync_customer(db, user_id: str):
    """Criar ou sincronizar cliente no Asaas"""
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise ValueError("Usuário não encontrado")
    
    if user.get("asaas_customer_id"):
        return {"customer_id": user["asaas_customer_id"], "action": "existing"}
    
    customer = await asaas_service.create_customer(user)
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"asaas_customer_id": customer["id"]}}
    )
    return {"customer_id": customer["id"], "action": "created"}

async def create_device_subscription(db, user_id: str, bike_id: str,
                                      billing_cycle: str = "MONTHLY",
                                      billing_type: str = "UNDEFINED"):
    """Criar assinatura de serviço para uma bike"""
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    bike = await db.bikes.find_one({"_id": ObjectId(bike_id)})
    
    if not user or not bike:
        raise ValueError("Usuário ou bike não encontrados")
    
    if bike.get("proprietario_id") != user_id:
        raise ValueError("Bike não pertence ao usuário")
    
    existing_sub = await db.subscriptions.find_one({
        "bike_id": bike_id,
        "status": {"$in": ["ACTIVE", "PAST_DUE"]}
    })
    
    if existing_sub:
        raise ValueError("Já existe assinatura ativa para esta bike")
    
    if not user.get("asaas_customer_id"):
        await sync_customer(db, user_id)
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    amount = PRICES["SERVICE"][billing_cycle]
    value_decimal = amount / 100
    
    subscription = await asaas_service.create_subscription(
        customer_id=user["asaas_customer_id"],
        value=value_decimal,
        description=f"Bike Segura BC - Monitoramento {billing_cycle} - {bike.get('marca', '')} {bike.get('modelo', '')}",
        billing_type=billing_type,
        cycle=billing_cycle,
        external_reference=f"SUB_{user_id}_{bike_id}_{billing_cycle}_{int(datetime.now().timestamp())}"
    )
    
    sub_doc = {
        "user_id": user_id,
        "bike_id": bike_id,
        "asaas_subscription_id": subscription["id"],
        "asaas_customer_id": user["asaas_customer_id"],
        "billing_cycle": billing_cycle,
        "amount": amount,
        "status": "ACTIVE",
        "start_date": datetime.utcnow().isoformat(),
        "next_billing_date": datetime.strptime(subscription["nextDueDate"], "%Y-%m-%d").isoformat() if subscription.get("nextDueDate") else None,
        "payment_method": billing_type,
        "grace_period_days": 3,
        "metadata": {
            "plan_name": "Bike Segura BC - Monitoramento",
            "bike_name": f"{bike.get('marca', '')} {bike.get('modelo', '')}"
        },
        "created_at": datetime.utcnow().isoformat()
    }
    
    result = await db.subscriptions.insert_one(sub_doc)
    sub_doc["_id"] = str(result.inserted_id)
    
    await db.bikes.update_one(
        {"_id": ObjectId(bike_id)},
        {"$set": {
            "monitoramento_ativo": True,
            "monitoramento_ativado_em": datetime.utcnow().isoformat()
        }}
    )
    
    return {
        "subscription": sub_doc,
        "asaas_subscription": subscription
    }

async def cancel_device_subscription(db, subscription_id: str, reason: str = ""):
    """Cancelar assinatura de uma bike"""
    sub = await db.subscriptions.find_one({"_id": ObjectId(subscription_id)})
    if not sub:
        raise ValueError("Assinatura não encontrada")
    
    await asaas_service.cancel_subscription(sub["asaas_subscription_id"])
    
    await db.subscriptions.update_one(
        {"_id": ObjectId(subscription_id)},
        {"$set": {
            "status": "CANCELED",
            "canceled_at": datetime.utcnow().isoformat(),
            "cancel_reason": reason
        }}
    )
    
    await db.bikes.update_one(
        {"_id": ObjectId(sub["bike_id"])},
        {"$set": {"monitoramento_ativo": False}}
    )
    
    return {"success": True, "message": "Assinatura cancelada"}

async def can_monitor(db, bike_id: str) -> dict:
    """Verificar se bike pode usar monitoramento"""
    bike = await db.bikes.find_one({"_id": ObjectId(bike_id)})
    if not bike:
        return {"allowed": False, "reason": "bike_not_found"}
    
    sub = await db.subscriptions.find_one({
        "bike_id": bike_id,
        "status": "ACTIVE"
    })
    
    if not sub:
        return {"allowed": False, "reason": "subscription_not_active"}
    
    return {"allowed": True, "subscription": sub}
