Add-Type -AssemblyName System.Drawing

$srcPath = "f:\MyRestoredProjects\GymLog\public\assets\stopwatch-stop-raw.png"
$dstPath = "f:\MyRestoredProjects\GymLog\public\assets\stopwatch-stop.png"

$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $src.Width
$height = $src.Height
$dst = New-Object System.Drawing.Bitmap($width, $height)

# Center of the stopwatch in the 500x500 image
$cx = 250
$cy = 265

for ($x = 0; $x -lt $width; $x++) {
    for ($y = 0; $y -lt $height; $y++) {
        $p = $src.GetPixel($x, $y)
        
        # Calculate distance from center to handle background transparency
        $dx = $x - $cx
        $dy = $y - $cy
        $dist = [Math]::Sqrt($dx*$dx + $dy*$dy)
        
        # 1. Background transparency outside the sticker boundary (radius > 225)
        if ($dist -gt 225) {
            $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            continue
        }
        
        # 2. If it's a white background pixel outside the stopwatch body (radius > 200 and white)
        if ($dist -gt 200 -and $p.R -gt 235 -and $p.G -gt 235 -and $p.B -gt 235) {
            $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            continue
        }
        
        # 3. Identify and Tint the red/pink body pixels
        # Red/pink has high R, and G & B are significantly lower
        $isRed = ($p.R -gt 130 -and $p.R -gt ($p.G + 30) -and $p.R -gt ($p.B + 30))
        
        # 4. Identify and Tint the blue central dial pixels
        # Blue has high B, and R & G are significantly lower
        $isBlue = ($p.B -gt 130 -and $p.B -gt ($p.R + 25) -and $p.B -gt ($p.G + 15))
        
        # 5. Identify the pause bars (white/light-grey inside the central dial area)
        # Bounding box of the central dial: radius < 110, and color is white/light-grey
        $isPauseBar = ($dist -lt 95 -and $p.R -gt 215 -and $p.G -gt 215 -and $p.B -gt 215)
        
        # 6. Keep sketchy black borders black
        $isBlack = ($p.R -lt 85 -and $p.G -lt 85 -and $p.B -lt 85)
        
        if ($isBlack) {
            # Retain the black outline exactly
            $dst.SetPixel($x, $y, $p)
        }
        elseif ($isRed) {
            # Tint pink/red to our premium orange/brown:
            # Scale R slightly up, G significantly up, B down
            $newR = [Math]::Min(255, [int]($p.R * 1.06))
            $newG = [Math]::Min(255, [int]($p.G * 1.38))
            $newB = [Math]::Min(255, [int]($p.B * 0.35))
            $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($p.A, $newR, $newG, $newB))
        }
        elseif ($isBlue) {
            # Tint blue dial to our premium orange/brown:
            # Map original blue luminance to orange
            $newR = [Math]::Min(255, [int]($p.B * 1.03))
            $newG = [Math]::Min(255, [int]($p.G * 1.03))
            $newB = [Math]::Min(255, [int]($p.R * 0.60))
            $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($p.A, $newR, $newG, $newB))
        }
        elseif ($isPauseBar) {
            # Tint the pause bars to neon green (#00E676 / RGB: 0, 230, 118)
            # Retain the sketchy light/shading
            $newR = [Math]::Min(255, [int]($p.R * 0.0))
            $newG = [Math]::Min(255, [int]($p.G * 0.90))
            $newB = [Math]::Min(255, [int]($p.B * 0.46))
            $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($p.A, $newR, $newG, $newB))
        }
        else {
            # Keep other parts (like the white sticker boundary, metal ring, etc.)
            $dst.SetPixel($x, $y, $p)
        }
    }
}

$src.Dispose()

if (Test-Path $dstPath) { Remove-Item $dstPath -Force }
$dst.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
$dst.Dispose()

Write-Host "Successfully tinted sketchy stopwatch pause icon to match original orange/green and saved to $dstPath!"
