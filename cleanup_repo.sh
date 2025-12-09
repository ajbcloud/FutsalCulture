#!/usr/bin/env bash
set -euo pipefail

BRANCH_DATE="$(date +%Y%m%d)"
BRANCH_NAME="cleanup_all_repo_${BRANCH_DATE}"
REPORT_FILE="cleanup_report.md"
PUSH_BRANCH="${PUSH_BRANCH:-false}"
MAX_DELETE="${MAX_DELETE:-50}"

CODE_GLOBS=("src" "client" "server" "apps" "packages")
FILE_EXTS=("ts" "tsx" "js" "jsx")
ORPHAN_NAME_HINTS=("backup" "old" "copy" "tmp" "unused")

exists() { command -v "$1" >/dev/null 2>&1; }
pm_detect() {
  if [ -f "pnpm-lock.yaml" ] && exists pnpm; then echo "pnpm"; return; fi
  if [ -f "yarn.lock" ] && exists yarn; then echo "yarn"; return; fi
  echo "npm"
}
pm_run() { local pm="$1"; shift; case "$pm" in pnpm) pnpm run "$@";; yarn) yarn "$@";; npm) npm run "$@";; esac; }
pm_exec() { local pm="$1"; shift; case "$pm" in pnpm) pnpm exec "$@";; yarn) yarn dlx "$@" 2>/dev/null || yarn exec "$@";; npm) npx "$@";; esac; }
in_repo_root() { git rev-parse --show-toplevel >/dev/null 2>&1; }
git_clean_check() { if ! git diff --quiet || ! git diff --cached --quiet; then echo "Uncommitted changes present. Commit or stash before running."; exit 1; fi; }
ensure_branch() { git checkout -b "$BRANCH_NAME"; }
append_report() { echo "$1" >> "$REPORT_FILE"; }
header() { echo "" >> "$REPORT_FILE"; echo "## $1" >> "$REPORT_FILE"; echo "" >> "$REPORT_FILE"; }
count_lines() { local pattern="$1"; local total=0; for root in "${CODE_GLOBS[@]}"; do if [ -d "$root" ]; then local c; c=$(grep -R --exclude-dir=node_modules -E "$pattern" "$root" 2>/dev/null | wc -l | tr -d ' '); total=$((total + c)); fi; done; echo "$total"; }
find_code_files() { local extlist; extlist=$(printf -- "-name *.%s -o " "${FILE_EXTS[@]}"); extlist="${extlist::-4}"; for root in "${CODE_GLOBS[@]}"; do if [ -d "$root" ]; then find "$root" -type f \( $extlist \) -not -path "*/node_modules/*"; fi; done; }
safe_grep_refs() { local file="$1"; local base; base="$(basename "$file")"; grep -R --exclude-dir=node_modules --exclude="$base" -F "$base" . >/dev/null 2>&1; }
has_script() { local name="$1"; jq -e --arg s "$name" '.scripts[$s] // empty' package.json >/dev/null 2>&1; }
jq_installed() { exists jq; }

# Runtime health helpers
detect_start_script() {
  if has_script "dev"; then echo "dev"; return; fi
  if has_script "start"; then echo "start"; return; fi
  echo ""
}
start_dev_server() {
  local pm="$1" script="$2"
  echo "Starting dev server with script: $script"
  # Start in background. Capture PID and logs.
  LOG_FILE=".cleanup_dev.log"
  : > "$LOG_FILE"
  # Prefer common PORTs if PORT not set. Do not force override because some tools set their own.
  (pm_run "$pm" "$script" ) >"$LOG_FILE" 2>&1 &
  DEV_PID=$!
  echo "$DEV_PID" > .cleanup_dev.pid
  # Wait for server readiness by detecting a listening URL or by successful probe
  wait_for_server_ready "$LOG_FILE"
}
stop_dev_server() {
  if [ -f .cleanup_dev.pid ]; then
    DEV_PID="$(cat .cleanup_dev.pid || true)"
    if [ -n "${DEV_PID:-}" ] && ps -p "$DEV_PID" >/dev/null 2>&1; then
      echo "Stopping dev server PID $DEV_PID"
      kill "$DEV_PID" >/dev/null 2>&1 || true
      sleep 2
      if ps -p "$DEV_PID" >/dev/null 2>&1; then kill -9 "$DEV_PID" >/dev/null 2>&1 || true; fi
    fi
    rm -f .cleanup_dev.pid
  fi
  rm -f .cleanup_dev.log
}
trap stop_dev_server EXIT

extract_port_from_logs() {
  # Try to find a URL like http://localhost:5173 or http://127.0.0.1:3000
  local log="$1"
  awk '
    match($0, /(http:\/\/(localhost|127\.0\.0\.1):[0-9]+)/, m) { print m[0] }
    match($0, /(http:\/\/0\.0\.0\.0:[0-9]+)/, n) { print n[0] }
  ' "$log" | head -n1
}

probe_urls() {
  local base_urls=("$@")
  local paths=("/" "/health" "/api/health" "/status" "/api/status")
  local start_time=$(date +%s)
  local timeout=120
  while true; do
    for base in "${base_urls[@]}"; do
      for p in "${paths[@]}"; do
        url="${base}${p}"
        code="$(curl -s -o /dev/null -m 2 -w "%{http_code}" "$url" || true)"
        if [[ "$code" =~ ^2|3[0-9]$ ]]; then
          echo "OK $url $code"
          echo "$url"
          return 0
        fi
      done
    done
    now=$(date +%s)
    if [ $((now - start_time)) -ge $timeout ]; then
      return 1
    fi
    sleep 2
  done
}

wait_for_server_ready() {
  local log="$1"
  local ports=("3000" "5173" "8080" "8000" "5000")
  local bases=()
  for port in "${ports[@]}"; do
    bases+=("http://localhost:${port}")
    bases+=("http://127.0.0.1:${port}")
  done
  # Try to parse a URL from logs while probing candidates
  local start_ts=$(date +%s)
  local timeout=120
  while true; do
    # If logs already show a URL, try it first
    if [ -s "$log" ]; then
      url_from_log="$(extract_port_from_logs "$log" || true)"
      if [ -n "${url_from_log:-}" ]; then
        if probe_urls "$url_from_log" >/dev/null; then
          echo "Server ready via logs at $url_from_log"
          return 0
        fi
      fi
    fi
    # Otherwise probe common ports
    if found="$(probe_urls "${bases[@]}" 2>/dev/null)"; then
      echo "Server ready via probes at $found"
      return 0
    fi
    now=$(date +%s)
    if [ $((now - start_ts)) -ge $timeout ]; then
      echo "Server did not respond within ${timeout}s"
      return 1
    fi
  done
}

# Start
if ! in_repo_root; then echo "Run inside a git repository."; exit 1; fi
if ! jq_installed; then echo "This script uses jq. Install jq and rerun."; exit 1; fi
git_clean_check
rm -f "$REPORT_FILE"
echo "# Cleanup Report" > "$REPORT_FILE"
append_report "Branch: \`$BRANCH_NAME\`"
append_report "Date: \`$(date -Iseconds)\`"

# Inventory
header "Inventory"
append_report "Top level:"; append_report "\`\`\`"; ls -la >> "$REPORT_FILE"; append_report "\`\`\`"
if [ -f package.json ]; then header "Package scripts"; append_report "\`\`\`json"; jq '.scripts' package.json >> "$REPORT_FILE"; append_report "\`\`\`"; fi
for cfg in tsconfig.json .eslintrc.cjs .eslintrc.js .eslintrc.json eslint.config.js .prettierrc .prettierrc.json prettier.config.js prettier.config.cjs biome.json; do
  if [ -f "$cfg" ]; then append_report "Found $cfg"; fi
done

# Branch
ensure_branch
PM="$(pm_detect)"

# Lint pass
header "Lint pass"
if [ -f ".eslintrc.cjs" ] || [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ]; then
  if pm_exec "$PM" eslint --version >/dev/null 2>&1; then
    pm_exec "$PM" eslint . --ext .ts,.tsx,.js,.jsx --fix || true
    if ! git diff --quiet; then git add -A; git commit -m "chore: lint auto fix"; fi
  else
    append_report "eslint not available. Skipped lint fix."
  fi
else
  append_report "eslint config not found. Skipped lint fix."
fi

# Debug log removal
header "Debug log removal"
PRE_LOGS="$(count_lines 'console\.(log|debug)')"
TMPFILE="$(mktemp)"
while IFS= read -r f; do
  if grep -E 'console\.(log|debug)\(' "$f" >/dev/null 2>&1; then
    cp "$f" "$TMPFILE"
    sed -E '/console\.(log|debug)\(/d' "$TMPFILE" > "$f"
    if ! git diff --quiet -- "$f"; then git add "$f"; fi
  fi
done < <(find_code_files)
rm -f "$TMPFILE"
if ! git diff --cached --quiet; then git commit -m "chore: remove console logs"; fi
POST_LOGS="$(count_lines 'console\.(log|debug)')"
append_report "Debug logs removed: $(( PRE_LOGS - POST_LOGS ))"

# Orphan file removal
header "Orphan file removal"
CANDIDATES=()
for root in "${CODE_GLOBS[@]}"; do
  if [ -d "$root" ]; then while IFS= read -r f; do CANDIDATES+=("$f"); done < <(find "$root" -type f -not -path "*/node_modules/*"); fi
done
TO_DELETE=()
for f in "${CANDIDATES[@]}"; do
  lower="$(basename "$f" | tr '[:upper:]' '[:lower:]')"
  for hint in "${ORPHAN_NAME_HINTS[@]}"; do
    if [[ "$lower" == *"$hint"* ]] && ! safe_grep_refs "$f"; then TO_DELETE+=("$f"); break; fi
  done
done
if [ "${#TO_DELETE[@]}" -le "$MAX_DELETE" ] && [ "${#TO_DELETE[@]}" -gt 0 ]; then
  for f in "${TO_DELETE[@]}"; do git rm -f "$f" >/dev/null 2>&1 || rm -f "$f"; done
  git commit -m "chore: remove orphan files"
else
  append_report "No orphan backups or over cap. Found ${#TO_DELETE[@]} candidates."
fi

# Formatting
header "Formatting"
if [ -f ".prettierrc" ] || [ -f ".prettierrc.json" ] || [ -f "prettier.config.js" ] || [ -f "prettier.config.cjs" ]; then
  if pm_exec "$PM" prettier --version >/dev/null 2>&1; then
    pm_exec "$PM" prettier . --write || true
    if ! git diff --quiet; then git add -A; git commit -m "chore: format code"; fi
  else
    append_report "prettier not available. Skipped format."
  fi
else
  append_report "prettier config not found. Skipped format."
fi

# Validation
header "Validation"
TYPE_OK="skipped"; BUILD_OK="skipped"; RUNTIME_OK="skipped"; RUNTIME_URL=""

if [ -f "tsconfig.json" ] && pm_exec "$PM" tsc --version >/dev/null 2>&1; then
  if pm_exec "$PM" tsc --noEmit; then TYPE_OK="passed"; else TYPE_OK="failed"; fi
else
  append_report "TypeScript compiler not available or tsconfig missing. Skipped type check."
fi

if has_script "build"; then
  if pm_run "$PM" build; then BUILD_OK="passed"; else BUILD_OK="failed"; fi
else
  append_report "No build script. Skipped build."
fi

# Runtime health checks
START_SCRIPT="$(detect_start_script)"
if [ -n "$START_SCRIPT" ]; then
  header "Runtime health checks"
  if start_dev_server "$PM" "$START_SCRIPT"; then
    # Once server seems up, probe again to capture the working URL
    # Use logs or common ports
    LOG_URL="$(extract_port_from_logs .cleanup_dev.log || true)"
    CANDIDATES=("http://localhost:3000" "http://127.0.0.1:3000" "http://localhost:5173" "http://127.0.0.1:5173" "http://localhost:8080" "http://127.0.0.1:8080" "http://localhost:8000" "http://127.0.0.1:8000" "http://localhost:5000" "http://127.0.0.1:5000")
    if [ -n "${LOG_URL:-}" ]; then CANDIDATES=("$LOG_URL" "${CANDIDATES[@]}"); fi
    if R="$(probe_urls "${CANDIDATES[@]}" 2>/dev/null)"; then
      RUNTIME_OK="passed"; RUNTIME_URL="$R"
      append_report "Runtime probe OK at ${RUNTIME_URL}"
    else
      RUNTIME_OK="failed"
      append_report "Runtime probe failed on common ports. Review .cleanup_dev.log"
    fi
  else
    RUNTIME_OK="failed"
    append_report "Dev server did not start within timeout."
  fi
  stop_dev_server
else
  append_report "No dev or start script found. Skipped runtime checks."
fi

append_report "Type check: ${TYPE_OK}"
append_report "Build: ${BUILD_OK}"
append_report "Runtime: ${RUNTIME_OK}${RUNTIME_URL:+ at ${RUNTIME_URL}}"

# Summary
header "Summary of changes"
append_report "Total files changed: $(git diff --name-only "${BRANCH_NAME}"..HEAD | wc -l)"
append_report ""
append_report "Recent commit history:"
append_report "\`\`\`"
git --no-pager log --oneline -n 8 >> "$REPORT_FILE"
append_report "\`\`\`"

# Ensure report is committed
if ! git ls-files --error-unmatch "$REPORT_FILE" >/dev/null 2>&1; then
  git add "$REPORT_FILE"
  git commit -m "docs: add cleanup report"
fi

# Optional push
if [ "$PUSH_BRANCH" = "true" ]; then
  git push -u origin "$BRANCH_NAME"
fi

echo "Cleanup complete on branch ${BRANCH_NAME}"
echo "Report written to ${REPORT_FILE}"
echo "Set PUSH_BRANCH=true to push automatically"