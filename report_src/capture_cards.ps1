$ab = "C:\Users\will0\AppData\Roaming\npm\agent-browser.cmd"
& $ab --session cards set viewport 1200 800 2>&1 | Out-Null
$items = @()
1..12 | ForEach-Object { $items += @{ id = ("{0:d2}" -f $_); file = ("card{0:d2}.html" -f $_) } }
$items += @{ id = "arch"; file = "architecture.html" }
foreach ($it in $items) {
  $url = "http://127.0.0.1:8899/report_src/chat/" + $it.file
  & $ab --session cards open $url 2>&1 | Out-Null
  Start-Sleep -Milliseconds 700
  $out = "assets/chat/" + $it.id + ".png"
  & $ab --session cards screenshot $out 2>&1 | Out-Null
  $f = Get-Item $out -ErrorAction SilentlyContinue
  if ($f) { Write-Output ("OK " + $out + " " + $f.Length) } else { Write-Output ("FAIL " + $out) }
}
