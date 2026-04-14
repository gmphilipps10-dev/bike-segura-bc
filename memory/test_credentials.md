# Test Credentials
# Agent writes here when creating/modifying auth credentials (admin accounts, test users).
# Testing agent reads this before auth tests. Fork/continuation agents read on startup.

## BIKE SEGURA BC Test Users

### Test User 1 (Created during backend testing)
- **Nome:** João Silva Santos
- **Email:** joao.silva@bikesegura.com
- **Senha:** MinhaSenh@123
- **CPF:** 12345678901
- **Data Nascimento:** 15/03/1990
- **Telefone:** (11) 99999-8888

### Test User 2 (Created during edge case testing)
- **Nome:** Maria Santos
- **Email:** maria.santos@bikesegura.com
- **Senha:** MinhaSenh@456
- **CPF:** 98765432100
- **Data Nascimento:** 20/05/1985
- **Telefone:** (11) 88888-7777

## Backend API Endpoints Tested
- ✅ POST /api/auth/register - User registration
- ✅ POST /api/auth/login - User login
- ✅ GET /api/auth/me - Get current user (requires token)
- ✅ POST /api/bikes - Create bike (requires token, minimum 3 photos)
- ✅ GET /api/bikes - List user's bikes (requires token)
- ✅ GET /api/bikes/{id} - Get specific bike (requires token)
- ✅ PUT /api/bikes/{id} - Update bike (requires token)
- ✅ DELETE /api/bikes/{id} - Delete bike (requires token)
- ✅ POST /api/bikes/{id}/alert-furto - Mark bike as stolen (requires token)
- ✅ PUT /api/admin/users/{user_id}/pagamento - Admin payment activation with custom valor
- ✅ GET /api/admin/users - Admin users list
- ✅ GET /api/admin/users/{user_id}/historico-pagamentos - Admin payment history
- ✅ PUT /api/admin/users/{user_id}/cancelar-pagamento - Admin payment cancellation
- ✅ GET /api/admin/dashboard - Admin dashboard with receita_anual_total

## Admin Test User (For Admin Features Testing)
- **Nome:** Admin Test User
- **Email:** admin.test@bikesegura.com
- **Senha:** AdminTest@123
- **CPF:** 11111111111
- **Data Nascimento:** 01/01/1980
- **Telefone:** (11) 99999-1111
- **Note:** This admin user was created for testing admin payment features since gmphilipps10@gmail.com already existed with unknown password
