# ============================================================
# scripts/security-test.ps1
# Manual Security Test Suite for Anvesha / ShareSpot API
#
# HOW TO RUN:
#   1. Start the dev server: .\scripts\dev.ps1
#   2. Open a NEW terminal and run: .\scripts\security-test.ps1
#
# Results are printed with PASS / FAIL / INFO indicators.
# Expected outcome: all assertions PASS.
# ============================================================

$BASE = "http://localhost:3001/api"
$PASS = "[PASS]"
$FAIL = "[FAIL]"
$INFO = "[INFO]"

$ErrorActionPreference = "SilentlyContinue"
$global:PassCount = 0
$global:FailCount = 0

function Assert-True($condition, $label) {
  if ($condition) {
    Write-Host "$PASS $label" -ForegroundColor Green
    $global:PassCount++
  } else {
    Write-Host "$FAIL $label" -ForegroundColor Red
    $global:FailCount++
  }
}

function Invoke-API($url, $method = "GET", $body = $null, $token = $null) {
  $headers = @{ "Content-Type" = "application/json" }
  if ($token) { $headers["Authorization"] = "Bearer $token" }
  try {
    if ($body) {
      return Invoke-RestMethod -Uri $url -Method $method -Body ($body | ConvertTo-Json -Depth 5) -Headers $headers
    }
    return Invoke-RestMethod -Uri $url -Method $method -Headers $headers
  } catch {
    return $null
  }
}

function Get-StatusCode($url, $method = "GET", $body = $null, $token = $null) {
  $headers = @{ "Content-Type" = "application/json" }
  if ($token) { $headers["Authorization"] = "Bearer $token" }
  try {
    if ($body) {
      $resp = Invoke-WebRequest -Uri $url -Method $method -Body ($body | ConvertTo-Json -Depth 5) -Headers $headers -UseBasicParsing
    } else {
      $resp = Invoke-WebRequest -Uri $url -Method $method -Headers $headers -UseBasicParsing
    }
    return [int]$resp.StatusCode
  } catch {
    return [int]$_.Exception.Response.StatusCode.value__
  }
}

# Unique username to avoid conflicts across test runs
$RUN_ID      = [System.DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$TEST_USER   = "sectest_$RUN_ID"
$TEST_PASS   = "s3cur3P@ss!"
$TEST_USER_2 = "sectest2_$RUN_ID"

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  Anvesha API -- Security Test Suite"                  -ForegroundColor Cyan
Write-Host "  Target: $BASE"                                        -ForegroundColor Cyan
Write-Host "  Run ID: $RUN_ID"                                      -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""


# ------------------------------------------------------------
Write-Host "--- 1. HEALTH CHECK ---" -ForegroundColor Yellow
# ------------------------------------------------------------
$health = Invoke-API "$BASE/health"
Assert-True ($health -ne $null)       "API is reachable"
Assert-True ($health.status -eq "ok") "Health status is ok"


# ------------------------------------------------------------
Write-Host ""
Write-Host "--- 2. AUTH - INPUT VALIDATION ---" -ForegroundColor Yellow
# ------------------------------------------------------------

# Short username (less than 3 chars)
$sc = Get-StatusCode "$BASE/auth/register" "POST" @{ username="ab"; password="abc123"; name="Test" }
Assert-True ($sc -eq 400) "Register: reject username less than 3 chars (400)"

# Username too long (31 chars)
$longUser = "a" * 31
$sc = Get-StatusCode "$BASE/auth/register" "POST" @{ username=$longUser; password="abc123"; name="Test" }
Assert-True ($sc -eq 400) "Register: reject username more than 30 chars (400)"

# Username with uppercase / special chars
$sc = Get-StatusCode "$BASE/auth/register" "POST" @{ username="Hello World!"; password="abc123"; name="Test" }
Assert-True ($sc -eq 400) "Register: reject username with uppercase/spaces (400)"

# Password too short (less than 6 chars)
$sc = Get-StatusCode "$BASE/auth/register" "POST" @{ username="validuser"; password="abc"; name="Test" }
Assert-True ($sc -eq 400) "Register: reject password less than 6 chars (400)"

# Missing required fields
$sc = Get-StatusCode "$BASE/auth/register" "POST" @{ username="validuser" }
Assert-True ($sc -eq 400) "Register: reject missing name and password (400)"

# Bio too long (501 chars)
$longBio = "x" * 501
$sc = Get-StatusCode "$BASE/auth/register" "POST" @{ username="validuser9"; password="abc123"; name="Test"; bio=$longBio }
Assert-True ($sc -eq 400) "Register: reject bio more than 500 chars (400)"


# ------------------------------------------------------------
Write-Host ""
Write-Host "--- 3. AUTH - REGISTRATION AND LOGIN ---" -ForegroundColor Yellow
# ------------------------------------------------------------

$regResult = Invoke-API "$BASE/auth/register" "POST" @{ username=$TEST_USER; password=$TEST_PASS; name="Security Tester" }
Assert-True ($regResult -ne $null)                     "Register new user: success"
Assert-True ($regResult.token -ne $null)               "Register returns JWT token"
Assert-True ($regResult.user -ne $null)                "Register returns user object"
Assert-True ($regResult.user.password_hash -eq $null)  "Register: password_hash NOT leaked in response"

$JWT = $regResult.token
Write-Host "$INFO  Token: $($JWT.Substring(0,[Math]::Min(40,$JWT.Length)))..." -ForegroundColor DarkGray

# Duplicate username
$sc = Get-StatusCode "$BASE/auth/register" "POST" @{ username=$TEST_USER; password=$TEST_PASS; name="Dup" }
Assert-True ($sc -eq 409) "Register: reject duplicate username (409)"

# Login success
$loginResult = Invoke-API "$BASE/auth/login" "POST" @{ username=$TEST_USER; password=$TEST_PASS }
Assert-True ($loginResult -ne $null)                      "Login: success"
Assert-True ($loginResult.token -ne $null)                "Login returns JWT token"
Assert-True ($loginResult.user.password_hash -eq $null)   "Login: password_hash NOT leaked"

$JWT = $loginResult.token

# Wrong password
$sc = Get-StatusCode "$BASE/auth/login" "POST" @{ username=$TEST_USER; password="WRONG" }
Assert-True ($sc -eq 401) "Login: reject wrong password (401)"

# Non-existent user -- same error code prevents username enumeration
$sc = Get-StatusCode "$BASE/auth/login" "POST" @{ username="no_such_user_xyz"; password="abc123" }
Assert-True ($sc -eq 401) "Login: non-existent user returns 401 (no username enumeration)"


# ------------------------------------------------------------
Write-Host ""
Write-Host "--- 4. AUTHENTICATION ENFORCEMENT ---" -ForegroundColor Yellow
# ------------------------------------------------------------

$sc = Get-StatusCode "$BASE/auth/me" "GET"
Assert-True ($sc -eq 401) "GET /auth/me: 401 without token"

$sc = Get-StatusCode "$BASE/events/saved" "GET"
Assert-True ($sc -eq 401) "GET /events/saved: 401 without token"

$sc = Get-StatusCode "$BASE/events" "POST" @{ title="Hack"; venue="Here" }
Assert-True ($sc -eq 401) "POST /events: 401 without token"

$sc = Get-StatusCode "$BASE/locket" "GET"
Assert-True ($sc -eq 401) "GET /locket: 401 without token"

$sc = Get-StatusCode "$BASE/locket" "POST" @{ moment_type="WORD_OF_DAY"; vernacular_text="test"; meaning="test" }
Assert-True ($sc -eq 401) "POST /locket: 401 without token"

$sc = Get-StatusCode "$BASE/messages/conversations" "GET"
Assert-True ($sc -eq 401) "GET /messages/conversations: 401 without token"

$sc = Get-StatusCode "$BASE/people" "GET"
Assert-True ($sc -eq 401) "GET /people: 401 without token"


# ------------------------------------------------------------
Write-Host ""
Write-Host "--- 5. INVALID / TAMPERED JWT ---" -ForegroundColor Yellow
# ------------------------------------------------------------

$FAKE_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzcl9oYWNrZXIiLCJpYXQiOjE3MDB9.INVALIDSIGNATURE"

$sc = Get-StatusCode "$BASE/auth/me" "GET" -token $FAKE_JWT
Assert-True ($sc -eq 401) "Tampered JWT: rejected with 401"

$sc = Get-StatusCode "$BASE/auth/me" "GET" -token "not.a.jwt"
Assert-True ($sc -eq 401) "Malformed JWT: rejected with 401"

# Bearer with empty value
$headers = @{ "Authorization" = "Bearer " }
try {
  $resp = Invoke-WebRequest -Uri "$BASE/auth/me" -Method GET -Headers $headers -UseBasicParsing
  $sc = [int]$resp.StatusCode
} catch {
  $sc = [int]$_.Exception.Response.StatusCode.value__
}
Assert-True ($sc -eq 401) "Empty Bearer token: rejected with 401"


# ------------------------------------------------------------
Write-Host ""
Write-Host "--- 6. SQL INJECTION ATTEMPTS ---" -ForegroundColor Yellow
# ------------------------------------------------------------

# Build SQLi payloads using string concatenation to avoid PowerShell parser issues
# with single quotes inside double-quoted strings
$sqli1 = "' OR '1'='" + "1"
$sqli2 = "admin'--"
$sqli3 = "'; DROP TABLE users;--"
$sqli4 = "' UNION SELECT * FROM users--"
$sqlPayloads = @($sqli1, $sqli2, $sqli3, $sqli4)

foreach ($payload in $sqlPayloads) {
  $shortLabel = $payload.Substring(0, [Math]::Min(20, $payload.Length))
  $sc = Get-StatusCode "$BASE/auth/login" "POST" @{ username=$payload; password="anything" }
  Assert-True ($sc -eq 401 -or $sc -eq 400) "SQLi login username [$shortLabel]: rejected"
}

# SQLi in event search query param -- build URL with EscapeDataString
$sqliQRaw = "'; DROP TABLE events;--"
$sqliQUrl = "$BASE/events?q=" + [Uri]::EscapeDataString($sqliQRaw)
$sc = Get-StatusCode $sqliQUrl "GET"
Assert-True ($sc -eq 200) "SQLi in events search: returns 200 safely (parameterised query)"

# SQLi in people filter
$sqliPplRaw = "'; DROP TABLE users;--"
$sqliPplUrl = "$BASE/people?filter=" + [Uri]::EscapeDataString($sqliPplRaw)
$sc = Get-StatusCode $sqliPplUrl "GET" -token $JWT
Assert-True ($sc -eq 200 -or $sc -eq 400) "SQLi in people filter param: handled safely"


# ------------------------------------------------------------
Write-Host ""
Write-Host "--- 7. AUTHORISATION / IDOR TESTS ---" -ForegroundColor Yellow
# ------------------------------------------------------------

# Register a second user
$reg2 = Invoke-API "$BASE/auth/register" "POST" @{ username=$TEST_USER_2; password=$TEST_PASS; name="Second User" }
$JWT2 = $reg2.token

# Get own profile
$me = Invoke-API "$BASE/auth/me" "GET" -token $JWT
Assert-True ($me -ne $null)    "GET /auth/me: returns profile with valid token"
Assert-True ($me.id -ne $null) "GET /auth/me: profile has id"

# Try to read other user messages directly
if ($me -ne $null) {
  $thread = Invoke-API "$BASE/messages/$($me.id)" "GET" -token $JWT2
  $leakedMsgs = if ($thread -and $thread.messages) {
    $thread.messages | Where-Object { $_.sender_id -eq $me.id -and $_.recipient_id -ne $reg2.user.id }
  } else { @() }
  Assert-True ($leakedMsgs.Count -eq 0) "IDOR: user2 cannot read user1 private messages"
}

# PATCH /auth/me cannot set fields not on allowlist (e.g. id, username)
$patchResult = Invoke-API "$BASE/auth/me" "PATCH" @{ id="evil_id"; username="hacker"; name="Legit Name" } -token $JWT
$meAfter = Invoke-API "$BASE/auth/me" "GET" -token $JWT
Assert-True ($meAfter.id -eq $me.id)           "PATCH /auth/me: cannot change user id"
Assert-True ($meAfter.username -eq $TEST_USER) "PATCH /auth/me: cannot change username"


# ------------------------------------------------------------
Write-Host ""
Write-Host "--- 8. EVENT VALIDATION ---" -ForegroundColor Yellow
# ------------------------------------------------------------

# Title too long (more than 200 chars)
$longTitle = "A" * 201
$sc = Get-StatusCode "$BASE/events" "POST" @{ title=$longTitle; venue="MIT Campus" } -token $JWT
Assert-True ($sc -eq 400) "POST /events: reject title more than 200 chars (400)"

# Invalid category
$sc = Get-StatusCode "$BASE/events" "POST" @{ title="Test Event"; venue="MIT"; category="xss_injection<script>" } -token $JWT
Assert-True ($sc -eq 400) "POST /events: reject invalid category (400)"

# Invalid source_url (not http/https)
$sc = Get-StatusCode "$BASE/events" "POST" @{ title="Test Event"; venue="MIT"; source_url="javascript:alert(1)" } -token $JWT
Assert-True ($sc -eq 400) "POST /events: reject javascript: source_url (400)"

# image_url must be http/https
$sc = Get-StatusCode "$BASE/events" "POST" @{ title="Test Event"; venue="MIT"; image_url="file:///etc/passwd" } -token $JWT
Assert-True ($sc -eq 400) "POST /events: reject file:// image_url (400)"

# Description too long (more than 2000 chars)
$longDesc = "X" * 2001
$sc = Get-StatusCode "$BASE/events" "POST" @{ title="Test Event"; venue="MIT"; description=$longDesc } -token $JWT
Assert-True ($sc -eq 400) "POST /events: reject description more than 2000 chars (400)"

# Valid submission
$evtResult = Invoke-API "$BASE/events" "POST" @{
  title       = "Security Test Gathering"
  venue       = "MIT Campus"
  category    = "culture"
  description = "Created by security test suite"
} -token $JWT
Assert-True ($evtResult -ne $null)    "POST /events: valid event created successfully"
Assert-True ($evtResult.id -ne $null) "POST /events: returned event has id"

# Toggle save
if ($evtResult) {
  $saveResult   = Invoke-API "$BASE/events/$($evtResult.id)/save" "POST" -token $JWT
  Assert-True ($saveResult.saved -eq $true)    "POST /events/:id/save: saved=true on first toggle"
  $unsaveResult = Invoke-API "$BASE/events/$($evtResult.id)/save" "POST" -token $JWT
  Assert-True ($unsaveResult.saved -eq $false) "POST /events/:id/save: saved=false on second toggle"

  $saved1    = Invoke-API "$BASE/events/saved" "GET" -token $JWT
  $saved2    = Invoke-API "$BASE/events/saved" "GET" -token $JWT2
  $crossLeak = if ($saved1 -and $saved2) { $saved2 | Where-Object { $_.id -eq $evtResult.id } } else { @() }
  Assert-True ($crossLeak.Count -eq 0) "Saved events: user2 cannot see user1 saved list"
}


# ------------------------------------------------------------
Write-Host ""
Write-Host "--- 9. LOCKET VALIDATION ---" -ForegroundColor Yellow
# ------------------------------------------------------------

# Missing required fields
$sc = Get-StatusCode "$BASE/locket" "POST" @{ moment_type="WORD_OF_DAY" } -token $JWT
Assert-True ($sc -eq 400) "POST /locket: reject missing vernacular_text / meaning (400)"

# Invalid moment_type
$sc = Get-StatusCode "$BASE/locket" "POST" @{
  moment_type     = "EVIL_TYPE"
  vernacular_text = "test"
  meaning         = "test meaning"
} -token $JWT
Assert-True ($sc -eq 400) "POST /locket: reject invalid moment_type (400)"

# Valid locket moment
$locketResult = Invoke-API "$BASE/locket" "POST" @{
  moment_type     = "WORD_OF_DAY"
  vernacular_text = "test-word"
  meaning         = "Welcome -- a coastal Karnataka greeting"
  phonetic_text   = "/swa-ga-ta/"
  provenance      = "Security test suite"
} -token $JWT
Assert-True ($locketResult -ne $null)    "POST /locket: valid moment created"
Assert-True ($locketResult.id -ne $null) "POST /locket: returned moment has id"

# React to a moment
if ($locketResult) {
  $reactResult = Invoke-API "$BASE/locket/$($locketResult.id)/react" "POST" @{ text = "thumbsup" } -token $JWT
  Assert-True ($reactResult -ne $null) "POST /locket/:id/react: reaction accepted"
}


# ------------------------------------------------------------
Write-Host ""
Write-Host "--- 10. MESSAGES VALIDATION ---" -ForegroundColor Yellow
# ------------------------------------------------------------

# Cannot message yourself
$sc = Get-StatusCode "$BASE/messages/$($me.id)" "POST" @{ text = "Hello me" } -token $JWT
Assert-True ($sc -eq 400 -or $sc -eq 403) "POST /messages/:id: cannot message yourself"

# Empty message body
$sc = Get-StatusCode "$BASE/messages/$($reg2.user.id)" "POST" @{ text = "" } -token $JWT
Assert-True ($sc -eq 400) "POST /messages/:id: reject empty message text (400)"

# Valid message to user2
$msgResult = Invoke-API "$BASE/messages/$($reg2.user.id)" "POST" @{ text = "Hello from security test!" } -token $JWT
Assert-True ($msgResult -ne $null) "POST /messages/:id: message sent successfully"

# Read thread
$thread = Invoke-API "$BASE/messages/$($reg2.user.id)" "GET" -token $JWT
Assert-True ($thread -ne $null -and $thread.messages.Count -ge 1) "GET /messages/:id: thread returned with messages"


# ------------------------------------------------------------
Write-Host ""
Write-Host "--- 11. XSS PROBE ---" -ForegroundColor Yellow
# ------------------------------------------------------------

$xssPayload = "<script>alert('xss')</script>"
$xssEvt = Invoke-API "$BASE/events" "POST" @{
  title       = $xssPayload
  venue       = "MIT Campus"
  description = "XSS probe test"
} -token $JWT
if ($xssEvt) {
  Assert-True ($xssEvt.title -eq $xssPayload) "XSS probe: API stores title as plain text (not executed)"
} else {
  Write-Host "$INFO  XSS probe: event creation failed or was sanitised (check manually)" -ForegroundColor DarkGray
}


# ------------------------------------------------------------
Write-Host ""
Write-Host "--- 12. PROFILE UPDATE VALIDATION ---" -ForegroundColor Yellow
# ------------------------------------------------------------

# Invalid preferred_mode
$sc = Get-StatusCode "$BASE/auth/me" "PATCH" @{ preferred_mode = "INVALID_MODE" } -token $JWT
Assert-True ($sc -eq 400) "PATCH /auth/me: reject invalid preferred_mode (400)"

# Bio too long (more than 500 chars)
$longBio2 = "B" * 501
$sc = Get-StatusCode "$BASE/auth/me" "PATCH" @{ bio = $longBio2 } -token $JWT
Assert-True ($sc -eq 400) "PATCH /auth/me: reject bio more than 500 chars (400)"

# Name too long (more than 80 chars)
$longName = "N" * 81
$sc = Get-StatusCode "$BASE/auth/me" "PATCH" @{ name = $longName } -token $JWT
Assert-True ($sc -eq 400) "PATCH /auth/me: reject name more than 80 chars (400)"

# Valid update
$patchOk = Invoke-API "$BASE/auth/me" "PATCH" @{
  name            = "Security Tester (Updated)"
  preferred_mode  = "BOTH"
  is_discoverable = $false
} -token $JWT
Assert-True ($patchOk.ok -eq $true) "PATCH /auth/me: valid update returns ok=true"

$meFinal = Invoke-API "$BASE/auth/me" "GET" -token $JWT
Assert-True ($meFinal.name -eq "Security Tester (Updated)")                          "PATCH /auth/me: name change persisted"
Assert-True ($meFinal.is_discoverable -eq $false -or $meFinal.is_discoverable -eq 0) "PATCH /auth/me: is_discoverable change persisted"


# ------------------------------------------------------------
Write-Host ""
Write-Host "--- 13. ONBOARDING INTERESTS PERSIST TO DB (bug 1.3) ---" -ForegroundColor Yellow
# ------------------------------------------------------------

# Clear any existing interests first
$clearInterests = Invoke-API "$BASE/auth/me" "PATCH" @{ interests = @() } -token $JWT
Assert-True ($clearInterests.ok -eq $true) "1.3 pre-condition: clear interests returns ok=true"

$meBeforeOnboard = Invoke-API "$BASE/auth/me" -token $JWT
Assert-True ($meBeforeOnboard.interests.Count -eq 0) "1.3 pre-condition: interests cleared in DB"

# Simulate onboarding -- same payload shape as handleOnboardingComplete
$onboardPayload = @{
  interests = @(
    @{ interest_id = "folk_music";        intention = "WANTS_TO_LEARN" }
    @{ interest_id = "heritage_crafts";   intention = "CASUAL_ENTHUSIAST" }
    @{ interest_id = "culinary_heritage"; intention = "CASUAL_ENTHUSIAST" }
  )
  neighborhood   = "Manipal Campus"
  preferred_mode = "BOTH"
}
$onboardRes = Invoke-API "$BASE/auth/me" "PATCH" $onboardPayload -token $JWT
Assert-True ($onboardRes.ok -eq $true) "1.3: PATCH /auth/me with onboarding payload returns ok=true"

# Simulate page refresh -- GET /me must return the persisted interests
$meAfterOnboard = Invoke-API "$BASE/auth/me" -token $JWT
Assert-True ($meAfterOnboard.interests.Count -eq 3) "1.3: GET /me returns 3 interests (not empty after simulated refresh)"

$interestIds = $meAfterOnboard.interests | ForEach-Object { $_.interest_id }
Assert-True ($interestIds -contains "folk_music")        "1.3: interest folk_music persisted in DB"
Assert-True ($interestIds -contains "heritage_crafts")   "1.3: interest heritage_crafts persisted in DB"
Assert-True ($interestIds -contains "culinary_heritage") "1.3: interest culinary_heritage persisted in DB"

# Updating replaces (does not append)
Invoke-API "$BASE/auth/me" "PATCH" @{
  interests = @( @{ interest_id = "folk_music"; intention = "WANTS_TO_LEARN" } )
} -token $JWT | Out-Null
$meSingle = Invoke-API "$BASE/auth/me" -token $JWT
Assert-True ($meSingle.interests.Count -eq 1) "1.3: interests update replaces list (does not append)"

# Unauthenticated PATCH must be blocked
$sc = Get-StatusCode "$BASE/auth/me" "PATCH" @{ interests = @(@{ interest_id = "folk_music" }) }
Assert-True ($sc -eq 401) "1.3 security: unauthenticated PATCH /auth/me blocked (401)"


# ------------------------------------------------------------
Write-Host ""
Write-Host "--- 14. PROFILE PRIVACY TOGGLES PERSIST TO DB (bug 1.4) ---" -ForegroundColor Yellow
# ------------------------------------------------------------

$mePrivacy = Invoke-API "$BASE/auth/me" -token $JWT
Write-Host "$INFO  Current is_discoverable=$($mePrivacy.is_discoverable)  fuzzed_location=$($mePrivacy.fuzzed_location)" -ForegroundColor DarkGray

# Toggle is_discoverable OFF
$patchOff = Invoke-API "$BASE/auth/me" "PATCH" @{ is_discoverable = 0 } -token $JWT
Assert-True ($patchOff.ok -eq $true) "1.4: PATCH is_discoverable=0 returns ok=true"

$meAfterOff = Invoke-API "$BASE/auth/me" -token $JWT
Assert-True ($meAfterOff.is_discoverable -eq 0 -or $meAfterOff.is_discoverable -eq $false) `
  "1.4: is_discoverable=0 persisted (survives simulated page refresh)"

# Toggle is_discoverable back ON
Invoke-API "$BASE/auth/me" "PATCH" @{ is_discoverable = 1 } -token $JWT | Out-Null
$meRestoredDisc = Invoke-API "$BASE/auth/me" -token $JWT
Assert-True ($meRestoredDisc.is_discoverable -eq 1 -or $meRestoredDisc.is_discoverable -eq $true) `
  "1.4: is_discoverable=1 restored correctly"

# Toggle fuzzed_location OFF
$patchFuzz = Invoke-API "$BASE/auth/me" "PATCH" @{ fuzzed_location = 0 } -token $JWT
Assert-True ($patchFuzz.ok -eq $true) "1.4: PATCH fuzzed_location=0 returns ok=true"

$meAfterFuzz = Invoke-API "$BASE/auth/me" -token $JWT
Assert-True ($meAfterFuzz.fuzzed_location -eq 0 -or $meAfterFuzz.fuzzed_location -eq $false) `
  "1.4: fuzzed_location=0 persisted in DB"

# Toggle fuzzed_location back ON
Invoke-API "$BASE/auth/me" "PATCH" @{ fuzzed_location = 1 } -token $JWT | Out-Null
$meRestoredFuzz = Invoke-API "$BASE/auth/me" -token $JWT
Assert-True ($meRestoredFuzz.fuzzed_location -eq 1 -or $meRestoredFuzz.fuzzed_location -eq $true) `
  "1.4: fuzzed_location=1 restored correctly"

# Unauthenticated privacy toggle must be blocked
$sc = Get-StatusCode "$BASE/auth/me" "PATCH" @{ is_discoverable = 0 }
Assert-True ($sc -eq 401) "1.4 security: unauthenticated privacy toggle blocked (401)"

# Another user cannot affect this user's privacy (each /me is scoped to the JWT owner)
Invoke-API "$BASE/auth/me" "PATCH" @{ is_discoverable = 0 } -token $JWT2 | Out-Null
$meCheck = Invoke-API "$BASE/auth/me" -token $JWT
Assert-True ($meCheck.is_discoverable -eq 1 -or $meCheck.is_discoverable -eq $true) `
  "1.4 security: another user PATCH cannot alter this user is_discoverable"


# ============================================================
Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
$total = $global:PassCount + $global:FailCount
$color = if ($global:FailCount -eq 0) { "Green" } else { "Red" }
Write-Host ("  Results: {0}/{1} PASSED  |  {2} FAILED" -f $global:PassCount, $total, $global:FailCount) -ForegroundColor $color
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

if ($global:FailCount -gt 0) {
  Write-Host "  ACTION REQUIRED: Review FAIL items above." -ForegroundColor Red
  exit 1
} else {
  Write-Host "  All security checks passed." -ForegroundColor Green
  exit 0
}
