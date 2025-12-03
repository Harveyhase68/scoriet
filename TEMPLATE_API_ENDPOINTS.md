# Template Management API Endpoints

Diese API-Endpoints erweitern die Scoriet CLI API um vollständiges Template-Management.

**Base URL:** `http://10.0.0.8:8000/cli`

**Authentication:** Alle Endpoints benötigen einen Bearer Token (Personal Access Token)

---

## Template CRUD Operations

### 1. Create Template

**POST** `/templates`

Erstellt ein neues Template.

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "test_template",
  "description": "My test template for Laravel",
  "language": "php",
  "category": "Backend",
  "visibility": "private"
}
```

**Parameters:**
- `name` (required) - Template name (lowercase, numbers, underscores only)
- `description` (optional) - Template description
- `language` (required) - Programming language (php, javascript, python, etc.)
- `category` (optional) - Template category - VARCHAR, beliebiger String erlaubt (default: "Web")
  - **Proposal:** Web, Mobile, API, Desktop, Database, E-Commerce, CMS, Dashboard, Fullstack, Backend, Frontend, DevOps, Testing, Documentation, Authentication, Payment, Admin Panel, Landing Page, Portfolio, Blog
  - **Custom:** Any category is possible (z.B. "React Components", "Laravel Helpers")
- `visibility` (optional) - "public" or "private" (default: "private")

**Success Response (201):**
```json
{
  "success": true,
  "message": "Template created successfully",
  "template": {
    "id": 15,
    "name": "test_template",
    "description": "My test template for Laravel",
    "language": "php",
    "category": "backend",
    "visibility": "private",
    "created_at": "2025-11-22T12:00:00+00:00"
  }
}
```

**Error Response (409) - Duplicate:**
```json
{
  "success": false,
  "message": "A template with this name already exists",
  "error": "Template name must be unique"
}
```

---

### 2. Delete Template

**DELETE** `/templates/{id}`

Permanently deletes a template (HARD DELETE).

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**URL Parameters:**
- `id` (required) - Template ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

**Error Response (403) - No Permission:**
```json
{
  "success": false,
  "message": "Access denied - only template creator can delete"
}
```

**Error Response (403) - System Template:**
```json
{
  "success": false,
  "message": "System templates cannot be deleted"
}
```

---

## Template File Management

### 3. List Template Files

**GET** `/templates/{templateId}/files`

Lists all files of a template.

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**URL Parameters:**
- `templateId` (required) - Template ID

**Success Response (200):**
```json
{
  "success": true,
  "template": {
    "id": 15,
    "name": "test_template"
  },
  "files": [
    {
      "id": 42,
      "file_name": "Controller.php",
      "file_path": "app/Http/Controllers/",
      "output_path": "app/Http/Controllers/",
      "file_type": "php",
      "content_type": "template",
      "content_size": 1234,
      "file_order": 1,
      "created_at": "2025-11-22T12:00:00+00:00"
    }
  ],
  "total": 1
}
```

---

### 4. Add File to Template

**POST** `/templates/{templateId}/files`

Adds a file to a template.

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**URL Parameters:**
- `templateId` (required) - Template ID

**Body (JSON):**
```json
{
  "file_name": "UserController.php",
  "file_path": "app/Http/Controllers/",
  "output_path": "app/Http/Controllers/",
  "file_content": "<?php\n\nnamespace App\\Http\\Controllers;\n\nclass UserController extends Controller\n{\n    // Your code here\n}\n",
  "file_type": "php",
  "content_type": "template"
}
```

**Parameters:**
- `file_name` (required) - Name der Datei
- `file_path` (optional) - Quell-Pfad im Template
- `output_path` (optional) - Ziel-Pfad beim Generieren (default: file_path)
- `file_content` (required) - Datei-Inhalt (Template-Code)
- `file_type` (optional) - Dateityp (wird automatisch erkannt wenn nicht angegeben)
- `content_type` (optional) - Content-Typ (default: "template")

**Success Response (201):**
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

**Error Response (403) - No Permission:**
```json
{
  "success": false,
  "message": "Access denied - only template creator can add files"
}
```

---

### 5. Delete File from Template

**DELETE** `/templates/{templateId}/files/{fileId}`

Permanently deletes (HARD DELETE) a file from a template.

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**URL Parameters:**
- `templateId` (required) - Template ID
- `fileId` (required) - File ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

**Error Response (404) - File Not Found:**
```json
{
  "success": false,
  "message": "File not found in this template"
}
```

**Error Response (403) - No Permission:**
```json
{
  "success": false,
  "message": "Access denied - only template creator can delete files"
}
```

---

## Beispiel-Workflow: Template erstellen und mit Dateien füllen

### Schritt 1: Template erstellen
```bash
POST http://10.0.0.8:8000/cli/templates
{
  "name": "laravel_crud",
  "description": "Laravel CRUD Controller Template",
  "language": "php",
  "category": "backend"
}
# Response: template.id = 15
```

### Schritt 2: Controller-Datei hinzufügen
```bash
POST http://10.0.0.8:8000/cli/templates/15/files
{
  "file_name": "CrudController.php",
  "file_path": "app/Http/Controllers/",
  "file_content": "<?php\n\nnamespace App\\Http\\Controllers;\n\nclass {ControllerName} extends Controller\n{\n    public function index() {\n        // List all\n    }\n}\n"
}
# Response: file.id = 42
```

### Schritt 3: Model-Datei hinzufügen
```bash
POST http://10.0.0.8:8000/cli/templates/15/files
{
  "file_name": "Model.php",
  "file_path": "app/Models/",
  "file_content": "<?php\n\nnamespace App\\Models;\n\nuse Illuminate\\Database\\Eloquent\\Model;\n\nclass {ModelName} extends Model\n{\n    protected $fillable = [];\n}\n"
}
# Response: file.id = 43
```

### Schritt 4: Template-Dateien auflisten
```bash
GET http://10.0.0.8:8000/cli/templates/15/files
# Response: 2 files (Controller + Model)
```

### Schritt 5: Fehlerhafte Datei löschen
```bash
DELETE http://10.0.0.8:8000/cli/templates/15/files/42
# Response: success
```

### Schritt 6: Template löschen (wenn nicht mehr benötigt)
```bash
DELETE http://10.0.0.8:8000/cli/templates/15
# Response: success (inkl. aller Dateien durch CASCADE)
```

---

## Validierungs-Regeln

### Template Name
- Nur lowercase letters, numbers und underscores
- Regex: `/^[a-z0-9_]+$/`
- Beispiel: `laravel_crud`, `react_component`, `api_endpoint`

### Template Visibility
- `public` - Öffentlich sichtbar für alle
- `private` - Nur für Creator sichtbar

### Supported Languages
Beliebige Strings erlaubt, Empfehlung:
- `php`
- `javascript` / `typescript`
- `python`
- `java`
- `csharp`
- `go`
- `rust`

### File Types (Auto-Detection)
Basierend auf Extension:
- `.php` → `php`
- `.js` → `javascript`
- `.ts`, `.tsx` → `typescript`
- `.py` → `python`
- `.java` → `java`
- `.cs` → `csharp`
- `.go` → `go`
- `.rs` → `rust`
- `.html` → `html`
- `.css`, `.scss` → `css`/`scss`
- `.json` → `json`
- `.sql` → `sql`

---

## Berechtigungen

### Template Create
- ✅ Jeder authentifizierte User

### Template Delete
- ✅ Template Creator (owner)
- ❌ System Templates (is_system_template = true)

### Template File Add/Delete
- ✅ Template Creator (owner)
- ❌ System Templates (is_system_template = true)

### Template View/List
- ✅ Template Creator
- ✅ Public Templates (visibility = public)
- ✅ System Templates (is_system_template = true)

---

## Testing in Postman

### 1. Environment Setup
```
base_url: http://10.0.0.8:8000/cli
token: [Your Personal Access Token]
```

### 2. Collection Organization
```
Scoriet CLI
├── Auth
│   └── Authorize
├── Templates
│   ├── Create Template
│   ├── List Templates
│   ├── Show Template
│   └── Delete Template
└── Template Files
    ├── List Files
    ├── Add File
    └── Delete File
```

### 3. Test sequence
1. **Auth/Authorize** → Receive tokens
2. **Templates/Create** → Create a template (id remember)
3. **Template Files/Add** → Add first file
4. **Template Files/Add** → Add second file
5. **Template Files/List** → List files
6. **Template Files/Delete** → Delete a file
7. **Templates/Delete** → Delete template

---

## CLI API Dokumentation Update

These endpoints complement the existing CLI API:
- [CLI_API_DOCUMENTATION.md](CLI_API_DOCUMENTATION.md) - Main documentation

**Neue Endpoints:**
- ✅ `POST /templates` - Template create
- ✅ `DELETE /templates/{id}` - Template delete
- ✅ `GET /templates/{templateId}/files` - File list
- ✅ `POST /templates/{templateId}/files` - File add
- ✅ `DELETE /templates/{templateId}/files/{fileId}` - File delete

**Bestehende Endpoints:**
- ✅ `GET /templates` - Template list (already available)
- ✅ `GET /templates/{id}` - Template show (already available)
- ✅ `POST /templates/{id}/link` - Template link (already available)
- ✅ `POST /templates/{id}/unlink` - Template unlink (already available)
