$ab = "C:\Users\will0\AppData\Roaming\npm\agent-browser.cmd"
$url = "https://railway-redesign.onrender.com/admin/railway/booking/7/change/"
$p = Start-Process -FilePath $ab -ArgumentList @("--session", "report", "open", $url) -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 12
& $ab --session report stop 2>&1 | Out-Null
Start-Sleep -Seconds 2
& $ab --session report screenshot "assets/impl/22-admin-booking-change.png" 2>&1 | Out-Null
if (Get-Process -Id $p.Id -ErrorAction SilentlyContinue) { Stop-Process -Id $p.Id -Force }
$f = Get-Item "assets/impl/22-admin-booking-change.png"
Write-Output ("size " + $f.Length)
& $ab --session report get url 2>&1
