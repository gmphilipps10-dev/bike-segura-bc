#!/usr/bin/env python3
"""
BIKE SEGURA BC - Backend Edge Case Testing
Tests validation and error handling scenarios
"""

import requests
import json
from datetime import datetime

BASE_URL = "https://bike-tracking-alert.preview.emergentagent.com/api"

class EdgeCaseTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
    
    def test_bike_create_insufficient_photos(self):
        """Test bike creation with less than 3 photos (should fail)"""
        try:
            # First register and login to get token
            test_user = {
                "nome_completo": "Maria Santos",
                "cpf": "98765432100",
                "data_nascimento": "20/05/1985",
                "telefone": "(11) 88888-7777",
                "email": "maria.santos@bikesegura.com",
                "senha": "MinhaSenh@456"
            }
            
            register_response = self.session.post(
                f"{self.base_url}/auth/register",
                json=test_user,
                headers={"Content-Type": "application/json"}
            )
            
            if register_response.status_code != 200:
                self.log(f"❌ Edge Case Setup Failed: Could not register user")
                return False
                
            auth_token = register_response.json()["access_token"]
            
            # Try to create bike with only 2 photos (should fail)
            bike_data = {
                "marca": "Caloi",
                "modelo": "City Bike",
                "cor": "Vermelho",
                "numero_serie": "CAL987654321",
                "fotos": [
                    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
                    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                ],  # Only 2 photos
                "tipo": "City Bike"
            }
            
            headers = {
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.post(
                f"{self.base_url}/bikes",
                json=bike_data,
                headers=headers
            )
            
            if response.status_code == 400:
                error_data = response.json()
                if "pelo menos 3 fotos" in error_data.get("detail", ""):
                    self.log("✅ Edge Case - Insufficient Photos: PASSED (correctly rejected)")
                    return True
                else:
                    self.log(f"❌ Edge Case - Insufficient Photos: FAILED - Wrong error message: {error_data}")
                    return False
            else:
                self.log(f"❌ Edge Case - Insufficient Photos: FAILED - Expected 400, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Edge Case - Insufficient Photos: FAILED - {str(e)}")
            return False
    
    def test_duplicate_email_registration(self):
        """Test registering with duplicate email (should fail)"""
        try:
            test_user = {
                "nome_completo": "Pedro Silva",
                "cpf": "11122233344",
                "data_nascimento": "10/12/1992",
                "telefone": "(11) 77777-6666",
                "email": "joao.silva@bikesegura.com",  # Same email as first test
                "senha": "OutraSenh@789"
            }
            
            response = self.session.post(
                f"{self.base_url}/auth/register",
                json=test_user,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 400:
                error_data = response.json()
                if "já cadastrado" in error_data.get("detail", ""):
                    self.log("✅ Edge Case - Duplicate Email: PASSED (correctly rejected)")
                    return True
                else:
                    self.log(f"❌ Edge Case - Duplicate Email: FAILED - Wrong error message: {error_data}")
                    return False
            else:
                self.log(f"❌ Edge Case - Duplicate Email: FAILED - Expected 400, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Edge Case - Duplicate Email: FAILED - {str(e)}")
            return False
    
    def test_unauthorized_access(self):
        """Test accessing protected endpoints without token (should fail)"""
        try:
            # Try to access /auth/me without token
            response = self.session.get(f"{self.base_url}/auth/me")
            
            if response.status_code == 401:
                self.log("✅ Edge Case - Unauthorized Access: PASSED (correctly rejected)")
                return True
            else:
                self.log(f"❌ Edge Case - Unauthorized Access: FAILED - Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Edge Case - Unauthorized Access: FAILED - {str(e)}")
            return False
    
    def test_invalid_login(self):
        """Test login with wrong credentials (should fail)"""
        try:
            login_data = {
                "email": "nonexistent@bikesegura.com",
                "senha": "WrongPassword123"
            }
            
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 401:
                error_data = response.json()
                if "incorretos" in error_data.get("detail", ""):
                    self.log("✅ Edge Case - Invalid Login: PASSED (correctly rejected)")
                    return True
                else:
                    self.log(f"❌ Edge Case - Invalid Login: FAILED - Wrong error message: {error_data}")
                    return False
            else:
                self.log(f"❌ Edge Case - Invalid Login: FAILED - Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Edge Case - Invalid Login: FAILED - {str(e)}")
            return False
    
    def run_edge_case_tests(self):
        """Run all edge case tests"""
        self.log("🧪 Starting BIKE SEGURA BC Backend Edge Case Tests")
        self.log(f"🌐 Testing against: {self.base_url}")
        
        tests = [
            ("Insufficient Photos Validation", self.test_bike_create_insufficient_photos),
            ("Duplicate Email Validation", self.test_duplicate_email_registration),
            ("Unauthorized Access Protection", self.test_unauthorized_access),
            ("Invalid Login Protection", self.test_invalid_login)
        ]
        
        results = []
        for test_name, test_func in tests:
            self.log(f"\n🔍 Testing {test_name}...")
            result = test_func()
            results.append((test_name, result))
        
        # Summary
        self.log("\n" + "="*60)
        self.log("📊 EDGE CASE TEST RESULTS")
        self.log("="*60)
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASSED" if result else "❌ FAILED"
            self.log(f"{test_name}: {status}")
        
        self.log(f"\nOverall: {passed}/{total} edge case tests passed")
        
        if passed == total:
            self.log("🎉 ALL EDGE CASE TESTS PASSED! Backend validation is robust.")
        else:
            self.log(f"⚠️  {total - passed} edge case tests failed.")
        
        return passed == total

def main():
    tester = EdgeCaseTester()
    tester.run_edge_case_tests()

if __name__ == "__main__":
    main()