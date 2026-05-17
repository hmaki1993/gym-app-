Add-Type -AssemblyName System.Drawing
$srcPath = "C:\Users\skinz\.gemini\antigravity\brain\d6d0e3d6-dd9f-4001-bece-b6e3784cb4d9\media__1779008015389.png"
$dstPath = "f:\MyRestoredProjects\GymLog\public\assets\start-button-v4.png"

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
            
            # Detect the hand-drawn red color:
            # It's a warm red/terracotta: R is high (usually >130), G and B are low (<130), R is dominant.
            if ($r -gt 130 -and $r -gt ($g + 25) -and $r -gt ($b + 25) -and $g -lt 150 -and $b -lt 150) {
                # Calculate luminance to preserve the beautiful hand-drawn sketch texture
                $lum = ($r * 0.299) + ($g * 0.587) + ($b * 0.114)
                
                # Base Orange: R=230, G=126, B=34
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
Write-Host "Successfully converted stopwatch play button to custom matte orange sketchy art!"
