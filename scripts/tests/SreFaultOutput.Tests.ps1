Describe 'SRE fault script terminal timestamps' {
    It '<scriptName> prefixes output with local and UTC time' -ForEach @(
        @{ scriptName = 'Invoke-SreRevisionFault.ps1' }
        @{ scriptName = 'Invoke-SrePortFault.ps1' }
    ) {
        $scriptPath = Join-Path $PSScriptRoot "..\$scriptName"
        $tokens = $null
        $parseErrors = $null
        $ast = [System.Management.Automation.Language.Parser]::ParseFile(
            $scriptPath,
            [ref]$tokens,
            [ref]$parseErrors
        )
        $parseErrors | Should -BeNullOrEmpty

        $writer = $ast.Find(
            { param($node) $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'Write-TimestampedHost' },
            $true
        )
        $writer | Should -Not -BeNullOrEmpty

        . ([scriptblock]::Create($writer.Extent.Text))
        $output = Write-TimestampedHost -Message 'test message' 6>&1 | Out-String

        $output | Should -Match '^\[Local: \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [+-]\d{2}:\d{2} \| UTC: \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC\] test message'
    }

    It '<scriptName> has no unguarded host output outside the timestamp helper' -ForEach @(
        @{ scriptName = 'Invoke-SreRevisionFault.ps1' }
        @{ scriptName = 'Invoke-SrePortFault.ps1' }
    ) {
        $scriptPath = Join-Path $PSScriptRoot "..\$scriptName"
        $tokens = $null
        $parseErrors = $null
        $ast = [System.Management.Automation.Language.Parser]::ParseFile(
            $scriptPath,
            [ref]$tokens,
            [ref]$parseErrors
        )
        $parseErrors | Should -BeNullOrEmpty

        $bareWrites = $ast.FindAll(
            {
                param($node)
                if ($node -isnot [System.Management.Automation.Language.CommandAst] -or
                    $node.GetCommandName() -ne 'Write-Host') {
                    return $false
                }

                $parent = $node.Parent
                while ($null -ne $parent -and $parent -isnot [System.Management.Automation.Language.FunctionDefinitionAst]) {
                    $parent = $parent.Parent
                }

                return $null -eq $parent -or $parent.Name -ne 'Write-TimestampedHost'
            },
            $true
        )

        $bareWrites | Should -BeNullOrEmpty
    }
}