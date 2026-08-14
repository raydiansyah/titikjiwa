# Auth Testing Playbook — Sintesis

## Step 1: MongoDB Verification
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
db.users.findOne({role: "admin"}, {password_hash: 1})
```
Verify: bcrypt hash starts with `$2b$`, indexes exist on users.email (unique), login_attempts.identifier, password_reset_tokens.expires_at (TTL).

## Step 2: API Testing (use external URL from frontend/.env)
```
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -c cookies.txt -X POST $API_URL/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@sintesis.id","password":"SintesisAdmin123!"}'
cat cookies.txt
curl -b cookies.txt $API_URL/api/auth/me
curl -b cookies.txt -X POST $API_URL/api/auth/refresh
curl -b cookies.txt -X POST $API_URL/api/auth/logout
```
Login should return the user object and set `access_token` + `refresh_token` httpOnly cookies. `/me` should return the same user using those cookies.

## Step 3: Brute force
5 failed logins on the same email should return 429 with a 15-minute lockout message.
