Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("f:\MyRestoredProjects\GymLog\public\assets\stopwatch-ultra-clean-v3.png")
Write-Host "Image Size: $($img.Width) x $($img.Height)"

$darkCount = 0
$blackCount = 0
$transparentCount = 0
$otherCount = 0

for ($x = 0; $x -lt $img.Width; $x++) {
    for ($y = 0; $y -lt $img.Height; $y++) {
        $p = $img.GetPixel($x, $y)
        if ($p.A -eq 0) {
            $transparentCount++
        } else {
            $r = $p.R
            $g = $p.G
            $b = $p.B
            if ($r -ge 10 -and $r -le 65 -and [Math]::Abs($r - $g) -lt 8 -and [Math]::Abs($r - $b) -lt 8) {
                $darkCount++
            }
            elseif ($r -eq 0 -and $g -eq 0 -and $b -eq 0) {
                $blackCount++
            }
            else {
                $otherCount++
            }
        }
    }
}
$img.Dispose()

Write-Host "Transparent pixels: $transparentCount"
Write-Host "Dark grey pixels: $darkCount"
Write-Host "Pure black pixels: $blackCount"
Write-Host "Other pixels (colored): $otherCount"
