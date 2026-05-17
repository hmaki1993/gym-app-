Add-Type -AssemblyName System.Drawing

$srcPath = "f:\MyRestoredProjects\GymLog\public\assets\stopwatch-ultra-clean-v3.png"
$dstPath = "f:\MyRestoredProjects\GymLog\public\assets\stopwatch-stop.png"

$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $src.Width
$height = $src.Height

$dst = New-Object System.Drawing.Bitmap($width, $height)

# Copy every pixel from source
for ($x = 0; $x -lt $width; $x++) {
    for ($y = 0; $y -lt $height; $y++) {
        $dst.SetPixel($x, $y, $src.GetPixel($x, $y))
    }
}
$src.Dispose()

# Find the green pixels (play triangle) region to determine center
$minGX = $width; $maxGX = 0; $minGY = $height; $maxGY = 0
for ($x = 0; $x -lt $width; $x++) {
    for ($y = 0; $y -lt $height; $y++) {
        $p = $dst.GetPixel($x, $y)
        if ($p.A -gt 50 -and $p.G -gt 150 -and $p.G -gt ($p.R + 40) -and $p.G -gt ($p.B + 40)) {
            if ($x -lt $minGX) { $minGX = $x }
            if ($x -gt $maxGX) { $maxGX = $x }
            if ($y -lt $minGY) { $minGY = $y }
            if ($y -gt $maxGY) { $maxGY = $y }
        }
    }
}

Write-Host "Green region: X=$minGX to $maxGX, Y=$minGY to $maxGY"

$cx = [int](($minGX + $maxGX) / 2)
$cy = [int](($minGY + $maxGY) / 2)
$regionW = $maxGX - $minGX
$regionH = $maxGY - $minGY

Write-Host "Center: $cx, $cy, RegionW: $regionW, RegionH: $regionH"

# Step 1: Erase all green pixels in that region (replace with transparent)
for ($x = ($minGX - 5); $x -le ($maxGX + 5); $x++) {
    for ($y = ($minGY - 5); $y -le ($maxGY + 5); $y++) {
        if ($x -ge 0 -and $x -lt $width -and $y -ge 0 -and $y -lt $height) {
            $p = $dst.GetPixel($x, $y)
            if ($p.A -gt 50 -and $p.G -gt 150 -and $p.G -gt ($p.R + 30) -and $p.G -gt ($p.B + 30)) {
                $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            }
        }
    }
}

# Step 2: Draw the stop square in the same region
# Make it 60% of the region size, centered
$squareSize = [int]($regionW * 0.75)
$halfSq = [int]($squareSize / 2)
$cornerRadius = [int]($squareSize * 0.20)

$greenColor = [System.Drawing.Color]::FromArgb(255, 0, 230, 118)
$blackColor = [System.Drawing.Color]::FromArgb(255, 0, 0, 0)

# Draw with Graphics for smooth rounded rect
$gfx = [System.Drawing.Graphics]::FromImage($dst)
$gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# Draw black border (slightly bigger)
$borderSize = $squareSize + 6
$bx = $cx - [int]($borderSize / 2)
$by = $cy - [int]($borderSize / 2)
$borderBrush = New-Object System.Drawing.SolidBrush($blackColor)
$borderPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$borderPath.AddRoundedRectangle = $null

# Use FillRoundedRectangle approach manually
$bCorner = $cornerRadius + 4
Add-Type -TypeDefinition @"
using System.Drawing;
using System.Drawing.Drawing2D;
public static class DrawHelper {
    public static void FillRoundRect(Graphics g, Brush brush, int x, int y, int w, int h, int radius) {
        GraphicsPath path = new GraphicsPath();
        path.AddArc(x, y, radius*2, radius*2, 180, 90);
        path.AddArc(x + w - radius*2, y, radius*2, radius*2, 270, 90);
        path.AddArc(x + w - radius*2, y + h - radius*2, radius*2, radius*2, 0, 90);
        path.AddArc(x, y + h - radius*2, radius*2, radius*2, 90, 90);
        path.CloseFigure();
        g.FillPath(brush, path);
    }
}
"@

# Black border
[DrawHelper]::FillRoundRect($gfx, $borderBrush, ($cx - [int]($borderSize/2)), ($cy - [int]($borderSize/2)), $borderSize, $borderSize, $bCorner)

# Green fill
$greenBrush = New-Object System.Drawing.SolidBrush($greenColor)
[DrawHelper]::FillRoundRect($gfx, $greenBrush, ($cx - $halfSq), ($cy - $halfSq), $squareSize, $squareSize, $cornerRadius)

$gfx.Dispose()

if (Test-Path $dstPath) { Remove-Item $dstPath -Force }
$dst.Save($dstPath)
$dst.Dispose()

Write-Host "Saved to $dstPath"
