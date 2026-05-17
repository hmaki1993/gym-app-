Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile('C:\Users\skinz\.gemini\antigravity\brain\7dd526fb-e89f-48e6-b337-f0cbe9db7470\media__1779057860414.png')
$bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.DrawImage($img, 0, 0, $img.Width, $img.Height)
$img.Dispose()

for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $color = $bmp.GetPixel($x, $y)
        if ($color.R -lt 30 -and $color.G -lt 30 -and $color.B -lt 30) {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
        } else {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::White)
        }
    }
}
$bmp.Save('f:\MyRestoredProjects\GymLog\public\assets\exercise-title-arrow.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output 'Image processed successfully'
