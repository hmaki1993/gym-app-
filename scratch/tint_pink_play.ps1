Add-Type -AssemblyName System.Drawing
$srcPath = "C:\Users\skinz\.gemini\antigravity\brain\d6d0e3d6-dd9f-4001-bece-b6e3784cb4d9\media__1779007895854.png"
$dstPath = "f:\MyRestoredProjects\GymLog\public\assets\start-button-v3.png"

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
            
            # Detect Pink: High Red, moderate Green and Blue, where G and B are somewhat close.
            # Pink in this vector art is around R=255, G=130, B=150
            if ($r -gt 200 -and $g -lt 180 -and $b -lt 180 -and $r -gt ($g + 40)) {
                # This is the pink body!
                # Calculate original luminance to preserve the beautiful light/dark split-shading
                $lum = ($r * 0.299) + ($g * 0.587) + ($b * 0.114)
                
                # Base Orange: R=230, G=126, B=34
                # Normalizing factor based on average pink luminance (~170)
                $factor = $lum / 170.0
                
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
Write-Host "Successfully converted pink play button to beautiful matte orange vector art at v3 path!"
