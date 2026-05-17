Add-Type -AssemblyName System.Drawing
$imgPath = "f:\MyRestoredProjects\GymLog\public\assets\calendar-custom.png"
$img = [System.Drawing.Bitmap]::FromFile($imgPath)

# Create a copy in memory to avoid locked file issues
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
            
            $max = [Math]::Max($r, [Math]::Max($g, $b))
            $min = [Math]::Min($r, [Math]::Min($g, $b))
            
            # If the pixel has color (is not grayscale)
            if (($max - $min) -gt 20) {
                # Target green and blue hues: Green is dominant (G > R) or Blue is dominant (B > R)
                if (($g -gt $r) -or ($b -gt $r)) {
                    # Calculate luminance (0.299R + 0.587G + 0.114B)
                    $lum = ($r * 0.299) + ($g * 0.587) + ($b * 0.114)
                    
                    # Map to a gorgeous matte orange theme
                    # Base Orange R=230, G=126, B=34
                    # We scale it based on the original pixel's luminance relative to average luminance
                    $factor = $lum / 160.0
                    $newR = [Math]::Min(255, [int](230 * $factor))
                    $newG = [Math]::Min(255, [int](126 * $factor))
                    $newB = [Math]::Min(255, [int](34 * $factor))
                    
                    # Set the new tinted pixel
                    $pixel = [System.Drawing.Color]::FromArgb($pixel.A, $newR, $newG, $newB)
                }
            }
        }
        $newImg.SetPixel($x, $y, $pixel)
    }
}

$img.Dispose()

# Save the tinted image
$tintedPath = "f:\MyRestoredProjects\GymLog\public\assets\calendar-custom-tinted.png"
$newImg.Save($tintedPath)
$newImg.Dispose()

# Replace original
if (Test-Path $imgPath) {
    Remove-Item $imgPath -Force
}
Move-Item $tintedPath $imgPath -Force
Write-Host "Successfully tinted calendar image to custom matte orange!"
