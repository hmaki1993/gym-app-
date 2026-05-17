Add-Type -AssemblyName System.Drawing

$srcPath = "f:\MyRestoredProjects\GymLog\public\assets\check-raw.png"
$dstPath = "f:\MyRestoredProjects\GymLog\public\assets\check-custom.png"

$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $src.Width
$height = $src.Height
$dst = New-Object System.Drawing.Bitmap($width, $height)

for ($x = 0; $x -lt $width; $x++) {
    for ($y = 0; $y -lt $height; $y++) {
        $p = $src.GetPixel($x, $y)
        
        # Transparent or near-white background
        if ($p.A -eq 0 -or ($p.R -gt 240 -and $p.G -gt 240 -and $p.B -gt 240)) {
            $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            continue
        }

        # Calculate luminance
        $lum = ($p.R * 0.299 + $p.G * 0.587 + $p.B * 0.114) / 255.0
        
        # Tint to Our Orange (#FF8C00 / 255, 140, 0)
        $newR = [Math]::Min(255, [int](255 * $lum + 25))
        $newG = [Math]::Min(255, [int](140 * $lum + 15))
        $newB = [Math]::Min(255, [int](20 * $lum))

        $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($p.A, $newR, $newG, $newB))
    }
}

$src.Dispose()

if (Test-Path $dstPath) { Remove-Item $dstPath -Force }
$dst.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
$dst.Dispose()

Write-Host "Successfully tinted sketchy checkmark to ORANGE and saved to $dstPath!"
