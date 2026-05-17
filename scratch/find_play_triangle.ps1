Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("C:\Users\skinz\.gemini\antigravity\brain\d6d0e3d6-dd9f-4001-bece-b6e3784cb4d9\media__1779008227575.png")

Write-Host "Center (250,275): R=$($img.GetPixel(250,275).R), G=$($img.GetPixel(250,275).G), B=$($img.GetPixel(250,275).B), A=$($img.GetPixel(250,275).A)"
Write-Host "Center (250,250): R=$($img.GetPixel(250,250).R), G=$($img.GetPixel(250,250).G), B=$($img.GetPixel(250,250).B), A=$($img.GetPixel(250,250).A)"
Write-Host "Center (250,300): R=$($img.GetPixel(250,300).R), G=$($img.GetPixel(250,300).G), B=$($img.GetPixel(250,300).B), A=$($img.GetPixel(250,300).A)"

# Find all white pixels (R>240, G>240, B>240) in the central 120x120 area
$whitePixels = 0
for ($x = 190; $x -lt 310; $x++) {
    for ($y = 210; $y -lt 330; $y++) {
        $p = $img.GetPixel($x, $y)
        if ($p.R -gt 240 -and $p.G -gt 240 -and $p.B -gt 240) {
            $whitePixels++
            if ($whitePixels -le 5) {
                Write-Host "White pixel in center at ($x, $y): R=$($p.R), G=$($p.G), B=$($p.B)"
            }
        }
    }
}
Write-Host "Total white pixels in central area: $whitePixels"

$img.Dispose()
