Add-Type -AssemblyName System.Drawing

$srcPath = "f:\MyRestoredProjects\GymLog\public\assets\stopwatch-stop-raw.png"
$dstPath = "f:\MyRestoredProjects\GymLog\public\assets\stopwatch-stop.png"

$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $src.Width
$height = $src.Height
$dst = New-Object System.Drawing.Bitmap($width, $height)

# Convert white background to transparent
for ($x = 0; $x -lt $width; $x++) {
    for ($y = 0; $y -lt $height; $y++) {
        $p = $src.GetPixel($x, $y)
        # Check if the pixel is white or very close to white
        if ($p.R -gt 240 -and $p.G -gt 240 -and $p.B -gt 240) {
            # Make it fully transparent
            $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            # Retain original pixel color
            $dst.SetPixel($x, $y, $p)
        }
    }
}

$src.Dispose()

if (Test-Path $dstPath) { Remove-Item $dstPath -Force }
$dst.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
$dst.Dispose()

Write-Host "Successfully converted white background to transparent and saved to $dstPath!"
