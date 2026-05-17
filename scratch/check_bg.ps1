Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("C:\Users\skinz\.gemini\antigravity\brain\d6d0e3d6-dd9f-4001-bece-b6e3784cb4d9\media__1779008015389.png")
Write-Host "Image Size: $($img.Width) x $($img.Height)"
Write-Host "Corner 0,0: R=$($img.GetPixel(0,0).R), G=$($img.GetPixel(0,0).G), B=$($img.GetPixel(0,0).B), A=$($img.GetPixel(0,0).A)"
Write-Host "Corner 10,10: R=$($img.GetPixel(10,10).R), G=$($img.GetPixel(10,10).G), B=$($img.GetPixel(10,10).B), A=$($img.GetPixel(10,10).A)"
Write-Host "Middle 256,10: R=$($img.GetPixel(256,10).R), G=$($img.GetPixel(256,10).G), B=$($img.GetPixel(256,10).B), A=$($img.GetPixel(256,10).A)"
$img.Dispose()
