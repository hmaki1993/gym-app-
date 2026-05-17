Add-Type -AssemblyName System.Drawing

$srcPath = "f:\MyRestoredProjects\GymLog\scratch\test12.png"
$dstPath = "f:\MyRestoredProjects\GymLog\public\assets\clock-custom.png"

$src = [System.Drawing.Bitmap]::new($srcPath)
$dst = [System.Drawing.Bitmap]::new($src.Width, $src.Height)

for ($y = 0; $y -lt $src.Height; $y++) {
    for ($x = 0; $x -lt $src.Width; $x++) {
        $p = $src.GetPixel($x, $y)
        
        # Replace pink (#FF7D97 and similar shades) with orange (#FF8C00)
        # Pink typically has high Red, and Green/Blue around 100-160
        if ($p.R -gt 200 -and $p.G -lt 160 -and $p.B -gt 100 -and $p.B -lt 180) {
            # Map pink to orange: #FF8C00 (R=255, G=140, B=0)
            $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($p.A, 255, 140, 0))
        } else {
            # Keep original black, white, or transparent pixels
            $dst.SetPixel($x, $y, $p)
        }
    }
}

$dst.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
$src.Dispose()
$dst.Dispose()

Write-Host "Success! Tinted play button saved to public/assets/clock-custom.png"
