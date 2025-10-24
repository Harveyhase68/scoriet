#!/bin/bash

# Findet und ersetzt alle t('key') durch t.key in TSX/JSX Dateien

find resources/js -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" \) ! -name "*.backup" ! -name "*.tmp.*" -print0 | while IFS= read -r -d '' file; do
    # Backup erstellen
    # cp "$file" "$file.bak"
    
    # Suche nach t('...') und ersetze durch t....
    sed -i "s/t('\([a-zA-Z0-9_]*\)')/t.\1/g" "$file"
    
    echo "Verarbeitet: $file"
done

echo "Fertig!"
