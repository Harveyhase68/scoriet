SCORIET DOCUMENTATION SCREENSHOTS
==================================

Place the following screenshot files in this directory.
All files should be PNG format.

Required Screenshots:
---------------------

1. landing-page.png
   - The Scoriet landing page (http://10.0.0.8:8000/) in ENGLISH
   - Shows: Hero section, feature cards, navigation bar with EN/Login/Register buttons
   - Used in: intro.md

2. login-dialog.png
   - The login dialog overlay on the landing page
   - Shows: Email/password fields, Login button, Register link, Forgot password
   - Used in: architecture/authentication.md

3. mdi-interface.png
   - The main application MDI interface (http://10.0.0.8:8000/app)
   - Shows: Navigation tree (left), dock tabs (top), Welcome tab, left sidebar icons
   - Used in: architecture/overview.md, frontend/overview.md, frontend/dock-layout.md

4. database-management.png
   - The Database Management panel
   - Shows: "My databases" table, "System & Public Databases" table, action buttons
   - Open via: Double-click "Databases" in the Navigation tree
   - Used in: database/overview.md

5. database-designer.png
   - The Database Designer / ERD view for a schema
   - Shows: Visual table boxes with relationships/connections, zoom controls
   - Open via: Double-click a database schema (e.g., laravel_customer_db)
   - Used in: database/erd.md

6. template-management.png
   - The Template Management panel
   - Shows: "My templates" table with template list, filters, action buttons
   - Open via: Double-click "My Templates" in the Navigation tree
   - Used in: generator/template-engine.md

7. template-tester.png
   - The Template Tester & Debug panel
   - Shows: Template selector, file selector, language dropdown, Get code/Execute buttons
   - Open via: Double-click a table name in the Navigation tree
   - Used in: generator/code-generation-flow.md

How to Take Screenshots:
------------------------
1. Open the app at http://10.0.0.8:8000/ in English (click EN flag)
2. Log in with system credentials
3. Navigate to each panel
4. Use Windows Snipping Tool (Win+Shift+S) to capture ONLY the browser content area
5. Save as PNG with the exact filenames listed above
6. Place all files in this directory

After adding screenshots, rebuild the documentation:
  cd scoriet-docs
  npm run build
