Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Drawing.Common

$srcPath = "f:\MyRestoredProjects\GymLog\public\assets\stopwatch-ultra-clean-v3.png"
$dstPath = "f:\MyRestoredProjects\GymLog\public\assets\stopwatch-stop.png"

$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $src.Width
$height = $src.Height
$dst = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Copy source pixels
for ($x = 0; $x -lt $width; $x++) {
    for ($y = 0; $y -lt $height; $y++) {
        $dst.SetPixel($x, $y, $src.GetPixel($x, $y))
    }
}
$src.Dispose()

# Find bounding box of green (play triangle) pixels
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

Write-Host "Green region: X=$minGX-$maxGX, Y=$minGY-$maxGY"
# The play triangle is asymmetric (right-pointing), so visual center is offset right
$cx = [int](($minGX + $maxGX) / 2) + 8
$cy = [int](($minGY + $maxGY) / 2)
$regionW = $maxGX - $minGX
$regionH = $maxGY - $minGY

# Erase all green pixels
for ($x = ($minGX - 3); $x -le ($maxGX + 3); $x++) {
    for ($y = ($minGY - 3); $y -le ($maxGY + 3); $y++) {
        if ($x -ge 0 -and $x -lt $width -and $y -ge 0 -and $y -lt $height) {
            $p = $dst.GetPixel($x, $y)
            if ($p.A -gt 50 -and $p.G -gt 120 -and $p.G -gt ($p.R + 20) -and $p.G -gt ($p.B + 20)) {
                $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            }
        }
    }
}

# Draw stop square pixel-by-pixel with rounded corners
# Make it fill the inner dark circle - roughly 110% of the green region size
$squareSize = [int]($regionW * 1.05)
$halfSq = [int]($squareSize / 2)
$cornerR = [int]($squareSize * 0.22)

# Fix center: move slightly right to center in inner circle
$cx = $cx + 5

$borderThick = 4
$totalSize = $squareSize + ($borderThick * 2)

$green = [System.Drawing.Color]::FromArgb(255, 0, 230, 118)
$black = [System.Drawing.Color]::FromArgb(255, 0, 0, 0)

function Is-InRoundedRect {
    param($px, $py, $ox, $oy, $w, $h, $r)
    $lx = $px - $ox
    $ly = $py - $oy
    if ($lx -lt 0 -or $lx -ge $w -or $ly -lt 0 -or $ly -ge $h) { return $false }
    # Check corners
    if ($lx -lt $r -and $ly -lt $r) {
        return (($lx - $r)*($lx - $r) + ($ly - $r)*($ly - $r)) -le ($r * $r)
    }
    if ($lx -ge ($w - $r) -and $ly -lt $r) {
        return (($lx - ($w - $r - 1))*($lx - ($w - $r - 1)) + ($ly - $r)*($ly - $r)) -le ($r * $r)
    }
    if ($lx -lt $r -and $ly -ge ($h - $r)) {
        return (($lx - $r)*($lx - $r) + ($ly - ($h - $r - 1))*($ly - ($h - $r - 1))) -le ($r * $r)
    }
    if ($lx -ge ($w - $r) -and $ly -ge ($h - $r)) {
        return (($lx - ($w - $r - 1))*($lx - ($w - $r - 1)) + ($ly - ($h - $r - 1))*($ly - ($h - $r - 1))) -le ($r * $r)
    }
    return $true
}

$box = $cx - [int]($totalSize / 2)
$boy = $cy - [int]($totalSize / 2)
$gox = $cx - $halfSq
$goy = $cy - $halfSq

$xMin = [Math]::Max(0, $box - 2)
$xMax = [Math]::Min($width - 1, $box + $totalSize + 2)
$yMin = [Math]::Max(0, $boy - 2)
$yMax = [Math]::Min($height - 1, $boy + $totalSize + 2)

for ($x = $xMin; $x -le $xMax; $x++) {
    for ($y = $yMin; $y -le $yMax; $y++) {
        $inBlack = Is-InRoundedRect $x $y $box $boy $totalSize $totalSize ($cornerR + $borderThick)
        $inGreen = Is-InRoundedRect $x $y $gox $goy $squareSize $squareSize $cornerR
        if ($inGreen) {
            $dst.SetPixel($x, $y, $green)
        } elseif ($inBlack) {
            $dst.SetPixel($x, $y, $black)
        }
    }
}

if (Test-Path $dstPath) { Remove-Item $dstPath -Force }
$dst.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
$dst.Dispose()
Write-Host "Done! Saved to $dstPath"
