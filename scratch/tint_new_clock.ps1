Add-Type -AssemblyName System.Drawing

$srcPath = "f:\MyRestoredProjects\GymLog\scratch\original_user_clock.png"
$dstPath = "f:\MyRestoredProjects\GymLog\public\assets\clock-custom.png"

$src = [System.Drawing.Bitmap]::new($srcPath)
$dst = [System.Drawing.Bitmap]::new($src.Width, $src.Height)

for ($y = 0; $y -lt $src.Height; $y++) {
    for ($x = 0; $x -lt $src.Width; $x++) {
        $p = $src.GetPixel($x, $y)
        
        # Detect pinkish colors (R > 150, G < 140, B between 50 and 160)
        if ($p.A -gt 0 -and $p.R -gt 150 -and $p.G -lt 140 -and $p.B -gt 50 -and $p.B -lt 160) {
            # Let's map pink to orange perfectly
            # Main pink is R=255, G=88, B=118 -> Orange is R=255, G=140, B=0
            # Dark pink is R=230, G=72, B=93 -> Dark orange is R=230, G=114, B=0
            
            # Linear scaling based on Green component
            $scale = $p.G / 88.0
            if ($scale -gt 1.2) { $scale = 1.2 }
            
            $newR = $p.R
            $newG = [int](140 * $scale)
            if ($newG -gt 255) { $newG = 255 }
            $newB = 0
            
            $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($p.A, $newR, $newG, $newB))
        } else {
            # Keep original black borders, clock hands, face color, and transparency
            $dst.SetPixel($x, $y, $p)
        }
    }
}

$dst.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
$src.Dispose()
$dst.Dispose()

Write-Host "Success! Shaded orange clock saved to public/assets/clock-custom.png"
