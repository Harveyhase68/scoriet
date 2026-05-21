#!/bin/sh
set -e

# DB-Verbindungseinstellungen
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-3306}"
DB_DATABASE="${DB_DATABASE:-scoriet}"
DB_USERNAME="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-admin}"

# Farben für bessere Lesbarkeit
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_step() {
    echo "${BLUE}=== $1 ===${NC}"
}

log_success() {
    echo "${GREEN}✓ $1${NC}"
}

log_error() {
    echo "${YELLOW}⚠ $1${NC}"
}

# Schritt 1: Datenbank-Verbindung prüfen
log_step "Verbinde mit Datenbank ${DB_HOST}:${DB_PORT}..."
RETRY_COUNT=0
MAX_RETRIES=30
until php -r "new PDO('mysql:host=${DB_HOST};port=${DB_PORT};dbname=${DB_DATABASE};charset=utf8mb4', '${DB_USERNAME}', '${DB_PASSWORD}');" >/dev/null 2>&1
do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    log_error "Konnte nicht mit Datenbank verbinden nach $MAX_RETRIES Versuchen. Fehler!"
    exit 1
  fi
  echo "Warte auf Datenbank... (Versuch $RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done
log_success "Datenbank ist erreichbar"

# Schritt 2: .env Datei vorbereiten
if [ ! -f .env ]; then
  log_step "Erstelle .env von .env.docker..."
  cp .env.docker .env
  log_success ".env erstellt"
fi

# Schritt 3: APP_KEY generieren (falls nicht vorhanden)
if ! grep -qE '^APP_KEY=base64:.+$' .env; then
    log_step "Generiere APP_KEY..."
    php artisan key:generate --force
    log_success "APP_KEY generiert"
else
    log_success "APP_KEY existiert bereits"
fi

# Schritt 4: Datenbank-Migrationen
if [ "${AUTO_MIGRATE:-true}" = "true" ]; then
    log_step "Führe Database-Migrationen durch..."
    if php artisan migrate --force 2>&1; then
        log_success "Migrationen erfolgreich"
    else
        MIGRATE_EXIT=$?
        log_error "Migration mit Exit-Code $MIGRATE_EXIT fehlgeschlagen!"
        # Continue anyway - some migrations handle existing tables gracefully
    fi
fi

# Schritt 5: Passport Keys generieren (falls nicht vorhanden)
if [ ! -f storage/oauth-private.key ] || [ ! -f storage/oauth-public.key ]; then
    log_step "Generiere Passport Keys..."
    if php artisan passport:keys --force; then
        log_success "Passport Keys generiert"
    else
        log_error "Passport Keys Generierung fehlgeschlagen"
        exit 1
    fi
else
    log_success "Passport Keys existieren bereits"
fi

# Schritt 6: Passport Client sicherstellen (Idempotent)
# Hashing des Secrets übernimmt Eloquent (castAttributeAsHashedString im
# Client::secret() Mutator). Niemals manuell vor-hashen — bcrypt-Hashes
# enthalten "$" und werden in Shell-Interpolation zerschossen, was zu
# permanent invaliden Clients führt ("Client authentication failed").
log_step "Stelle Passport OAuth Client sicher..."

php artisan tinker --execute="
try {
    \$clientId = 'scoriet-docker-client';
    \$plainSecret = 'scoriet-docker-secret-key-development-only';

    \$client = Laravel\Passport\Client::find(\$clientId);

    if (!\$client) {
        \$client = new Laravel\Passport\Client();
        \$client->id = \$clientId;
        echo \"Neuer Passport Client wird erstellt\n\";
    } else {
        echo \"Passport Client existiert - Secret wird neu gesetzt (Drift-Schutz)\n\";
    }

    \$client->name = 'Scoriet Docker Development Client';
    \$client->secret = \$plainSecret; // Eloquent hashed automatisch (bcrypt)
    \$client->redirect = 'http://localhost:8888';
    \$client->personal_access_client = 0;
    \$client->password_client = 1;
    \$client->revoked = 0;
    \$client->save();

    // Selbstkontrolle: stelle sicher, dass das Secret korrekt verifizierbar ist.
    \$client->refresh();
    if (!Hash::check(\$plainSecret, \$client->secret)) {
        echo \"FEHLER: Secret-Verifikation nach Save fehlgeschlagen\n\";
        exit(1);
    }
    echo \"Passport Client OK (Secret verifiziert)\n\";
} catch (Exception \$e) {
    echo \"Fehler beim Erstellen/Aktualisieren des Passport Clients: \" . \$e->getMessage() . \"\n\";
    exit(1);
}
" || exit 1
log_success "Passport Client ist bereit"

# Schritt 7: Build Frontend (nach Migrationen und Passport Setup)
# Wichtig: --mode docker zwingt Vite, .env.docker zu laden und nicht
# .env.production. Sonst werden Production-OAuth-Credentials ins Bundle
# gebacken statt der Docker-Werte (siehe entrypoint Schritt 6).
# Immer neu bauen: garantiert, dass Änderungen an .env.docker sofort wirken.
#
# public/hot entfernen: wenn der Host vorher mit "npm run dev" lief, lag
# diese Datei im Build-Context und wurde ins Image kopiert. laravel-vite-plugin
# wertet ihre Existenz als "Dev-Server aktiv" und proxied alle Asset-Requests
# an den darin gespeicherten Host (z.B. http://10.0.0.8:5173), wodurch das
# Frontend mit den .env-Werten des Hosts läuft - nicht mit denen des Containers.
if [ -f public/hot ]; then
    log_step "Entferne public/hot (Dev-Server-Marker darf nicht aktiv sein)..."
    rm -f public/hot
fi
log_step "Baue Frontend (Vite mode: docker)..."
if npm run build -- --mode docker 2>&1; then
    log_success "Frontend gebaut"
else
    log_error "Frontend Build fehlgeschlagen"
    exit 1
fi

# Schritt 8: Cache leeren
# Stelle die von Laravel erwarteten Runtime-Verzeichnisse sicher, bevor
# cache:clear läuft. Cache\FileStore::flush() liefert false (was sich als
# "Failed to clear cache" manifestiert), wenn das data/-Verzeichnis fehlt -
# z.B. weil .dockerignore es ausgeschlossen hat oder ein leerer Volume-Mount
# es überdeckt.
log_step "Leere Caches..."
mkdir -p storage/framework/cache/data \
         storage/framework/sessions \
         storage/framework/views \
         storage/framework/testing \
         storage/logs \
         bootstrap/cache
php artisan config:clear
php artisan cache:clear
php artisan route:clear
log_success "Caches geleert"

# Schritt 9: Berechtigungen setzen
log_step "Setze Berechtigungen..."
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
# League OAuth2 (CryptKey.php:80-92) akzeptiert nur 400/440/600/640/660 für
# beide Keys - sonst trigger_error(E_USER_NOTICE), was bei APP_DEBUG=true von
# Laravel in eine ErrorException konvertiert wird (500 auf jeder API-Anfrage,
# die einen Token validiert). 660 = owner+group rw, www-data kann beide lesen.
# Reihenfolge wichtig: NACH dem rekursiven chmod -R 775 oben, sonst werden die
# Keys wieder überschrieben.
if [ -f storage/oauth-private.key ]; then
    chmod 660 storage/oauth-private.key
fi
if [ -f storage/oauth-public.key ]; then
    chmod 660 storage/oauth-public.key
fi
log_success "Berechtigungen gesetzt"

# Abschluss
log_step "Starte Apache..."
log_success "Container ist bereit!"
exec "$@"