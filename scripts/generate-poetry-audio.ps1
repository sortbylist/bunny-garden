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
$manifestPath = Join-Path $directory 'manifest.json'
$previousManifest = if (Test-Path -LiteralPath $manifestPath) {
    [System.IO.File]::ReadAllText($manifestPath, $utf8) | ConvertFrom-Json
}
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

function Get-WaveHash([byte[]]$bytes) {
    $hasher = [System.Security.Cryptography.SHA256]::Create()
    try {
        return [System.BitConverter]::ToString($hasher.ComputeHash($bytes)).Replace('-', '').ToLowerInvariant()
    } finally {
        $hasher.Dispose()
    }
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
        $publicPath = "/audio/poetry/$($item.id).wav"
        $previous = $previousManifest.files.($item.id)
        if ($previousManifest.voice -eq $voice -and $previous.status -eq 'ready' -and
            $previous.path -ceq $publicPath -and $previous.text -ceq $item.text -and
            $previous.ssml -ceq $item.ssml -and (Test-Path -LiteralPath $path)) {
            $digest = Get-WaveHash ([System.IO.File]::ReadAllBytes($path))
            if ($digest -eq $previous.sha256) {
                $manifest.files[$item.id] = $previous
                continue
            }
        }
        $recording = New-Object System.IO.MemoryStream
        try {
            $speaker.SetOutputToWaveStream($recording)
            if ($item.ssml) { $speaker.SpeakSsml($item.ssml) } else { $speaker.Speak($item.text) }
            $speaker.SetOutputToNull()
            $bytes = $recording.ToArray()
        } finally {
            $recording.Dispose()
        }
        if ($bytes.Length -lt 1000) { throw 'Empty speech output.' }
        [System.IO.File]::WriteAllBytes($path, $bytes)
        $manifest.files[$item.id] = [ordered]@{
            path = $publicPath
            status = 'ready'
            text = $item.text
            sha256 = Get-WaveHash $bytes
        }
        if ($item.ssml) { $manifest.files[$item.id]['ssml'] = $item.ssml }
        Write-Output "Generated $($item.id)"
    }
    [System.IO.File]::WriteAllText($manifestPath, ($manifest | ConvertTo-Json -Depth 6), $utf8)
} finally {
    $speaker.Dispose()
}
