$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$root = Split-Path -Parent $PSScriptRoot
$inputs = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'huihui-audio-inputs.json') -Encoding UTF8 -Raw | ConvertFrom-Json
$voice = 'Microsoft Huihui Desktop'
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer

function Write-Recordings($entries, $folder) {
    $directory = Join-Path $root "public/audio/$folder"
    [System.IO.Directory]::CreateDirectory($directory) | Out-Null
    $manifestPath = Join-Path $directory 'manifest.json'
    $previousManifest = if (Test-Path -LiteralPath $manifestPath) {
        Get-Content -LiteralPath $manifestPath -Encoding UTF8 -Raw | ConvertFrom-Json
    }
    $files = [ordered]@{}
    foreach ($entry in $entries.PSObject.Properties) {
        $name = "$($entry.Name).wav"
        $path = Join-Path $directory $name
        $publicPath = "/audio/$folder/$name"
        $recording = $entry.Value
        $text = if ($recording -is [string]) { $recording } else { $recording.text }
        $phonemes = $recording.phonemes
        $prosody = $recording.prosody
        $keys = $recording.keys
        $previous = $previousManifest.files.($entry.Name)
        if ($previous.text -ceq $text -and $previous.path -ceq $publicPath -and
            $previous.phonemes -ceq $phonemes -and $previous.prosody -ceq $prosody -and
            ($previous.keys -join ' ') -ceq ($keys -join ' ') -and
            $previousManifest.voice -eq $voice -and $previousManifest.rate -eq $speaker.Rate -and
            (Test-Path -LiteralPath $path)) {
            $digest = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
            if ($digest -eq $previous.sha256) {
                $files[$entry.Name] = $previous
                continue
            }
        }
        $speaker.SetOutputToWaveFile($path)
        if ($phonemes -or $prosody) {
            $content = [Security.SecurityElement]::Escape($text)
            if ($phonemes) {
                $escapedPhonemes = [Security.SecurityElement]::Escape($phonemes)
                $content = "<phoneme alphabet=`"sapi`" ph=`"$escapedPhonemes`">$content</phoneme>"
            }
            if ($prosody) {
                $escapedProsody = [Security.SecurityElement]::Escape($prosody)
                $content = "<prosody rate=`"$escapedProsody`">$content</prosody>"
            }
            $speaker.SpeakSsml("<speak version=`"1.0`" xmlns=`"http://www.w3.org/2001/10/synthesis`" xml:lang=`"zh-CN`">$content</speak>")
        } else {
            $speaker.Speak($text)
        }
        $speaker.SetOutputToNull()
        if ((Get-Item -LiteralPath $path).Length -lt 1000) {
            throw "Empty speech output: $name"
        }
        $files[$entry.Name] = [ordered]@{
            text = $text
            path = $publicPath
            sha256 = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
        }
        if ($phonemes) { $files[$entry.Name]['phonemes'] = $phonemes }
        if ($prosody) { $files[$entry.Name]['prosody'] = $prosody }
        if ($keys) { $files[$entry.Name]['keys'] = $keys }
    }
    $manifest = [ordered]@{
        locale = 'zh-CN'
        provider = 'Windows System.Speech'
        voice = $voice
        synthetic = $true
        rate = $speaker.Rate
        files = $files
    }
    [System.IO.File]::WriteAllText(
        $manifestPath,
        ($manifest | ConvertTo-Json -Depth 5) + [Environment]::NewLine,
        (New-Object System.Text.UTF8Encoding($false))
    )
}

try {
    $speaker.SelectVoice($voice)
    $speaker.Rate = -1
    $speaker.Volume = 100
    Write-Recordings $inputs.words 'huihui'
    Write-Recordings $inputs.borrowed 'huihui-borrowed'
    Write-Recordings $inputs.pinyin 'huihui-pinyin'
} finally {
    $speaker.Dispose()
}
