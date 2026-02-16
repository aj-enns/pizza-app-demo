#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Runs the full test suite: build, lint, and TypeScript type checking.
.DESCRIPTION
    Executes npm build (which includes TypeScript compilation and linting),
    ESLint, and Jest tests. Exits with a non-zero code if any step fails.
#>

$ErrorActionPreference = 'Stop'
$exitCode = 0

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Running Lint" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nLint FAILED" -ForegroundColor Red
    $exitCode = 1
} else {
    Write-Host "`nLint PASSED" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Running TypeScript Type Check" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nTypeScript Type Check FAILED" -ForegroundColor Red
    $exitCode = 1
} else {
    Write-Host "`nTypeScript Type Check PASSED" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Running Build" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$env:NEXT_LINT_DURING_BUILD = '0'
$env:NEXT_TYPECHECK_DURING_BUILD = '0'
npm run build
$env:NEXT_LINT_DURING_BUILD = $null
$env:NEXT_TYPECHECK_DURING_BUILD = $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nBuild FAILED" -ForegroundColor Red
    $exitCode = 1
} else {
    Write-Host "`nBuild PASSED" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Running Tests" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

npm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nTests FAILED" -ForegroundColor Red
    $exitCode = 1
} else {
    Write-Host "`nTests PASSED" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
if ($exitCode -eq 0) {
    Write-Host " All checks PASSED" -ForegroundColor Green
} else {
    Write-Host " Some checks FAILED" -ForegroundColor Red
}
Write-Host "========================================`n" -ForegroundColor Cyan

exit $exitCode
