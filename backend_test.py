#!/usr/bin/env python3
"""
BIKE SEGURA BC - Admin Payment Features Test Suite
Testing the new Admin Payment features with custom valor and payment history
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://bike-tracking-alert.preview.emergentagent.com/api"

# Test credentials from test_credentials.md
ADMIN_EMAIL = "admin.test@bikesegura.com"
ADMIN_PASSWORD = "AdminTest@123"
TEST_USER_EMAIL = "joao.silva@bikesegura.com"
TEST_USER_PASSWORD = "MinhaSenh@123"

class AdminPaymentTester:
    def __init__(self):
        self.admin_token = None
        self.test_user_id = None
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def log_error(self, message):
        self.log(message, "ERROR")
        
    def log_success(self, message):
        self.log(message, "SUCCESS")
        
    def setup_admin_user(self):
        """Register admin user if not exists and login to get JWT token"""
        self.log("Setting up admin user...")
        
        # Try to register admin user first
        admin_data = {
            "nome_completo": "Admin User",
            "cpf": "00000000000",
            "data_nascimento": "01/01/1980",
            "telefone": "(11) 99999-0000",
            "email": ADMIN_EMAIL,
            "senha": ADMIN_PASSWORD
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/register", json=admin_data)
            if response.status_code == 201:
                self.log_success(f"Admin user registered successfully")
            elif response.status_code == 400 and "já existe" in response.text:
                self.log("Admin user already exists, proceeding to login")
            else:
                self.log_error(f"Failed to register admin: {response.status_code} - {response.text}")
        except Exception as e:
            self.log_error(f"Exception during admin registration: {e}")
            
        # Login admin user
        login_data = {
            "email": ADMIN_EMAIL,
            "senha": ADMIN_PASSWORD
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data["access_token"]
                self.log_success(f"Admin login successful, token obtained")
                return True
            else:
                self.log_error(f"Admin login failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_error(f"Exception during admin login: {e}")
            return False
            
    def get_test_user_id(self):
        """Get the user_id of the test user for payment operations"""
        self.log("Getting test user ID...")
        
        # First login as test user to ensure they exist
        login_data = {
            "email": TEST_USER_EMAIL,
            "senha": TEST_USER_PASSWORD
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                self.test_user_id = data["user"]["id"]
                self.log_success(f"Test user ID obtained: {self.test_user_id}")
                return True
            else:
                self.log_error(f"Test user login failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_error(f"Exception getting test user ID: {e}")
            return False
            
    def test_admin_payment_with_custom_valor(self):
        """Test PUT /api/admin/users/{user_id}/pagamento with custom valor"""
        self.log("Testing admin payment with custom valor...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        payment_data = {
            "tipo": "pix",
            "valor": 99.90,
            "descricao": "Plano Premium Anual"
        }
        
        try:
            response = self.session.put(
                f"{BASE_URL}/admin/users/{self.test_user_id}/pagamento",
                json=payment_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_success(f"Payment activated successfully")
                self.log(f"Response: {json.dumps(data, indent=2)}")
                
                # Verify the response contains correct valor and descricao
                if "valor" in data and data["valor"] == 99.90:
                    self.log_success("✅ Correct valor (99.90) returned in response")
                else:
                    self.log_error(f"❌ Incorrect valor in response: {data.get('valor')}")
                    
                if "descricao" in data and data["descricao"] == "Plano Premium Anual":
                    self.log_success("✅ Correct descricao returned in response")
                else:
                    self.log_error(f"❌ Incorrect descricao in response: {data.get('descricao')}")
                    
                return True
            else:
                self.log_error(f"Payment activation failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_error(f"Exception during payment activation: {e}")
            return False
            
    def verify_user_payment_in_admin_list(self):
        """Verify GET /api/admin/users shows user with correct valor and descricao"""
        self.log("Verifying user payment in admin users list...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        try:
            response = self.session.get(f"{BASE_URL}/admin/users", headers=headers)
            
            if response.status_code == 200:
                users = response.json()
                self.log_success(f"Admin users list retrieved successfully")
                
                # Find our test user
                test_user = None
                for user in users:
                    if user["id"] == self.test_user_id:
                        test_user = user
                        break
                        
                if test_user:
                    self.log_success(f"Test user found in admin list")
                    pagamento = test_user.get("pagamento", {})
                    
                    if pagamento.get("valor") == 99.90:
                        self.log_success("✅ Correct valor (99.90) in user pagamento object")
                    else:
                        self.log_error(f"❌ Incorrect valor in user pagamento: {pagamento.get('valor')}")
                        
                    if pagamento.get("descricao") == "Plano Premium Anual":
                        self.log_success("✅ Correct descricao in user pagamento object")
                    else:
                        self.log_error(f"❌ Incorrect descricao in user pagamento: {pagamento.get('descricao')}")
                        
                    return True
                else:
                    self.log_error(f"❌ Test user not found in admin users list")
                    return False
            else:
                self.log_error(f"Failed to get admin users: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_error(f"Exception getting admin users: {e}")
            return False
            
    def test_payment_history(self):
        """Test GET /api/admin/users/{user_id}/historico-pagamentos"""
        self.log("Testing payment history endpoint...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        try:
            response = self.session.get(
                f"{BASE_URL}/admin/users/{self.test_user_id}/historico-pagamentos",
                headers=headers
            )
            
            if response.status_code == 200:
                history = response.json()
                self.log_success(f"Payment history retrieved successfully")
                self.log(f"History entries: {len(history)}")
                
                if len(history) >= 1:
                    latest_entry = history[0]  # Should be ordered by date desc
                    self.log(f"Latest entry: {json.dumps(latest_entry, indent=2)}")
                    
                    # Verify the entry has correct data
                    if latest_entry.get("acao") == "pagamento_ativado":
                        self.log_success("✅ Correct acao (pagamento_ativado) in history")
                    else:
                        self.log_error(f"❌ Incorrect acao in history: {latest_entry.get('acao')}")
                        
                    if latest_entry.get("valor") == 99.90:
                        self.log_success("✅ Correct valor (99.90) in history")
                    else:
                        self.log_error(f"❌ Incorrect valor in history: {latest_entry.get('valor')}")
                        
                    if latest_entry.get("descricao") == "Plano Premium Anual":
                        self.log_success("✅ Correct descricao in history")
                    else:
                        self.log_error(f"❌ Incorrect descricao in history: {latest_entry.get('descricao')}")
                        
                    return True
                else:
                    self.log_error("❌ No history entries found")
                    return False
            else:
                self.log_error(f"Failed to get payment history: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_error(f"Exception getting payment history: {e}")
            return False
            
    def test_cancel_payment(self):
        """Test PUT /api/admin/users/{user_id}/cancelar-pagamento"""
        self.log("Testing payment cancellation...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        try:
            response = self.session.put(
                f"{BASE_URL}/admin/users/{self.test_user_id}/cancelar-pagamento",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_success(f"Payment cancelled successfully")
                self.log(f"Response: {json.dumps(data, indent=2)}")
                return True
            else:
                self.log_error(f"Payment cancellation failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_error(f"Exception during payment cancellation: {e}")
            return False
            
    def verify_cancelled_status(self):
        """Verify GET /api/admin/users shows status 'cancelado'"""
        self.log("Verifying cancelled payment status...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        try:
            response = self.session.get(f"{BASE_URL}/admin/users", headers=headers)
            
            if response.status_code == 200:
                users = response.json()
                
                # Find our test user
                test_user = None
                for user in users:
                    if user["id"] == self.test_user_id:
                        test_user = user
                        break
                        
                if test_user:
                    pagamento = test_user.get("pagamento", {})
                    status = pagamento.get("status")
                    
                    if status == "cancelado":
                        self.log_success("✅ Payment status correctly set to 'cancelado'")
                        return True
                    else:
                        self.log_error(f"❌ Incorrect payment status: {status}")
                        return False
                else:
                    self.log_error(f"❌ Test user not found in admin users list")
                    return False
            else:
                self.log_error(f"Failed to get admin users: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_error(f"Exception verifying cancelled status: {e}")
            return False
            
    def test_second_payment_activation(self):
        """Test activating payment again with different valor"""
        self.log("Testing second payment activation with different valor...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        payment_data = {
            "tipo": "cartao",
            "valor": 149.90,
            "descricao": "Plano Familia Anual"
        }
        
        try:
            response = self.session.put(
                f"{BASE_URL}/admin/users/{self.test_user_id}/pagamento",
                json=payment_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_success(f"Second payment activated successfully")
                self.log(f"Response: {json.dumps(data, indent=2)}")
                return True
            else:
                self.log_error(f"Second payment activation failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_error(f"Exception during second payment activation: {e}")
            return False
            
    def verify_history_has_three_entries(self):
        """Verify payment history now has 3 entries total"""
        self.log("Verifying payment history has 3 entries...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        try:
            response = self.session.get(
                f"{BASE_URL}/admin/users/{self.test_user_id}/historico-pagamentos",
                headers=headers
            )
            
            if response.status_code == 200:
                history = response.json()
                self.log_success(f"Payment history retrieved successfully")
                self.log(f"Total history entries: {len(history)}")
                
                if len(history) == 3:
                    self.log_success("✅ Payment history has exactly 3 entries")
                    
                    # Log all entries for verification
                    for i, entry in enumerate(history):
                        self.log(f"Entry {i+1}: {entry.get('acao')} - {entry.get('valor')} - {entry.get('descricao')}")
                        
                    return True
                else:
                    self.log_error(f"❌ Expected 3 history entries, found {len(history)}")
                    return False
            else:
                self.log_error(f"Failed to get payment history: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_error(f"Exception getting payment history: {e}")
            return False
            
    def test_admin_dashboard(self):
        """Test GET /api/admin/dashboard for receita_anual_total field"""
        self.log("Testing admin dashboard...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        try:
            response = self.session.get(f"{BASE_URL}/admin/dashboard", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.log_success(f"Admin dashboard retrieved successfully")
                self.log(f"Dashboard data: {json.dumps(data, indent=2)}")
                
                # Verify receita_anual_total field exists
                if "receita_anual_total" in data:
                    self.log_success("✅ receita_anual_total field present in dashboard")
                    self.log(f"receita_anual_total: {data['receita_anual_total']}")
                else:
                    self.log_error("❌ receita_anual_total field missing from dashboard")
                    
                # Verify receita_mensal_estimada is computed
                if "receita_mensal_estimada" in data:
                    self.log_success("✅ receita_mensal_estimada field present in dashboard")
                    self.log(f"receita_mensal_estimada: {data['receita_mensal_estimada']}")
                else:
                    self.log_error("❌ receita_mensal_estimada field missing from dashboard")
                    
                return True
            else:
                self.log_error(f"Admin dashboard failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_error(f"Exception getting admin dashboard: {e}")
            return False
            
    def test_non_admin_access(self):
        """Test that non-admin users get 403 for admin endpoints"""
        self.log("Testing non-admin access restrictions...")
        
        # Login as regular test user
        login_data = {
            "email": TEST_USER_EMAIL,
            "senha": TEST_USER_PASSWORD
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                user_token = data["access_token"]
                
                # Try to access admin endpoint with user token
                headers = {"Authorization": f"Bearer {user_token}"}
                response = self.session.get(f"{BASE_URL}/admin/users", headers=headers)
                
                if response.status_code == 403:
                    self.log_success("✅ Non-admin user correctly denied access (403)")
                    return True
                else:
                    self.log_error(f"❌ Non-admin user should get 403, got {response.status_code}")
                    return False
            else:
                self.log_error(f"Failed to login as test user: {response.status_code}")
                return False
        except Exception as e:
            self.log_error(f"Exception testing non-admin access: {e}")
            return False
            
    def run_all_tests(self):
        """Run all admin payment tests"""
        self.log("=" * 60)
        self.log("BIKE SEGURA BC - Admin Payment Features Test Suite")
        self.log("=" * 60)
        
        tests = [
            ("Setup Admin User", self.setup_admin_user),
            ("Get Test User ID", self.get_test_user_id),
            ("Test Payment with Custom Valor", self.test_admin_payment_with_custom_valor),
            ("Verify User Payment in Admin List", self.verify_user_payment_in_admin_list),
            ("Test Payment History", self.test_payment_history),
            ("Test Cancel Payment", self.test_cancel_payment),
            ("Verify Cancelled Status", self.verify_cancelled_status),
            ("Test Second Payment Activation", self.test_second_payment_activation),
            ("Verify History Has 3 Entries", self.verify_history_has_three_entries),
            ("Test Admin Dashboard", self.test_admin_dashboard),
            ("Test Non-Admin Access", self.test_non_admin_access),
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            self.log(f"\n--- {test_name} ---")
            try:
                if test_func():
                    passed += 1
                    self.log_success(f"✅ {test_name} PASSED")
                else:
                    failed += 1
                    self.log_error(f"❌ {test_name} FAILED")
            except Exception as e:
                failed += 1
                self.log_error(f"❌ {test_name} FAILED with exception: {e}")
                
        self.log("\n" + "=" * 60)
        self.log(f"TEST SUMMARY: {passed} PASSED, {failed} FAILED")
        self.log("=" * 60)
        
        return failed == 0

if __name__ == "__main__":
    tester = AdminPaymentTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)