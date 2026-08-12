#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Injects or recovers a controlled ingress-port failure in the production Container App.
.EXAMPLE
    ./scripts/Invoke-SrePortFault.ps1 -Mode Inject
.EXAMPLE
    ./scripts/Invoke-SrePortFault.ps1 -Mode Recover
.EXAMPLE
    ./scripts/Invoke-SrePortFault.ps1 -Mode Inject -WhatIf
#>

[CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'High')]
param(
    [Parameter(Mandatory)]
    [ValidateSet('Inject', 'Recover')]
    [string]$Mode,

    [string]$SubscriptionId = '1b2c6be0-ed07-4512-b69c-8c080c09c608',

    [string]$ResourceGroupName = 'rg-pizza-app-demo',

    [string]$AppName = 'pizzaapp',

    [ValidateRange(1, 65535)]
    [int]$FaultPort = 3999,

    [ValidateRange(1, 65535)]
    [int]$HealthyPort = 3000,

    [string]$StatePath = (Join-Path ([System.IO.Path]::GetTempPath()) 'pizzaapp-sre-port-fault.json')
)

$ErrorActionPreference = 'Stop'

function Write-TimestampedHost {
    param(
        [Parameter(Mandatory)]
        [string]$Message,

        [ConsoleColor]$ForegroundColor
    )

    $now = [DateTimeOffset]::Now
    $timestamp = '[Local: {0} | UTC: {1}]' -f `
        $now.ToString('yyyy-MM-dd HH:mm:ss zzz'),
        $now.UtcDateTime.ToString("yyyy-MM-dd HH:mm:ss 'UTC'")

    if ($PSBoundParameters.ContainsKey('ForegroundColor')) {
        Write-Host "$timestamp $Message" -ForegroundColor $ForegroundColor
        return
    }

    Write-Host "$timestamp $Message"
}

function Invoke-AzureCli {
    param(
        [Parameter(Mandatory)]
        [string[]]$CommandArguments
    )

    $output = & az @CommandArguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Azure CLI failed: $($output | Out-String)"
    }

    return ($output | Out-String).Trim()
}

function Get-ContainerAppInfo {
    $json = Invoke-AzureCli -CommandArguments @(
        'containerapp', 'show',
        '--name', $AppName,
        '--resource-group', $ResourceGroupName,
        '--subscription', $SubscriptionId,
        '--query', '{fqdn:properties.configuration.ingress.fqdn,targetPort:properties.configuration.ingress.targetPort}',
        '--output', 'json',
        '--only-show-errors'
    )

    return $json | ConvertFrom-Json
}

function Set-IngressTargetPort {
    param(
        [Parameter(Mandatory)]
        [int]$TargetPort
    )

    $null = Invoke-AzureCli -CommandArguments @(
        'containerapp', 'ingress', 'update',
        '--name', $AppName,
        '--resource-group', $ResourceGroupName,
        '--subscription', $SubscriptionId,
        '--target-port', $TargetPort.ToString(),
        '--output', 'none',
        '--only-show-errors'
    )
}

function Write-EndpointStatus {
    param(
        [Parameter(Mandatory)]
        [string]$Fqdn
    )

    $endpoint = "https://$Fqdn/api/menu"
    try {
        $response = Invoke-WebRequest -Uri $endpoint -SkipHttpErrorCheck -TimeoutSec 15
        Write-TimestampedHost -Message "Endpoint: $endpoint -> HTTP $($response.StatusCode)"
    }
    catch {
        Write-TimestampedHost -Message "Endpoint: $endpoint -> request failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw 'Azure CLI was not found. Install it and run az login before using this script.'
}

$appInfo = Get-ContainerAppInfo
$currentPort = [int]$appInfo.targetPort

if ($Mode -eq 'Inject') {
    if ($FaultPort -eq $HealthyPort) {
        throw 'FaultPort must differ from HealthyPort.'
    }

    if ($currentPort -eq $FaultPort) {
        Write-TimestampedHost -Message "Fault is already active: target port is $FaultPort." -ForegroundColor Yellow
        Write-EndpointStatus -Fqdn $appInfo.fqdn
        return
    }

    $action = "change ingress target port from $currentPort to $FaultPort and cause HTTP 502 responses"
    if (-not $PSCmdlet.ShouldProcess("$AppName in $ResourceGroupName", $action)) {
        return
    }

    [pscustomobject]@{
        subscriptionId = $SubscriptionId
        resourceGroupName = $ResourceGroupName
        appName = $AppName
        originalPort = $currentPort
        faultPort = $FaultPort
        injectedAtUtc = [DateTime]::UtcNow.ToString('o')
    } | ConvertTo-Json | Set-Content -Path $StatePath -Encoding utf8

    Set-IngressTargetPort -TargetPort $FaultPort
    Write-TimestampedHost -Message "Fault injected. Original port $currentPort was saved to $StatePath." -ForegroundColor Red
    Write-EndpointStatus -Fqdn $appInfo.fqdn
    Write-TimestampedHost -Message "Recover with: ./scripts/Invoke-SrePortFault.ps1 -Mode Recover"
    return
}

$restorePort = $HealthyPort
if (Test-Path $StatePath) {
    $state = Get-Content -Path $StatePath -Raw | ConvertFrom-Json
    if ($state.subscriptionId -ne $SubscriptionId -or
        $state.resourceGroupName -ne $ResourceGroupName -or
        $state.appName -ne $AppName) {
        throw "State file $StatePath belongs to a different Container App."
    }

    $restorePort = [int]$state.originalPort
}
else {
    Write-TimestampedHost -Message "No saved state found. Falling back to HealthyPort $HealthyPort." -ForegroundColor Yellow
}

if ($currentPort -eq $restorePort) {
    Write-TimestampedHost -Message "App is already configured for target port $restorePort." -ForegroundColor Green
    if (Test-Path $StatePath) {
        Remove-Item -Path $StatePath
    }
    Write-EndpointStatus -Fqdn $appInfo.fqdn
    return
}

$action = "restore ingress target port from $currentPort to $restorePort"
if (-not $PSCmdlet.ShouldProcess("$AppName in $ResourceGroupName", $action)) {
    return
}

Set-IngressTargetPort -TargetPort $restorePort
if (Test-Path $StatePath) {
    Remove-Item -Path $StatePath
}

Write-TimestampedHost -Message "Recovery requested. Target port restored to $restorePort." -ForegroundColor Green
Write-EndpointStatus -Fqdn $appInfo.fqdn