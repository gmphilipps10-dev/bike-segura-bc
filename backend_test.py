#!/usr/bin/env python3
"""
BIKE SEGURA BC - Backend API Testing
Tests all backend endpoints for authentication, bike CRUD, and theft alerts
"""

import requests
import json
import base64
from datetime import datetime
import sys

# Backend URL from frontend .env
BASE_URL = "https://bike-tracking-alert.preview.emergentagent.com/api"

class BikeSeguraAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.auth_token = None
        self.test_user_id = None
        self.test_bike_id = None
        self.test_results = {
            "auth_register": False,
            "auth_login": False,
            "auth_me": False,
            "bike_create": False,
            "bike_list": False,
            "bike_get": False,
            "bike_update": False,
            "bike_delete": False,
            "alert_furto": False
        }
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def generate_test_photo_base64(self):
        """Generate a simple base64 encoded test image"""
        # Simple 1x1 pixel PNG in base64
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    
    def test_api_health(self):
        """Test if API is responding"""
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                self.log("✅ API Health Check: PASSED")
                return True
            else:
                self.log(f"❌ API Health Check: FAILED - Status {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ API Health Check: FAILED - {str(e)}")
            return False
    
    def test_auth_register(self):
        """Test user registration"""
        try:
            test_user = {
                "nome_completo": "João Silva Santos",
                "cpf": "12345678901",
                "data_nascimento": "15/03/1990",
                "telefone": "(11) 99999-8888",
                "email": "joao.silva@bikesegura.com",
                "senha": "MinhaSenh@123"
            }
            
            response = self.session.post(
                f"{self.base_url}/auth/register",
                json=test_user,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.auth_token = data["access_token"]
                    self.test_user_id = data["user"]["id"]
                    self.log("✅ Auth Register: PASSED")
                    self.test_results["auth_register"] = True
                    return True
                else:
                    self.log(f"❌ Auth Register: FAILED - Missing token or user in response")
                    return False
            else:
                self.log(f"❌ Auth Register: FAILED - Status {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Auth Register: FAILED - {str(e)}")
            return False
    
    def test_auth_login(self):
        """Test user login"""
        try:
            login_data = {
                "email": "joao.silva@bikesegura.com",
                "senha": "MinhaSenh@123"
            }
            
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    # Update token from login
                    self.auth_token = data["access_token"]
                    self.log("✅ Auth Login: PASSED")
                    self.test_results["auth_login"] = True
                    return True
                else:
                    self.log(f"❌ Auth Login: FAILED - Missing token or user in response")
                    return False
            else:
                self.log(f"❌ Auth Login: FAILED - Status {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Auth Login: FAILED - {str(e)}")
            return False
    
    def test_auth_me(self):
        """Test get current user"""
        try:
            if not self.auth_token:
                self.log("❌ Auth Me: FAILED - No auth token available")
                return False
                
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(f"{self.base_url}/auth/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "nome_completo" in data and "email" in data:
                    self.log("✅ Auth Me: PASSED")
                    self.test_results["auth_me"] = True
                    return True
                else:
                    self.log(f"❌ Auth Me: FAILED - Missing user data in response")
                    return False
            else:
                self.log(f"❌ Auth Me: FAILED - Status {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Auth Me: FAILED - {str(e)}")
            return False
    
    def test_bike_create(self):
        """Test bike creation with 3 photos"""
        try:
            if not self.auth_token:
                self.log("❌ Bike Create: FAILED - No auth token available")
                return False
                
            # Create bike with 3 photos (minimum required)
            bike_data = {
                "marca": "Trek",
                "modelo": "Mountain Bike X1",
                "cor": "Azul",
                "numero_serie": "TRK123456789",
                "fotos": [
                    self.generate_test_photo_base64(),
                    self.generate_test_photo_base64(),
                    self.generate_test_photo_base64()
                ],
                "tipo": "Mountain Bike",
                "valor_estimado": 2500.00,
                "caracteristicas": "Bike de alta performance para trilhas",
                "link_rastreamento": "https://tracker.example.com/TRK123456789"
            }
            
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.post(
                f"{self.base_url}/bikes",
                json=bike_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["status"] == "Ativa":
                    self.test_bike_id = data["id"]
                    self.log("✅ Bike Create: PASSED")
                    self.test_results["bike_create"] = True
                    return True
                else:
                    self.log(f"❌ Bike Create: FAILED - Missing id or incorrect status in response")
                    return False
            else:
                self.log(f"❌ Bike Create: FAILED - Status {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Bike Create: FAILED - {str(e)}")
            return False
    
    def test_bike_list(self):
        """Test listing user's bikes"""
        try:
            if not self.auth_token:
                self.log("❌ Bike List: FAILED - No auth token available")
                return False
                
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(f"{self.base_url}/bikes", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log(f"✅ Bike List: PASSED - Found {len(data)} bikes")
                    self.test_results["bike_list"] = True
                    return True
                else:
                    self.log(f"❌ Bike List: FAILED - Expected list with bikes, got: {data}")
                    return False
            else:
                self.log(f"❌ Bike List: FAILED - Status {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Bike List: FAILED - {str(e)}")
            return False
    
    def test_bike_get(self):
        """Test getting specific bike"""
        try:
            if not self.auth_token or not self.test_bike_id:
                self.log("❌ Bike Get: FAILED - No auth token or bike ID available")
                return False
                
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(f"{self.base_url}/bikes/{self.test_bike_id}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["id"] == self.test_bike_id:
                    self.log("✅ Bike Get: PASSED")
                    self.test_results["bike_get"] = True
                    return True
                else:
                    self.log(f"❌ Bike Get: FAILED - Bike ID mismatch or missing data")
                    return False
            else:
                self.log(f"❌ Bike Get: FAILED - Status {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Bike Get: FAILED - {str(e)}")
            return False
    
    def test_bike_update(self):
        """Test updating bike"""
        try:
            if not self.auth_token or not self.test_bike_id:
                self.log("❌ Bike Update: FAILED - No auth token or bike ID available")
                return False
                
            update_data = {
                "cor": "Verde",
                "valor_estimado": 2800.00
            }
            
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.put(
                f"{self.base_url}/bikes/{self.test_bike_id}",
                json=update_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if data["cor"] == "Verde" and data["valor_estimado"] == 2800.00:
                    self.log("✅ Bike Update: PASSED")
                    self.test_results["bike_update"] = True
                    return True
                else:
                    self.log(f"❌ Bike Update: FAILED - Update not reflected in response")
                    return False
            else:
                self.log(f"❌ Bike Update: FAILED - Status {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Bike Update: FAILED - {str(e)}")
            return False
    
    def test_alert_furto(self):
        """Test theft alert functionality"""
        try:
            if not self.auth_token or not self.test_bike_id:
                self.log("❌ Alert Furto: FAILED - No auth token or bike ID available")
                return False
                
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.post(
                f"{self.base_url}/bikes/{self.test_bike_id}/alert-furto",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if data["status"] == "Furtada" and "data_furto" in data and data["data_furto"]:
                    self.log("✅ Alert Furto: PASSED - Status changed to 'Furtada' and data_furto recorded")
                    self.test_results["alert_furto"] = True
                    return True
                else:
                    self.log(f"❌ Alert Furto: FAILED - Status not changed or data_furto missing")
                    return False
            else:
                self.log(f"❌ Alert Furto: FAILED - Status {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Alert Furto: FAILED - {str(e)}")
            return False
    
    def test_bike_delete(self):
        """Test bike deletion"""
        try:
            if not self.auth_token or not self.test_bike_id:
                self.log("❌ Bike Delete: FAILED - No auth token or bike ID available")
                return False
                
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.delete(
                f"{self.base_url}/bikes/{self.test_bike_id}",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "deletada" in data["message"]:
                    self.log("✅ Bike Delete: PASSED")
                    self.test_results["bike_delete"] = True
                    return True
                else:
                    self.log(f"❌ Bike Delete: FAILED - Unexpected response format")
                    return False
            else:
                self.log(f"❌ Bike Delete: FAILED - Status {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Bike Delete: FAILED - {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests in sequence"""
        self.log("🚀 Starting BIKE SEGURA BC Backend API Tests")
        self.log(f"🌐 Testing against: {self.base_url}")
        
        # Test API health first
        if not self.test_api_health():
            self.log("❌ API is not responding. Aborting tests.")
            return False
        
        # Authentication tests
        self.log("\n📋 Testing Authentication...")
        self.test_auth_register()
        self.test_auth_login()
        self.test_auth_me()
        
        # Bike CRUD tests
        self.log("\n🚲 Testing Bike CRUD Operations...")
        self.test_bike_create()
        self.test_bike_list()
        self.test_bike_get()
        self.test_bike_update()
        
        # Theft alert test
        self.log("\n🚨 Testing Theft Alert...")
        self.test_alert_furto()
        
        # Cleanup - delete test bike
        self.log("\n🧹 Cleanup...")
        self.test_bike_delete()
        
        # Summary
        self.print_summary()
        
        return all(self.test_results.values())
    
    def print_summary(self):
        """Print test results summary"""
        self.log("\n" + "="*60)
        self.log("📊 TEST RESULTS SUMMARY")
        self.log("="*60)
        
        passed = sum(1 for result in self.test_results.values() if result)
        total = len(self.test_results)
        
        for test_name, result in self.test_results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            self.log(f"{test_name.replace('_', ' ').title()}: {status}")
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 ALL TESTS PASSED! Backend is working correctly.")
        else:
            self.log(f"⚠️  {total - passed} tests failed. Backend needs attention.")

def main():
    """Main test execution"""
    tester = BikeSeguraAPITester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()