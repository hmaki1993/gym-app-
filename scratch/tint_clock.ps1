Add-Type -AssemblyName System.Drawing

$srcPath = "f:\MyRestoredProjects\GymLog\scratch\uploaded_clock.png"
$dstPath = "f:\MyRestoredProjects\GymLog\public\assets\clock-custom.png"

$src = [System.Drawing.Bitmap]::new($srcPath)
$dst = [System.Drawing.Bitmap]::new($src.Width, $src.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$targetR = 255
$targetG = 140
$targetB = 0

for ($y = 0; $y -lt $src.Height; $y++) {
    for ($x = 0; $x -lt $src.Width; $x++) {
        $px = $src.GetPixel($x, $y)
        $alpha = $px.A

        if ($alpha -lt 20) {
            $dst.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
            continue
        }

        $lum = (0.299 * $px.R + 0.587 * $px.G + 0.114 * $px.B)

        if ($lum -lt 140) {
            # Dark pixels -> solid orange (outlines/details)
            $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $targetR, $targetG, $targetB))
        } else {
            # Light pixels -> transparent (remove white/light fill)
            $dst.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
        }
    }
}

$dst.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
$src.Dispose()
$dst.Dispose()

Write-Host "Done! Saved to $dstPath"
