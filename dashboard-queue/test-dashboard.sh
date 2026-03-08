#!/bin/bash
# ============================================
# Dashboard Pre-Deployment Test Suite
# MUST pass before telling Wayne anything works
# ============================================
set -e

URL="http://187.77.8.165"
PASS=0
FAIL=0
ERRORS=""

test_it() {
  local name="$1"
  local result="$2"
  if [ "$result" = "ok" ]; then
    echo "  ✅ $name"
    PASS=$((PASS+1))
  else
    echo "  ❌ $name — $result"
    FAIL=$((FAIL+1))
    ERRORS="$ERRORS\n  ❌ $name: $result"
  fi
}

echo "🔍 Dashboard Test Suite"
echo "========================"

# 1. Server responds
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
test_it "Server responds (HTTP $HTTP_CODE)" "$([ "$HTTP_CODE" = "200" ] && echo ok || echo "Got $HTTP_CODE")"

# 2. Health endpoint
HEALTH=$(curl -s "$URL/health" 2>/dev/null)
DB_STATUS=$(echo "$HEALTH" | python3 -c "import sys,json;print(json.load(sys.stdin).get('db',''))" 2>/dev/null)
test_it "Health endpoint" "$([ "$DB_STATUS" = "connected" ] && echo ok || echo "DB: $DB_STATUS")"

# 3. Auth works
AUTH=$(curl -s -X POST "$URL/api/auth" -H 'Content-Type: application/json' -d '{"password":"Wayne2026#"}' 2>/dev/null)
TOKEN=$(echo "$AUTH" | python3 -c "import sys,json;print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
test_it "Auth (password login)" "$([ -n "$TOKEN" ] && echo ok || echo "No token returned")"

# 4. Bad password rejected
BAD=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$URL/api/auth" -H 'Content-Type: application/json' -d '{"password":"wrong"}')
test_it "Auth rejects bad password" "$([ "$BAD" = "401" ] && echo ok || echo "Got $BAD")"

# 5. Agents API returns data
AGENT_COUNT=$(curl -s "$URL/api/agents" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))" 2>/dev/null)
test_it "Agents API ($AGENT_COUNT agents)" "$([ "$AGENT_COUNT" -ge 5 ] 2>/dev/null && echo ok || echo "Only $AGENT_COUNT agents")"

# 6. Stats API
STATS=$(curl -s "$URL/api/stats" | python3 -c "import sys,json;d=json.load(sys.stdin);print('ok' if 'tasks_today' in d else 'missing fields')" 2>/dev/null)
test_it "Stats API" "$STATS"

# 7. Logs API
LOG_COUNT=$(curl -s "$URL/api/logs?limit=5" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))" 2>/dev/null)
test_it "Logs API ($LOG_COUNT entries)" "$([ "$LOG_COUNT" -ge 0 ] 2>/dev/null && echo ok || echo "Failed")"

# 8. Log write works
LOG_WRITE=$(curl -s -X POST "$URL/api/logs" -H 'Content-Type: application/json' -d '{"agent_name":"test","task_description":"automated test","status":"completed"}' | python3 -c "import sys,json;print(json.load(sys.stdin).get('status',''))" 2>/dev/null)
test_it "Log write" "$([ "$LOG_WRITE" = "logged" ] && echo ok || echo "$LOG_WRITE")"

# 9. Todos API
TODO_RESP=$(curl -s "$URL/api/todos" | python3 -c "import sys,json;print('ok' if isinstance(json.load(sys.stdin),list) else 'not a list')" 2>/dev/null)
test_it "Todos API" "$TODO_RESP"

# 10. Frontend JavaScript syntax
JS_ERRORS=$(node -e "
const http=require('http');
http.get('$URL',res=>{
  let d='';res.on('data',c=>d+=c);res.on('end',()=>{
    const scripts=d.match(/<script[^>]*>([\s\S]*?)<\/script>/g)||[];
    let errors=0;
    scripts.forEach((s,i)=>{
      const code=s.replace(/<\/?script[^>]*>/g,'');
      try{new Function(code);}catch(e){errors++;process.stderr.write('Script '+i+': '+e.message+'\n');}
    });
    console.log(errors);
  });
});
" 2>/tmp/js-errors.txt)
test_it "Frontend JS syntax ($JS_ERRORS errors)" "$([ "$JS_ERRORS" = "0" ] && echo ok || echo "$(cat /tmp/js-errors.txt)")"

# 11. HTML has login form
HAS_LOGIN=$(curl -s "$URL" | grep -c 'loginOverlay' 2>/dev/null)
test_it "Login form present" "$([ "$HAS_LOGIN" -ge 1 ] && echo ok || echo "Missing")"

# 12. HTML has all tabs
for TAB in office status agents timeline projects tasks chat; do
  HAS_TAB=$(curl -s "$URL" | grep -c "tab-$TAB" 2>/dev/null)
  test_it "Tab: $TAB" "$([ "$HAS_TAB" -ge 1 ] && echo ok || echo "Missing")"
done

echo ""
echo "========================"
echo "Results: $PASS passed, $FAIL failed"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "⛔ DO NOT REPORT SUCCESS TO WAYNE"
  echo "Fix these first:$ERRORS"
  exit 1
else
  echo ""
  echo "✅ ALL TESTS PASSED — safe to report"
  exit 0
fi
