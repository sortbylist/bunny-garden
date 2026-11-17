param(
    [Parameter(Mandatory = $true)][string]$Workspace,
    [Parameter(Mandatory = $true)][string]$Tasks
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$utf8 = New-Object System.Text.UTF8Encoding($false)
$items = [System.IO.File]::ReadAllText($Tasks, $utf8) | ConvertFrom-Json
$directory = Join-Path $Workspace 'public/audio/poetry'
[System.IO.Directory]::CreateDirectory($directory) | Out-Null
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice = 'Microsoft Huihui Desktop'
$manifest = [ordered]@{
    version = 1
    locale = 'zh-CN'
    provider = 'Windows System.Speech'
    voice = $voice
    synthetic = $true
    files = [ordered]@{}
}
try {
    $speaker.SelectVoice($voice)
    $speaker.Rate = -1
    $speaker.Volume = 100
    foreach ($item in $items) {
        if ($item.id -notmatch '^[a-z-]+$' -or [string]::IsNullOrWhiteSpace($item.text)) {
            throw 'Invalid poem audio task.'
        }
        $path = Join-Path $directory ($item.id + '.wav')
        $speaker.SetOutputToWaveFile($path)
        $speaker.Speak($item.text)
        $speaker.SetOutputToNull()
        if ((Get-Item -LiteralPath $path).Length -lt 1000) { throw 'Empty speech output.' }
        $hasher = [System.Security.Cryptography.SHA256]::Create()
        try {
            $hash = [System.BitConverter]::ToString($hasher.ComputeHash([System.IO.File]::ReadAllBytes($path))).Replace('-', '').ToLowerInvariant()
        } finally {
            $hasher.Dispose()
        }
        $manifest.files[$item.id] = [ordered]@{
            path = "/audio/poetry/$($item.id).wav"
            status = 'ready'
            text = $item.text
            sha256 = $hash
        }
        Write-Output "Generated $($item.id)"
    }
    [System.IO.File]::WriteAllText((Join-Path $directory 'manifest.json'), ($manifest | ConvertTo-Json -Depth 6), $utf8)
} finally {
    $speaker.Dispose()
}
