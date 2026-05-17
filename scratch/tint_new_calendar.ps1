Add-Type -AssemblyName System.Drawing
$srcPath = "C:\Users\skinz\.gemini\antigravity\brain\d6d0e3d6-dd9f-4001-bece-b6e3784cb4d9\media__1779009587912.png"
$dstPath = "f:\MyRestoredProjects\GymLog\public\assets\calendar-custom-v3.png"

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
            
            # 1. Detect Red top bar (warm coral/red):
            # R is high (>180), G and B are low (<140), R is dominant.
            if ($r -gt 180 -and $g -lt 140 -and $b -lt 140) {
                $lum = ($r * 0.299) + ($g * 0.587) + ($b * 0.114)
                $factor = $lum / 145.0
                
                # Map to primary matte orange: #E67E22 (230, 126, 34)
                $newR = [Math]::Min(255, [int](230 * $factor))
                $newG = [Math]::Min(255, [int](126 * $factor))
                $newB = [Math]::Min(255, [int](34 * $factor))
                
                $pixel = [System.Drawing.Color]::FromArgb($pixel.A, $newR, $newG, $newB)
            }
            # 2. Detect Yellow calendar body (soft pastel yellow):
            # R is high (>210), G is high (>170), B is moderate/low (<170).
            elseif ($r -gt 210 -and $g -gt 170 -and $b -lt 170) {
                $lum = ($r * 0.299) + ($g * 0.587) + ($b * 0.114)
                $factor = $lum / 215.0
                
                # Map to a softer, elegant gold/light orange: #F39C12 (243, 156, 18)
                $newR = [Math]::Min(255, [int](243 * $factor))
                $newG = [Math]::Min(255, [int](175 * $factor))
                $newB = [Math]::Min(255, [int](60 * $factor))
                
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
Write-Host "Successfully tinted the new calendar vector art with premium two-tone matte orange!"
