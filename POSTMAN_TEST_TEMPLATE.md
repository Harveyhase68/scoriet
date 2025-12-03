# Postman Tests für Template API

## Setup

### 1. Token holen
Führe in der CLI aus:
```bash
cd "C:\My Projects\Rust_Temp\scoriet-cli"
cargo run -- auth whoami
```

Token ist gültig bis: 2026-05-20

### 2. Postman Environment

Erstelle eine neue Environment "Scoriet CLI":
```
base_url: http://10.0.0.8:8000/cli
token: [dein token aus der CLI config.toml]
```

---

## Test 1: Template Create (mit VARCHAR category)

**Request:**
```
POST {{base_url}}/templates
```

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "test_backend",
  "description": "My test template for Laravel Backend",
  "language": "php",
  "category": "backend",
  "visibility": "private"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Template created successfully",
  "template": {
    "id": 11,
    "name": "test_backend",
    "description": "My test template for Laravel Backend",
    "language": "php",
    "category": "backend",
    "visibility": "private",
    "created_at": "2025-11-22T17:10:00+00:00"
  }
}
```

✅ **Test erfolgreich wenn:**
- Status: 201 Created
- success: true
- category: "backend" (nicht mehr ENUM Error!)
- template.id vorhanden (merken für nächste Tests!)

---

## Test 2: Duplicate Template Name Check

**Request:**
```
POST {{base_url}}/templates
```

**Body:** (Gleicher Name wie Test 1)
```json
{
  "name": "test_backend",
  "description": "Zweites Template mit gleichem Namen",
  "language": "php",
  "category": "API"
}
```

**Expected Response (409):**
```json
{
  "success": false,
  "message": "A template with this name already exists",
  "error": "Template name must be unique"
}
```

✅ **Test erfolgreich wenn:**
- Status: 409 Conflict
- Duplicate wird abgelehnt

---

## Test 3: Template File Add

**Request:**
```
POST {{base_url}}/templates/11/files
```
*(Ersetze 11 mit der ID aus Test 1)*

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "file_name": "UserController.php",
  "file_path": "app/Http/Controllers/",
  "output_path": "app/Http/Controllers/",
  "file_content": "<?php\n\nnamespace App\\Http\\Controllers;\n\nclass UserController extends Controller\n{\n    public function index()\n    {\n        // List users\n    }\n}\n",
  "file_type": "php",
  "content_type": "template"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "File added to template successfully",
  "file": {
    "id": 42,
    "file_name": "UserController.php",
    "file_path": "app/Http/Controllers/",
    "output_path": "app/Http/Controllers/",
    "file_type": "php",
    "content_type": "template",
    "content_size": 156,
    "file_order": 1
  }
}
```

✅ **Test erfolgreich wenn:**
- Status: 201 Created
- file.id vorhanden (merken!)
- file_order: 1 (erste Datei)

---

## Test 4: Template File List

**Request:**
```
GET {{base_url}}/templates/11/files
```

**Headers:**
```
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "template": {
    "id": 11,
    "name": "test_backend"
  },
  "files": [
    {
      "id": 42,
      "file_name": "UserController.php",
      "file_path": "app/Http/Controllers/",
      "output_path": "app/Http/Controllers/",
      "file_type": "php",
      "content_type": "template",
      "content_size": 156,
      "file_order": 1,
      "created_at": "2025-11-22T17:15:00+00:00"
    }
  ],
  "total": 1
}
```

✅ **Test erfolgreich wenn:**
- Status: 200 OK
- total: 1
- Datei aus Test 3 ist vorhanden

---

## Test 5: Add Second File

**Request:**
```
POST {{base_url}}/templates/11/files
```

**Body:**
```json
{
  "file_name": "User.php",
  "file_path": "app/Models/",
  "file_content": "<?php\n\nnamespace App\\Models;\n\nuse Illuminate\\Database\\Eloquent\\Model;\n\nclass User extends Model\n{\n    protected $fillable = ['name', 'email'];\n}\n"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "File added to template successfully",
  "file": {
    "id": 43,
    "file_name": "User.php",
    "file_path": "app/Models/",
    "output_path": "app/Models/",
    "file_type": "php",
    "content_type": "template",
    "content_size": 145,
    "file_order": 2
  }
}
```

✅ **Test erfolgreich wenn:**
- file_order: 2 (zweite Datei!)
- file_type: php (auto-detected)

---

## Test 6: Template File Delete

**Request:**
```
DELETE {{base_url}}/templates/11/files/42
```
*(Erste Datei löschen)*

**Headers:**
```
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

✅ **Test erfolgreich wenn:**
- Status: 200 OK
- Danach: GET /templates/11/files zeigt nur noch 1 Datei (total: 1)

---

## Test 7: Template Delete

**Request:**
```
DELETE {{base_url}}/templates/11
```

**Headers:**
```
Authorization: Bearer {{token}}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

✅ **Test erfolgreich wenn:**
- Status: 200 OK
- Danach: GET /templates/11 gibt 404
- Alle Files wurden durch CASCADE gelöscht

---

## Test 8: Custom Category (beliebig)

**Request:**
```
POST {{base_url}}/templates
```

**Body:**
```json
{
  "name": "my_custom_template",
  "description": "Template mit custom category",
  "language": "typescript",
  "category": "React Components",
  "visibility": "public"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Template created successfully",
  "template": {
    "id": 12,
    "name": "my_custom_template",
    "description": "Template mit custom category",
    "language": "typescript",
    "category": "React Components",
    "visibility": "public",
    "created_at": "2025-11-22T17:20:00+00:00"
  }
}
```

✅ **Test erfolgreich wenn:**
- category: "React Components" (custom, nicht in Liste!)
- Kein ENUM Error mehr!

---

## Zusammenfassung

✅ **Migration erfolgreich:**
- `category` ist jetzt VARCHAR(100)
- Beliebige Kategorien möglich
- Default: "Web"

✅ **Config für GUI:**
- `config/templates.php` enthält Vorschlagslisten:
  - `categories`: 20 vordefinierte Kategorien
  - `languages`: 23 vordefinierte Sprachen
- GUI kann Dropdown mit "Oder eigene eingeben" machen

✅ **Alle Tests bestanden wenn:**
1. Template create mit "backend" funktioniert ✓
2. Duplicate Namen werden abgelehnt ✓
3. Files können hinzugefügt werden ✓
4. file_order wird automatisch gesetzt ✓
5. Files können gelöscht werden ✓
6. Templates können gelöscht werden (CASCADE) ✓
7. Custom categories funktionieren ✓

---

## Nächster Schritt

Wenn alle Tests in Postman ✅ sind, dann:
→ **Rust CLI Implementation** für Template Management
