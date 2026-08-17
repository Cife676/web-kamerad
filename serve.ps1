$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "=========================================================="
Write-Host "  🏕️ KAMERAD BASECAMP LOCAL SERVER RUNNING"
Write-Host "  🌐 URL: http://localhost:$port/"
Write-Host "=========================================================="

$folder = Get-Location

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $req = $context.Request
        $res = $context.Response
        $path = $req.Url.LocalPath
        if ($path -eq "/" -or [string]::IsNullOrWhiteSpace($path)) { $path = "/index.html" }
        $file = Join-Path $folder.Path $path.TrimStart('/').Replace('/', '\')
        if (Test-Path $file -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($file)
            $res.ContentLength64 = $bytes.Length
            $ext = [System.IO.Path]::GetExtension($file).ToLower()
            switch ($ext) {
                ".html" { $res.ContentType = "text/html; charset=utf-8" }
                ".css"  { $res.ContentType = "text/css" }
                ".js"   { $res.ContentType = "application/javascript" }
                ".jpg"  { $res.ContentType = "image/jpeg" }
                ".png"  { $res.ContentType = "image/png" }
                default { $res.ContentType = "application/octet-stream" }
            }
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $res.StatusCode = 404
        }
        $res.Close()
    } catch {}
}
