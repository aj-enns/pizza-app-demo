#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Injects or recovers a controlled active-revision failure in the production Container App.
.EXAMPLE
    ./scripts/Invoke-SreRevisionFault.ps1 -Mode Inject
.EXAMPLE
    ./scripts/Invoke-SreRevisionFault.ps1 -Mode Recover
.EXAMPLE
    ./scripts/Invoke-SreRevisionFault.ps1 -Mode Inject -WhatIf
#>

[CmdletBinding(SupportsShouldProcess, ConfirmImpact = 'High')]
param(
    [Parameter(Mandatory)]
    [ValidateSet('Inject', 'Recover')]
    [string]$Mode,

    [string]$SubscriptionId = '1b2c6be0-ed07-4512-b69c-8c080c09c608',

    [string]$ResourceGroupName = 'rg-pizza-app-demo',

    [string]$AppName = 'pizzaapp',

    [string]$StatePath = (Join-Path ([System.IO.Path]::GetTempPath()) 'pizzaapp-sre-revision-fault.json')
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
        '--query', '{fqdn:properties.configuration.ingress.fqdn,revisionMode:properties.configuration.activeRevisionsMode}',
        '--output', 'json',
        '--only-show-errors'
    )

    return $json | ConvertFrom-Json
}

function Get-ActiveRevisions {
    $json = Invoke-AzureCli -CommandArguments @(
        'containerapp', 'revision', 'list',
        '--name', $AppName,
        '--resource-group', $ResourceGroupName,
        '--subscription', $SubscriptionId,
        '--query', '[?properties.active].{name:name,runningState:properties.runningState}',
        '--output', 'json',
        '--only-show-errors'
    )

    return $json | ConvertFrom-Json
}

function Set-RevisionState {
    param(
        [Parameter(Mandatory)]
        [string]$RevisionName,

        [Parameter(Mandatory)]
        [ValidateSet('activate', 'deactivate')]
        [string]$Action
    )

    $null = Invoke-AzureCli -CommandArguments @(
        'containerapp', 'revision', $Action,
        '--name', $AppName,
        '--revision', $RevisionName,
        '--resource-group', $ResourceGroupName,
        '--subscription', $SubscriptionId,
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

if ($Mode -eq 'Inject') {
    $activeRevisions = @(Get-ActiveRevisions)
    if ($activeRevisions.Count -ne 1) {
        throw "Expected exactly one active revision but found $($activeRevisions.Count). No changes were made."
    }

    if (Test-Path $StatePath) {
        throw "State file $StatePath already exists. Run recovery or remove the stale state after verifying the app manually."
    }

    $revisionName = [string]$activeRevisions[0].name
    $action = "deactivate revision $revisionName and stop its running replicas"
    if (-not $PSCmdlet.ShouldProcess("$AppName in $ResourceGroupName", $action)) {
        return
    }

    [pscustomobject]@{
        subscriptionId = $SubscriptionId
        resourceGroupName = $ResourceGroupName
        appName = $AppName
        revisionName = $revisionName
        revisionMode = $appInfo.revisionMode
        injectedAtUtc = [DateTime]::UtcNow.ToString('o')
    } | ConvertTo-Json | Set-Content -Path $StatePath -Encoding utf8

    Set-RevisionState -RevisionName $revisionName -Action deactivate
    Write-TimestampedHost -Message "Fault injected. Revision $revisionName was deactivated." -ForegroundColor Red
    Write-TimestampedHost -Message "Recovery state was saved to $StatePath."
    Write-EndpointStatus -Fqdn $appInfo.fqdn
    Write-TimestampedHost -Message "Recover with: ./scripts/Invoke-SreRevisionFault.ps1 -Mode Recover"
    return
}

if (-not (Test-Path $StatePath)) {
    throw "No recovery state found at $StatePath. Refusing to guess which revision to activate."
}

$state = Get-Content -Path $StatePath -Raw | ConvertFrom-Json
if ($state.subscriptionId -ne $SubscriptionId -or
    $state.resourceGroupName -ne $ResourceGroupName -or
    $state.appName -ne $AppName) {
    throw "State file $StatePath belongs to a different Container App."
}

$revisionName = [string]$state.revisionName
$action = "reactivate revision $revisionName and restore serving replicas"
if (-not $PSCmdlet.ShouldProcess("$AppName in $ResourceGroupName", $action)) {
    return
}

Set-RevisionState -RevisionName $revisionName -Action activate
Remove-Item -Path $StatePath

Write-TimestampedHost -Message "Recovery requested. Revision $revisionName was activated." -ForegroundColor Green
Write-EndpointStatus -Fqdn $appInfo.fqdn