Add-Type -AssemblyName System.Drawing
$srcPath = "C:\Users\skinz\.gemini\antigravity\brain\d6d0e3d6-dd9f-4001-bece-b6e3784cb4d9\media__1779008015389.png"
$dstPath = "f:\MyRestoredProjects\GymLog\public\assets\start-button-v5.png"

$img = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $img.Width
$height = $img.Height
$newImg = New-Object System.Drawing.Bitmap($width, $height)

# Copy original image to newImg first
for ($x = 0; $x -lt $width; $x++) {
    for ($y = 0; $y -lt $height; $y++) {
        $newImg.SetPixel($x, $y, $img.GetPixel($x, $y))
    }
}
$img.Dispose()

# Queue-based Flood Fill to remove background starting from the corners
$visited = New-Object 'bool[,]' $width, $height
$queue = New-Object System.Collections.Queue

# Add all 4 corners to the queue
$corners = @(
    @{x=0; y=0},
    @{x=($width-1); y=0},
    @{x=0; y=($height-1)},
    @{x=($width-1); y=($height-1)}
)

foreach ($c in $corners) {
    $queue.Enqueue($c)
    $visited[$c.x, $c.y] = $true
}

# The background color is typically the color of the top-left corner
$bgColor = $newImg.GetPixel(0, 0)

# Allow a small threshold for JPEG artifacts/shading in background
$threshold = 20

while ($queue.Count -gt 0) {
    $curr = $queue.Dequeue()
    $cx = $curr.x
    $cy = $curr.y
    
    # Get current pixel
    $pixel = $newImg.GetPixel($cx, $cy)
    
    # Check if the pixel color is close to the background color
    $diffR = [Math]::Abs($pixel.R - $bgColor.R)
    $diffG = [Math]::Abs($pixel.G - $bgColor.G)
    $diffB = [Math]::Abs($pixel.B - $bgColor.B)
    
    # Also treat pure black or near-black as background if it's connected
    $isDark = ($pixel.R -lt 25 -and $pixel.G -lt 25 -and $pixel.B -lt 25)
    
    if (($diffR -lt $threshold -and $diffG -lt $threshold -and $diffB -lt $threshold) -or $isDark) {
        # Make it transparent!
        $transparentColor = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
        $newImg.SetPixel($cx, $cy, $transparentColor)
        
        # Add neighbors
        $neighbors = @(
            @{x=$cx-1; y=$cy},
            @{x=$cx+1; y=$cy},
            @{x=$cx; y=$cy-1},
            @{x=$cx; y=$cy+1}
        )
        
        foreach ($n in $neighbors) {
            if ($n.x -ge 0 -and $n.x -lt $width -and $n.y -ge 0 -and $n.y -lt $height) {
                if (-not $visited[$n.x, $n.y]) {
                    $visited[$n.x, $n.y] = $true
                    $queue.Enqueue($n)
                }
            }
        }
    }
}

# Now, tint the RED body to matte orange #E67E22 while keeping the transparent areas transparent!
for ($x = 0; $x -lt $width; $x++) {
    for ($y = 0; $y -lt $height; $y++) {
        $pixel = $newImg.GetPixel($x, $y)
        if ($pixel.A -gt 0) {
            $r = $pixel.R
            $g = $pixel.G
            $b = $pixel.B
            
            # Detect the sketchy red color
            if ($r -gt 130 -and $r -gt ($g + 20) -and $r -gt ($b + 20) -and $g -lt 155 -and $b -lt 155) {
                $lum = ($r * 0.299) + ($g * 0.587) + ($b * 0.114)
                $factor = $lum / 135.0
                
                $newR = [Math]::Min(255, [int](230 * $factor))
                $newG = [Math]::Min(255, [int](126 * $factor))
                $newB = [Math]::Min(255, [int](34 * $factor))
                
                $pixel = [System.Drawing.Color]::FromArgb($pixel.A, $newR, $newG, $newB)
                $newImg.SetPixel($x, $y, $pixel)
            }
        }
    }
}

if (Test-Path $dstPath) {
    Remove-Item $dstPath -Force
}
$newImg.Save($dstPath)
$newImg.Dispose()
Write-Host "Successfully removed background and tinted the stopwatch play button!"
