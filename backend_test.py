#!/usr/bin/env python3
"""
BIKE SEGURA BC Backend API Testing
Testing the refactored Bike CRUD with new photo dictionary schema
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend .env
BASE_URL = "https://bike-tracking-alert.preview.emergentagent.com/api"

# Test credentials from test_credentials.md
TEST_USER = {
    "email": "joao.silva@bikesegura.com",
    "senha": "MinhaSenh@123"
}

class BikeAPITester:
    def __init__(self):
        self.token = None
        self.user_id = None
        self.created_bikes = []
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def test_login(self):
        """Test user login and get JWT token"""
        self.log("🔐 Testing user login...")
        
        response = requests.post(f"{BASE_URL}/auth/login", json=TEST_USER)
        
        if response.status_code == 200:
            data = response.json()
            self.token = data["access_token"]
            self.user_id = data["user"]["id"]
            self.log(f"✅ Login successful - User ID: {self.user_id}")
            return True
        else:
            self.log(f"❌ Login failed: {response.status_code} - {response.text}")
            return False
    
    def get_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.token}"}
    
    def test_create_bike_with_full_photos_dict(self):
        """Test creating bike with complete fotos dictionary"""
        self.log("📸 Testing bike creation with full fotos dict...")
        
        bike_data = {
            "marca": "Trek",
            "modelo": "FX 3 Disc",
            "cor": "Azul",
            "numero_serie": "TRK123456789",
            "fotos": {
                "frente": "data:image/jpeg;base64,FAKE_FRENTE_PHOTO_DATA",
                "tras": "data:image/jpeg;base64,FAKE_TRAS_PHOTO_DATA", 
                "lateral_direita": "data:image/jpeg;base64,FAKE_LATERAL_DIR_DATA",
                "lateral_esquerda": "data:image/jpeg;base64,FAKE_LATERAL_ESQ_DATA",
                "numero_quadro": "data:image/jpeg;base64,FAKE_NUMERO_QUADRO_DATA"
            },
            "tipo": "Urbana",
            "caracteristicas": "Bike urbana com freios a disco",
            "link_rastreamento": "https://tracker.example.com/TRK123456789",
            "nota_fiscal": "data:application/pdf;base64,FAKE_NOTA_FISCAL_PDF_DATA"
        }
        
        response = requests.post(f"{BASE_URL}/bikes", json=bike_data, headers=self.get_headers())
        
        if response.status_code == 200:
            bike = response.json()
            self.created_bikes.append(bike["id"])
            self.log(f"✅ Bike created successfully with full fotos dict - ID: {bike['id']}")
            
            # Verify response structure
            if isinstance(bike.get("fotos"), dict):
                self.log("✅ Response fotos is dict type")
                required_keys = ["frente", "tras", "lateral_direita", "lateral_esquerda", "numero_quadro"]
                if all(key in bike["fotos"] for key in required_keys):
                    self.log("✅ All required photo keys present in response")
                else:
                    self.log("❌ Missing required photo keys in response")
            else:
                self.log("❌ Response fotos is not dict type")
                
            if bike.get("nota_fiscal"):
                self.log("✅ nota_fiscal field present in response")
            else:
                self.log("❌ nota_fiscal field missing in response")
                
            return True
        else:
            self.log(f"❌ Bike creation failed: {response.status_code} - {response.text}")
            return False
    
    def test_create_bike_with_empty_photos_dict(self):
        """Test creating bike with empty fotos dictionary"""
        self.log("📷 Testing bike creation with empty fotos dict...")
        
        bike_data = {
            "marca": "Caloi",
            "modelo": "Elite 30",
            "cor": "Vermelha",
            "numero_serie": "CAL987654321",
            "fotos": {},  # Empty dict
            "tipo": "Mountain Bike",
            "caracteristicas": "MTB para trilhas"
        }
        
        response = requests.post(f"{BASE_URL}/bikes", json=bike_data, headers=self.get_headers())
        
        if response.status_code == 200:
            bike = response.json()
            self.created_bikes.append(bike["id"])
            self.log(f"✅ Bike created successfully with empty fotos dict - ID: {bike['id']}")
            
            # Verify response structure
            if isinstance(bike.get("fotos"), dict) and len(bike["fotos"]) == 0:
                self.log("✅ Response fotos is empty dict")
            else:
                self.log("❌ Response fotos is not empty dict")
                
            return True
        else:
            self.log(f"❌ Bike creation failed: {response.status_code} - {response.text}")
            return False
    
    def test_create_bike_with_partial_photos_dict(self):
        """Test creating bike with partial fotos dictionary (should fail)"""
        self.log("🚫 Testing bike creation with partial fotos dict (should fail)...")
        
        bike_data = {
            "marca": "Specialized",
            "modelo": "Rockhopper",
            "cor": "Preta",
            "numero_serie": "SPZ555666777",
            "fotos": {
                "frente": "data:image/jpeg;base64,FAKE_FRENTE_ONLY",
                "tras": "data:image/jpeg;base64,FAKE_TRAS_ONLY"
                # Missing: lateral_direita, lateral_esquerda, numero_quadro
            },
            "tipo": "Mountain Bike"
        }
        
        response = requests.post(f"{BASE_URL}/bikes", json=bike_data, headers=self.get_headers())
        
        if response.status_code == 400:
            error_detail = response.json().get("detail", "")
            if "Fotos obrigatórias faltando" in error_detail:
                self.log("✅ Correctly rejected partial fotos dict with proper error message")
                return True
            else:
                self.log(f"❌ Wrong error message: {error_detail}")
                return False
        else:
            self.log(f"❌ Should have failed with 400, got: {response.status_code} - {response.text}")
            return False
    
    def test_get_all_bikes(self):
        """Test GET /api/bikes - verify fotos comes back as dict"""
        self.log("📋 Testing GET all bikes...")
        
        response = requests.get(f"{BASE_URL}/bikes", headers=self.get_headers())
        
        if response.status_code == 200:
            bikes = response.json()
            self.log(f"✅ Retrieved {len(bikes)} bikes")
            
            # Check each bike's fotos structure
            all_dict = True
            for bike in bikes:
                if not isinstance(bike.get("fotos"), dict):
                    self.log(f"❌ Bike {bike.get('id')} has fotos as {type(bike.get('fotos'))}, not dict")
                    all_dict = False
                    
            if all_dict:
                self.log("✅ All bikes have fotos as dict type")
            
            # Check for nota_fiscal field
            has_nota_fiscal = all("nota_fiscal" in bike for bike in bikes)
            if has_nota_fiscal:
                self.log("✅ All bikes have nota_fiscal field")
            else:
                self.log("❌ Some bikes missing nota_fiscal field")
                
            return True
        else:
            self.log(f"❌ GET bikes failed: {response.status_code} - {response.text}")
            return False
    
    def test_get_single_bike(self):
        """Test GET /api/bikes/{id} - verify fotos comes back as dict"""
        if not self.created_bikes:
            self.log("⚠️ No bikes created to test single bike GET")
            return True
            
        bike_id = self.created_bikes[0]
        self.log(f"🔍 Testing GET single bike: {bike_id}")
        
        response = requests.get(f"{BASE_URL}/bikes/{bike_id}", headers=self.get_headers())
        
        if response.status_code == 200:
            bike = response.json()
            self.log(f"✅ Retrieved bike: {bike.get('marca')} {bike.get('modelo')}")
            
            # Check fotos structure
            if isinstance(bike.get("fotos"), dict):
                self.log("✅ Single bike fotos is dict type")
            else:
                self.log(f"❌ Single bike fotos is {type(bike.get('fotos'))}, not dict")
                
            # Check nota_fiscal field
            if "nota_fiscal" in bike:
                self.log("✅ Single bike has nota_fiscal field")
            else:
                self.log("❌ Single bike missing nota_fiscal field")
                
            return True
        else:
            self.log(f"❌ GET single bike failed: {response.status_code} - {response.text}")
            return False
    
    def test_valor_estimado_removed(self):
        """Test that valor_estimado is not accepted in BikeCreate"""
        self.log("💰 Testing valor_estimado removal from BikeCreate...")
        
        bike_data = {
            "marca": "Giant",
            "modelo": "Escape 3",
            "cor": "Verde",
            "numero_serie": "GNT111222333",
            "fotos": {},
            "tipo": "Híbrida",
            "valor_estimado": 1500.00  # This should be ignored/rejected
        }
        
        response = requests.post(f"{BASE_URL}/bikes", json=bike_data, headers=self.get_headers())
        
        if response.status_code == 200:
            bike = response.json()
            self.created_bikes.append(bike["id"])
            
            # Check if valor_estimado is in response (it shouldn't be)
            if "valor_estimado" not in bike:
                self.log("✅ valor_estimado correctly removed from BikeCreate")
                return True
            else:
                self.log("❌ valor_estimado still present in response")
                return False
        else:
            self.log(f"❌ Bike creation failed: {response.status_code} - {response.text}")
            return False
    
    def cleanup_created_bikes(self):
        """Clean up bikes created during testing"""
        self.log("🧹 Cleaning up created bikes...")
        
        for bike_id in self.created_bikes:
            response = requests.delete(f"{BASE_URL}/bikes/{bike_id}", headers=self.get_headers())
            if response.status_code == 200:
                self.log(f"✅ Deleted bike: {bike_id}")
            else:
                self.log(f"❌ Failed to delete bike {bike_id}: {response.status_code}")
    
    def run_all_tests(self):
        """Run all bike schema tests"""
        self.log("🚀 Starting BIKE SEGURA BC Backend API Tests")
        self.log(f"🌐 Backend URL: {BASE_URL}")
        
        tests = [
            ("Login", self.test_login),
            ("Create bike with full fotos dict", self.test_create_bike_with_full_photos_dict),
            ("Create bike with empty fotos dict", self.test_create_bike_with_empty_photos_dict),
            ("Create bike with partial fotos dict (should fail)", self.test_create_bike_with_partial_photos_dict),
            ("Test valor_estimado removal", self.test_valor_estimado_removed),
            ("GET all bikes", self.test_get_all_bikes),
            ("GET single bike", self.test_get_single_bike),
        ]
        
        results = []
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                results.append((test_name, result))
            except Exception as e:
                self.log(f"❌ {test_name} failed with exception: {str(e)}")
                results.append((test_name, False))
        
        # Cleanup
        self.cleanup_created_bikes()
        
        # Summary
        self.log("\n" + "="*60)
        self.log("📊 TEST SUMMARY")
        self.log("="*60)
        
        passed = 0
        failed = 0
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status} - {test_name}")
            if result:
                passed += 1
            else:
                failed += 1
        
        self.log(f"\n📈 Results: {passed} passed, {failed} failed")
        
        if failed == 0:
            self.log("🎉 All tests passed! New bike schema is working correctly.")
            return True
        else:
            self.log("⚠️ Some tests failed. Check the logs above for details.")
            return False

if __name__ == "__main__":
    tester = BikeAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)