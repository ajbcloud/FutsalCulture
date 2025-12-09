#!/bin/bash

# Clean up console.log and console.debug statements safely
# Only removes complete standalone console statements, not parts of objects

echo "Starting careful console.log cleanup..."

# Function to clean up a single file
clean_file() {
    local file="$1"
    if [ -f "$file" ]; then
        # Create a backup
        cp "$file" "${file}.bak"
        
        # Use perl for more precise regex - only remove complete console.log/debug lines
        # that are standalone statements (end with ; or standalone on a line)
        perl -i -pe 's/^(\s*)console\.(log|debug)\([^)]*\);\s*$/$1\/\/ Debug log removed\n/g' "$file"
        
        # Remove empty debug comment lines to clean up
        sed -i '/^[[:space:]]*\/\/ Debug log removed[[:space:]]*$/d' "$file"
        
        # Check if file is syntactically valid by attempting to parse
        if ! node -c "$file" 2>/dev/null && [[ "$file" == *.js || "$file" == *.ts ]]; then
            echo "  Syntax error in $file, restoring backup"
            cp "${file}.bak" "$file"
        else
            echo "  Cleaned: $file"
        fi
        
        rm -f "${file}.bak"
    fi
}

# Only clean JavaScript/TypeScript files, skip test and config files
find client server -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
grep -v test | grep -v spec | grep -v config | \
while read -r file; do
    clean_file "$file"
done

echo "Console log cleanup completed safely"