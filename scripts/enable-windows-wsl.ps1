#Requires -RunAsAdministrator
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string]$InstallerDirectory = (Join-Path $env:USERPROFILE 'Downloads\MilestoneTrust-setup')
)

$ErrorActionPreference = 'Stop'
$taskMsi = Join-Path $InstallerDirectory 'wsl.2.7.8.0.x64.msi'
$taskExpectedHash = '928506b99d6caad14e5a8938e3e3fd9d1c839df3ed4f40639bdb095fbf24cbf8'

# This version matches the Store package observed on the development machine.
# Source and digest: microsoft/WSL release 2.7.8, not a third-party repair tool.
if (-not (Test-Path -LiteralPath $taskMsi -PathType Leaf)) {
    throw "Missing official WSL installer: $taskMsi. See docs/WINDOWS_SETUP_VI.md."
}
if ((Get-FileHash -LiteralPath $taskMsi -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskExpectedHash) {
    throw 'WSL installer SHA256 mismatch. Installation stopped.'
}
$taskSignature = Get-AuthenticodeSignature -LiteralPath $taskMsi
if ($taskSignature.Status -ne 'Valid' -or $taskSignature.SignerCertificate.Subject -notmatch 'O=Microsoft Corporation') {
    throw 'WSL installer is not signed by Microsoft. Installation stopped.'
}

$taskRestartNeeded = $false
$taskFeature = Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform
Write-Host "VirtualMachinePlatform: $($taskFeature.State)"
if ($taskFeature.State -eq 'EnablePending') { $taskRestartNeeded = $true }
if ($taskFeature.State -eq 'Disabled' -and $PSCmdlet.ShouldProcess('Windows VirtualMachinePlatform', 'Enable without automatic restart')) {
    $taskResult = Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -All -NoRestart
    $taskRestartNeeded = $taskRestartNeeded -or $taskResult.RestartNeeded
}

$taskWslExe = Join-Path $env:ProgramFiles 'WSL\wsl.exe'
$taskWslService = Get-Service -Name WslService -ErrorAction SilentlyContinue
if (-not (Test-Path -LiteralPath $taskWslExe) -or -not $taskWslService) {
    if ($PSCmdlet.ShouldProcess('Microsoft WSL 2.7.8', 'Install official MSI without automatic restart')) {
        $taskLog = Join-Path $InstallerDirectory 'wsl-install.log'
        $taskArguments = @('/i', ('"{0}"' -f $taskMsi), '/passive', '/norestart', '/l*v', ('"{0}"' -f $taskLog))
        $taskProcess = Start-Process -FilePath 'msiexec.exe' -ArgumentList $taskArguments -WindowStyle Hidden -Wait -PassThru
        if ($taskProcess.ExitCode -notin @(0, 3010)) {
            throw "WSL MSI exited with code $($taskProcess.ExitCode). Review $taskLog."
        }
        $taskRestartNeeded = $taskRestartNeeded -or $taskProcess.ExitCode -eq 3010
        if (-not (Get-Service -Name WslService -ErrorAction SilentlyContinue)) {
            throw "WSL service is still missing. Review $taskLog before continuing."
        }
    }
} else {
    Write-Host 'WSL executable and service already exist; MSI install skipped.'
}

Write-Host "Restart required by these changes: $taskRestartNeeded"
Write-Host 'Save your work before restarting Windows yourself. This script does not restart Windows.'
Write-Host 'After restart, return to the chat to install Docker Desktop and continue Tide enrollment.'
