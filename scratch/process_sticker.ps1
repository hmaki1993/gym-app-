Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile('C:\Users\skinz\.gemini\antigravity\brain\7dd526fb-e89f-48e6-b337-f0cbe9db7470\media__1779058433880.png')
$bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.DrawImage($img, 0, 0, $img.Width, $img.Height)
$img.Dispose()

$visited = New-Object 'System.Boolean[,]' $bmp.Width, $bmp.Height
$queue = New-Object System.Collections.Queue

$push = {
    param($x, $y)
    if ($x -ge 0 -and $x -lt $bmp.Width -and $y -ge 0 -and $y -lt $bmp.Height) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.R -gt 240 -and $c.G -gt 240 -and $c.B -gt 240) {
            $queue.Enqueue(@($x, $y))
            $visited[$x, $y] = $true
        }
    }
}

& $push 0 0
& $push ($bmp.Width - 1) 0
& $push 0 ($bmp.Height - 1)
& $push ($bmp.Width - 1) ($bmp.Height - 1)

while ($queue.Count -gt 0) {
    $curr = $queue.Dequeue()
    $cx = $curr[0]
    $cy = $curr[1]
    
    $bmp.SetPixel($cx, $cy, [System.Drawing.Color]::Transparent)
    
    $dirs = @(@(-1, 0), @(1, 0), @(0, -1), @(0, 1))
    foreach ($d in $dirs) {
        $nx = $cx + $d[0]
        $ny = $cy + $d[1]
        if ($nx -ge 0 -and $nx -lt $bmp.Width -and $ny -ge 0 -and $ny -lt $bmp.Height) {
            if (-not $visited[$nx, $ny]) {
                $nc = $bmp.GetPixel($nx, $ny)
                if ($nc.R -gt 240 -and $nc.G -gt 240 -and $nc.B -gt 240) {
                    $queue.Enqueue(@($nx, $ny))
                    $visited[$nx, $ny] = $true
                }
            }
        }
    }
}

$bmp.Save('f:\MyRestoredProjects\GymLog\public\assets\im-done-sticker.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output 'Background transparent processed successfully!'
