Add-Type -AssemblyName System.Drawing

$srcPath = "f:\MyRestoredProjects\GymLog\public\assets\stopwatch-ultra-clean-v3.png"
$dstPath = "f:\MyRestoredProjects\GymLog\public\assets\stopwatch-stop.png"

$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $src.Width
$height = $src.Height
$dst = New-Object System.Drawing.Bitmap($width, $height)

# Copy the original stopwatch image completely
for ($x = 0; $x -lt $width; $x++) {
    for ($y = 0; $y -lt $height; $y++) {
        $dst.SetPixel($x, $y, $src.GetPixel($x, $y))
    }
}
$src.Dispose()

# Bounding box of the central play triangle region to clear
# We want to clear both the green fill and its black outline completely
$minX = 170; $maxX = 330; $minY = 200; $maxY = 360

# Erase the green play button and its white/black outlines in the center, replacing with the white dial background
$dialColor = [System.Drawing.Color]::FromArgb(255, 245, 247, 248)

for ($x = $minX; $x -le $maxX; $x++) {
    for ($y = $minY; $y -le $maxY; $y++) {
        if ($x -ge 0 -and $x -lt $width -and $y -ge 0 -and $y -lt $height) {
            $p = $dst.GetPixel($x, $y)
            # Clear everything in the center play area to make a clean slate
            # We target the central circle region
            $dx = $x - 248
            $dy = $y - 278
            $dist = [Math]::Sqrt($dx*$dx + $dy*$dy)
            if ($dist -lt 85) {
                $dst.SetPixel($x, $y, $dialColor)
            }
        }
    }
}

# Graphics object to draw the sketchy stop square
$gfx = [System.Drawing.Graphics]::FromImage($dst)
$gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# Center coordinates of the central dial
$cx = 248
$cy = 278

# Square dimensions - make it fill the inner dial (diameter ~160px)
$size = 138
$half = $size / 2
$r = 28 # corner radius

# Neon Green fill color
$greenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 0, 230, 118))
$blackPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 10, 10, 10), 3.5)

# Helper function to generate a sketchy path for a rounded rectangle
function Get-SketchyPath {
    param($ox, $oy, $w, $h, $radius)
    
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    
    # We will generate a sequence of points along the rounded rect and add wobbly noise
    $points = New-Object System.Collections.Generic.List[System.Drawing.PointF]
    
    $steps = 8
    $randMax = 1.2
    
    # Helper to add a wobbly point
    $script:addWobblyPoint = {
        param($px, $py)
        $rx = $px + (Get-Random -Minimum (-$randMax) -Maximum $randMax)
        $ry = $py + (Get-Random -Minimum (-$randMax) -Maximum $randMax)
        $points.Add((New-Object System.Drawing.PointF($rx, $ry)))
    }
    
    # 1. Top line (left to right)
    for ($i = 0; $i -le $steps; $i++) {
        $t = $i / $steps
        $px = $ox + $radius + ($w - 2 * $radius) * $t
        $py = $oy
        &$script:addWobblyPoint $px $py
    }
    
    # 2. Top-right corner arc
    for ($i = 1; $i -le $steps; $i++) {
        $angle = -[Math]::PI / 2 + ([Math]::PI / 2) * ($i / $steps)
        $px = $ox + $w - $radius + $radius * [Math]::Cos($angle)
        $py = $oy + $radius + $radius * [Math]::Sin($angle)
        &$script:addWobblyPoint $px $py
    }
    
    # 3. Right line (top to bottom)
    for ($i = 1; $i -le $steps; $i++) {
        $t = $i / $steps
        $px = $ox + $w
        $py = $oy + $radius + ($h - 2 * $radius) * $t
        &$script:addWobblyPoint $px $py
    }
    
    # 4. Bottom-right corner arc
    for ($i = 1; $i -le $steps; $i++) {
        $angle = 0.0 + ([Math]::PI / 2) * ($i / $steps)
        $px = $ox + $w - $radius + $radius * [Math]::Cos($angle)
        $py = $oy + $h - $radius + $radius * [Math]::Sin($angle)
        &$script:addWobblyPoint $px $py
    }
    
    # 5. Bottom line (right to left)
    for ($i = 1; $i -le $steps; $i++) {
        $t = $i / $steps
        $px = $ox + $w - $radius - ($w - 2 * $radius) * $t
        $py = $oy + $h
        &$script:addWobblyPoint $px $py
    }
    
    # 6. Bottom-left corner arc
    for ($i = 1; $i -le $steps; $i++) {
        $angle = [Math]::PI / 2 + ([Math]::PI / 2) * ($i / $steps)
        $px = $ox + $radius + $radius * [Math]::Cos($angle)
        $py = $oy + $h - $radius + $radius * [Math]::Sin($angle)
        &$script:addWobblyPoint $px $py
    }
    
    # 7. Left line (bottom to top)
    for ($i = 1; $i -le $steps; $i++) {
        $t = $i / $steps
        $px = $ox
        $py = $oy + $h - $radius - ($h - 2 * $radius) * $t
        &$script:addWobblyPoint $px $py
    }
    
    # 8. Top-left corner arc
    for ($i = 1; $i -le $steps; $i++) {
        $angle = [Math]::PI + ([Math]::PI / 2) * ($i / $steps)
        $px = $ox + $radius + $radius * [Math]::Cos($angle)
        $py = $oy + $radius + $radius * [Math]::Sin($angle)
        &$script:addWobblyPoint $px $py
    }
    
    # Add first point at the end to close path
    $points.Add($points[0])
    
    $path.AddLines($points.ToArray())
    return $path
}

# Draw solid green background with a clean path first (so there are no white gaps inside)
$fillPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$fillPath.AddArc(($cx - $half), ($cy - $half), (2 * $r), (2 * $r), 180, 90)
$fillPath.AddArc(($cx + $half - 2 * $r), ($cy - $half), (2 * $r), (2 * $r), 270, 90)
$fillPath.AddArc(($cx + $half - 2 * $r), ($cy + $half - 2 * $r), (2 * $r), (2 * $r), 0, 90)
$fillPath.AddArc(($cx - $half), ($cy + $half - 2 * $r), (2 * $r), (2 * $r), 90, 90)
$fillPath.CloseAllFigures()
$gfx.FillPath($greenBrush, $fillPath)

# Overlay wobbly green fills slightly shifted to give it a hand-painted/textured look
for ($k = 0; $k -lt 2; $k++) {
    $wPath = Get-SketchyPath ($cx - $half) ($cy - $half) $size $size $r
    $gfx.FillPath($greenBrush, $wPath)
    $wPath.Dispose()
}

# Draw 3 wobbly black outline strokes to give it that organic sketchy pencil outline look!
for ($k = 0; $k -lt 3; $k++) {
    $outlinePath = Get-SketchyPath ($cx - $half) ($cy - $half) $size $size $r
    $gfx.DrawPath($blackPen, $outlinePath)
    $outlinePath.Dispose()
}

# Clean up
$gfx.Dispose()
$greenBrush.Dispose()
$blackPen.Dispose()
$fillPath.Dispose()

# Save the final masterpiece
if (Test-Path $dstPath) { Remove-Item $dstPath -Force }
$dst.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
$dst.Dispose()

Write-Host "Successfully generated sketchy stop button image and saved to $dstPath!"
