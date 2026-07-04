# ============================================================
# AI Grading Service - Test Script
# Usage:  powershell -ExecutionPolicy Bypass -File test_grading.ps1
# Both AI1 (:3000) and Backend (:5000) must already be running.
# ============================================================

$ReturnId   = "ITEM-ELEC-1"
$BackendUrl = "http://localhost:5000"
$TestDir    = "c:\Amazon_HackON\test"

# 1. Health checks
Write-Host ""
Write-Host "[1/4] Checking services..." -ForegroundColor Cyan
try {
    $h1 = Invoke-WebRequest "$BackendUrl/health" -UseBasicParsing -ErrorAction Stop
    Write-Host "  OK  Backend: $($h1.Content)"
} catch {
    Write-Host "  FAIL Backend is NOT running on port 5000" -ForegroundColor Red
    exit 1
}
try {
    $h2 = Invoke-WebRequest "http://localhost:3000/health" -UseBasicParsing -ErrorAction Stop
    Write-Host "  OK  AI1:     $($h2.Content)"
} catch {
    Write-Host "  FAIL AI1 is NOT running on port 3000" -ForegroundColor Red
    exit 1
}

# 2. Build multipart body
Write-Host ""
Write-Host "[2/4] Submitting photos (Return ID: $ReturnId)..." -ForegroundColor Cyan

$boundary  = "----FormBoundary$(Get-Random)"
$CRLF      = "`r`n"
$bodyBytes = [System.Collections.Generic.List[byte]]::new()
$enc       = [System.Text.Encoding]::UTF8

$views = @("front","back","left","right","closeup_1")
foreach ($view in $views) {
    $fileName = if ($view -eq "closeup_1") { "onfile.jpeg" } else { "$view.jpeg" }
    $path = Join-Path $TestDir $fileName
    if (-not (Test-Path $path)) {
        Write-Host "  WARN Missing test photo: $path - skipping"
        continue
    }
    $header  = "--$boundary$CRLF"
    $header += "Content-Disposition: form-data; name=`"$view`"; filename=`"$fileName`"$CRLF"
    $header += "Content-Type: image/jpeg$CRLF$CRLF"
    $bodyBytes.AddRange($enc.GetBytes($header))
    $bodyBytes.AddRange([System.IO.File]::ReadAllBytes($path))
    $bodyBytes.AddRange($enc.GetBytes($CRLF))
    $kb = [math]::Round((Get-Item $path).Length / 1KB)
    Write-Host "  Added $view ($kb KB)"
}

# Add conditionAnswers
$header  = "--$boundary$CRLF"
$header += "Content-Disposition: form-data; name=`"conditionAnswers`"$CRLF$CRLF"
$header += '{"coreFunction":"yes","completeness":"yes","structure":"yes","usage":"yes","originality":"yes"}' + $CRLF
$bodyBytes.AddRange($enc.GetBytes($header))

$bodyBytes.AddRange($enc.GetBytes("--$boundary--$CRLF"))

# 3. Submit
try {
    $submitResp = Invoke-WebRequest `
        -Uri "$BackendUrl/api/grading/$ReturnId/submit" `
        -Method POST `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Body $bodyBytes.ToArray() `
        -UseBasicParsing -ErrorAction Stop

    $submitted = $submitResp.Content | ConvertFrom-Json
    Write-Host ""
    Write-Host "  Submitted! requestId=$($submitted.requestId) status=$($submitted.status)" -ForegroundColor Green
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host ""
    Write-Host "  FAIL Submit returned HTTP $code" -ForegroundColor Red
    try {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        Write-Host "  Body: $($reader.ReadToEnd())"
    } catch {}
    exit 1
}

# 4. Poll
Write-Host ""
Write-Host "[3/4] Waiting for AI grading..." -ForegroundColor Cyan

$maxPolls = 72
$pollMs   = 2500
$done     = $false

for ($i = 0; $i -lt $maxPolls; $i++) {
    Start-Sleep -Milliseconds $pollMs
    try {
        $statusResp = Invoke-WebRequest "$BackendUrl/api/grading/$ReturnId/status" -UseBasicParsing -ErrorAction Stop
        $statusObj  = $statusResp.Content | ConvertFrom-Json
        $elapsed    = [math]::Round(($i + 1) * $pollMs / 1000)
        $pct        = if ($statusObj.progress) { "$($statusObj.progress)%" } else { "" }
        Write-Host "  [${elapsed}s] $($statusObj.status) $pct"

        if ($statusObj.status -eq "COMPLETED") { $done = $true; break }
        if ($statusObj.status -eq "FAILED") {
            Write-Host ""
            Write-Host "  FAIL Grading FAILED: $($statusObj.failureReason)" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "  WARN status poll error: $_"
    }
}

if (-not $done) {
    Write-Host ""
    Write-Host "  TIMEOUT waiting for grading result." -ForegroundColor Yellow
    exit 1
}

# 5. Result
Write-Host ""
Write-Host "[4/4] Fetching result..." -ForegroundColor Cyan

try {
    $resultResp = Invoke-WebRequest "$BackendUrl/api/grading/$ReturnId/result" -UseBasicParsing -ErrorAction Stop
    $result     = $resultResp.Content | ConvertFrom-Json
    $r          = $result.report

    Write-Host ""
    Write-Host "  ================================================" -ForegroundColor Green
    Write-Host "  AI GRADING COMPLETE" -ForegroundColor Green
    Write-Host "  ================================================" -ForegroundColor Green
    Write-Host "  Grade:       $($r.grade)  ($($r.condition))"
    Write-Host "  Score:       $($r.overallScore)"
    Write-Host "  Confidence:  $([math]::Round($r.overallConfidence * 100))%"
    Write-Host "  Model:       $($r.modelUsed)"
    Write-Host "  Summary:     $($r.summary)"
    Write-Host ""

    if ($r.damages -and $r.damages.Count -gt 0) {
        Write-Host "  Damages ($($r.damages.Count)):"
        foreach ($d in $r.damages) {
            Write-Host "    [$($d.severity)] $($d.type) on $($d.view): $($d.description)"
        }
    } else {
        Write-Host "  No damages detected."
    }
    Write-Host "  ================================================" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "  FAIL Could not fetch result: $_" -ForegroundColor Red
    exit 1
}
