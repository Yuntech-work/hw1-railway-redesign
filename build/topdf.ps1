$ErrorActionPreference = "Stop"
$src = Get-ChildItem -Path (Join-Path $PSScriptRoot "..\output") -Filter "*.docx" | Select-Object -First 1
if (-not $src) { throw "docx not found" }
$pdf = [System.IO.Path]::ChangeExtension($src.FullName, ".pdf")

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    $doc = $word.Documents.Open($src.FullName, [ref]$false, [ref]$true)
    $doc.Repaginate()
    Write-Output ("PAGES: " + $doc.ComputeStatistics(2))   # wdStatisticPages
    Write-Output ("WORDS: " + $doc.ComputeStatistics(0))
    $doc.ExportAsFixedFormat($pdf, 17)                     # wdExportFormatPDF
    $doc.Close([ref]$false)
    Write-Output ("PDF: " + $pdf)
} finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}