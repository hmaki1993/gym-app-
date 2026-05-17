Add-Type -AssemblyName System.Drawing
$srcPath = "C:\Users\skinz\.gemini\antigravity\brain\d6d0e3d6-dd9f-4001-bece-b6e3784cb4d9\media__1779008227575.png"
$dstPath = "f:\MyRestoredProjects\GymLog\public\assets\stopwatch-ultra-clean-v3.png"

$img = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $img.Width
$height = $img.Height
$newImg = New-Object System.Drawing.Bitmap($width, $height)

for ($x = 0; $x -lt $width; $x++) {
    for ($y = 0; $y -lt $height; $y++) {
        $pixel = $img.GetPixel($x, $y)
        if ($pixel.A -gt 0) {
            $r = $pixel.R
            $g = $pixel.G
            $b = $pixel.B
            
            # 1. Identify and remove any neutral dark grey background/border pixels:
            # Neutral dark grey is usually between 10 and 65, and R, G, B are very close to each other.
            $isDarkGrey = ($r -ge 10 -and $r -le 65 -and [Math]::Abs($r - $g) -lt 8 -and [Math]::Abs($r - $b) -lt 8)
            
            if ($isDarkGrey) {
                # Force to fully transparent!
                $pixel = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
            }
            # 2. Tint the warm red sketch body to matte orange #E67E22 (230, 126, 34)
            elseif ($r -gt 130 -and $r -gt ($g + 20) -and $r -gt ($b + 20) -and $g -lt 150 -and $b -lt 150) {
                $lum = ($r * 0.299) + ($g * 0.587) + ($b * 0.114)
                $factor = $lum / 135.0
                
                $newR = [Math]::Min(255, [int](230 * $factor))
                $newG = [Math]::Min(255, [int](126 * $factor))
                $newB = [Math]::Min(255, [int](34 * $factor))
                
                $pixel = [System.Drawing.Color]::FromArgb($pixel.A, $newR, $newG, $newB)
            }
        }
        $newImg.SetPixel($x, $y, $pixel)
    }
}
$img.Dispose()

# 3. Flood Fill the transparent play triangle in the center with Theme Green #00E676 (R=0, G=230, B=118)
# The center is around 250, 275.
$startX = 250
$startY = 275

$minX = 180
$maxX = 320
$minY = 200
$maxY = 340

$visited = New-Object 'bool[,]' $width, $height
$queue = New-Object System.Collections.Queue
$queue.Enqueue(@{x=$startX; y=$startY})
$visited[$startX, $startY] = $true

# Theme Green: #00E676 (R=0, G=230, B=118)
$greenColor = [System.Drawing.Color]::FromArgb(255, 0, 230, 118)

while ($queue.Count -gt 0) {
    $curr = $queue.Dequeue()
    $cx = $curr.x
    $cy = $curr.y
    
    # Fill this pixel with green
    $newImg.SetPixel($cx, $cy, $greenColor)
    
    # Check 4-connected neighbors
    $neighbors = @(
        @{x=$cx-1; y=$cy},
        @{x=$cx+1; y=$cy},
        @{x=$cx; y=$cy-1},
        @{x=$cx; y=$cy+1}
    )
    
    foreach ($n in $neighbors) {
        if ($n.x -ge $minX -and $n.x -le $maxX -and $n.y -ge $minY -and $n.y -le $maxY) {
            if (-not $visited[$n.x, $n.y]) {
                $visited[$n.x, $n.y] = $true
                
                $p = $newImg.GetPixel($n.x, $n.y)
                # If neighbor is transparent, add to queue to continue filling the play button
                if ($p.A -eq 0) {
                    $queue.Enqueue($n)
                }
            }
        }
    }
}

if (Test-Path $dstPath) {
    Remove-Item $dstPath -Force
}
$newImg.Save($dstPath)
$newImg.Dispose()
Write-Host "Successfully removed all neutral dark background pixels, tinted stopwatch orange, filled play green, and saved to stopwatch-ultra-clean-v3.png!"
