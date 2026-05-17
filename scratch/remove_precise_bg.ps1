Add-Type -AssemblyName System.Drawing
$srcPath = "C:\Users\skinz\.gemini\antigravity\brain\d6d0e3d6-dd9f-4001-bece-b6e3784cb4d9\media__1779008015389.png"
$dstPath = "f:\MyRestoredProjects\GymLog\public\assets\start-button-v6.png"

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
            
            # 1. Remove the solid dark background:
            # The background is exactly R=38, G=38, B=38 (or very close to it, between 32 and 45)
            # and it is a neutral grey (R, G, B are very close to each other)
            $isBg = ($r -ge 30 -and $r -le 46 -and $g -ge 30 -and $g -le 46 -and $b -ge 30 -and $b -le 46)
            
            if ($isBg) {
                # Make it fully transparent!
                $pixel = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
            }
            # 2. Tint the warm red sketch body to matte orange #E67E22:
            elseif ($r -gt 130 -and $r -gt ($g + 20) -and $r -gt ($b + 20) -and $g -lt 155 -and $b -lt 155) {
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

if (Test-Path $dstPath) {
    Remove-Item $dstPath -Force
}
$newImg.Save($dstPath)
$newImg.Dispose()
Write-Host "Successfully removed background (#262626) and tinted stopwatch to orange at v6 path!"
