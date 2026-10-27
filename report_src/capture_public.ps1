$ErrorActionPreference = "Continue"
$ab = "C:\Users\will0\AppData\Roaming\npm\agent-browser.cmd"
$pages = @(
  @{ url = "https://railway-redesign.onrender.com/"; file = "01-home-guest.png"; wait = 1500 },
  @{ url = "https://railway-redesign.onrender.com/search/"; file = "02-search-form.png"; wait = 1500 },
  @{ url = "https://railway-redesign.onrender.com/search/results/?from=%E8%87%BA%E5%8C%97&to=%E8%87%BA%E4%B8%AD&date=2026-10-28&discount=1"; file = "03-results.png"; wait = 2000 },
  @{ url = "https://railway-redesign.onrender.com/fares/"; file = "04-fares.png"; wait = 1500 },
  @{ url = "https://railway-redesign.onrender.com/status/"; file = "05-status.png"; wait = 1500 },
  @{ url = "https://railway-redesign.onrender.com/accounts/login/"; file = "06-login.png"; wait = 1500 }
)
foreach ($p in $pages) {
  & $ab --session report open $p.url 2>&1 | Out-Null
  Start-Sleep -Milliseconds $p.wait
  & $ab --session report screenshot ("assets/impl/" + $p.file) 2>&1 | Out-Null
  $f = Get-Item ("assets/impl/" + $p.file) -ErrorAction SilentlyContinue
  if ($f) { Write-Output ("OK " + $p.file + " " + $f.Length) } else { Write-Output ("FAIL " + $p.file) }
}
