$ErrorActionPreference = 'Stop'
$taskRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$taskPackage = Join-Path $taskRoot 'ajaia-submission'
New-Item -ItemType Directory -Force -Path $taskPackage | Out-Null
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$taskZipPath = Join-Path $taskPackage 'source-code.zip'
$taskStream = [System.IO.File]::Open($taskZipPath, [System.IO.FileMode]::Create)
$taskZip = New-Object System.IO.Compression.ZipArchive($taskStream, [System.IO.Compression.ZipArchiveMode]::Create)
$taskManifest = New-Object System.Collections.Generic.List[string]
try {
  $taskFiles = @(& git -C $taskRoot ls-files --cached --others --exclude-standard)
  foreach ($taskRelative in ($taskFiles | Sort-Object -Unique)) {
    if ($taskRelative -match '(^|/)(node_modules|\.next|\.git|\.vercel|ajaia-submission|coverage)(/|$)' -or $taskRelative -match '\.tsbuildinfo$|\.log$|\.pem$|\.zip$' -or ($taskRelative -match '(^|/)\.env' -and $taskRelative -ne '.env.example')) { continue }
    $taskFull = [System.IO.Path]::GetFullPath((Join-Path $taskRoot $taskRelative))
    if (!$taskFull.StartsWith($taskRoot + [System.IO.Path]::DirectorySeparatorChar) -or !(Test-Path -LiteralPath $taskFull -PathType Leaf)) { continue }
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($taskZip, $taskFull, $taskRelative.Replace('\','/'), [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    $taskManifest.Add($taskRelative)
  }
} finally { $taskZip.Dispose(); $taskStream.Dispose() }
$taskManifest | Set-Content -Encoding UTF8 (Join-Path $taskPackage 'FILE_MANIFEST.txt')
$taskDocs = @('README.md','ARCHITECTURE.md','AI_WORKFLOW.md','SUBMISSION.md','VERIFICATION.md','verification-results.json','ASSESSMENT_RESPONSE.md','VIDEO_SCRIPT.md','walkthrough-video.txt','live-product-url.txt','github-repository-url.txt')
foreach ($taskDoc in $taskDocs) { Copy-Item -LiteralPath (Join-Path $taskRoot $taskDoc) -Destination (Join-Path $taskPackage $taskDoc) -Force }
Copy-Item -LiteralPath (Join-Path $taskRoot 'screenshots') -Destination $taskPackage -Recurse -Force
Write-Output "Prepared $taskPackage with $($taskManifest.Count) source files."
