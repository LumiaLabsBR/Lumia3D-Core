#!/usr/bin/env pwsh
# Gera src/Lumia3DCore/Assets/icon.ico com tamanhos 16/32/48/256 px.
# Replica o Lumia3DLogo (cubo isometrico em 3 facetas + dot laranja).
# Requer Windows (usa System.Drawing).
# Uso: powershell -ExecutionPolicy Bypass -File tools\generate-icon.ps1

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

# Cores da marca
$bgColor       = [System.Drawing.Color]::FromArgb(255, 15, 17, 21)    # #0F1115
$lightColor    = [System.Drawing.Color]::FromArgb(229, 230, 232, 236) # #E6E8EC at 0.9
$mediumColor   = [System.Drawing.Color]::FromArgb(140, 230, 232, 236) # #E6E8EC at 0.55
$darkColor     = [System.Drawing.Color]::FromArgb( 64, 230, 232, 236) # #E6E8EC at 0.25
$accentColor   = [System.Drawing.Color]::FromArgb(255, 255, 122, 26)  # #FF7A1A
$accentRingClr = [System.Drawing.Color]::FromArgb(102, 255, 122, 26)  # #FF7A1A at 0.4

function Make-Bitmap([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode    = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.Clear([System.Drawing.Color]::Transparent)

    # Fundo arredondado LARANJA cheio (mais reconhecivel em sizes pequenos da taskbar)
    $bgBrush = New-Object System.Drawing.SolidBrush($accentColor)
    $rad = [Math]::Max(2, [int]($size * 0.20))
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    if ($size -ge 32) {
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $d = $rad * 2
        $path.AddArc(0, 0, $d, $d, 180, 90)
        $path.AddArc($size - $d, 0, $d, $d, 270, 90)
        $path.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
        $path.AddArc(0, $size - $d, $d, $d, 90, 90)
        $path.CloseFigure()
        $g.FillPath($bgBrush, $path)
        $path.Dispose()
    } else {
        $g.FillRectangle($bgBrush, $rect)
    }

    # Coords do cubo isometrico (viewBox 40x40 → escala pra $size com padding)
    $pad = $size * 0.20
    $inner = $size - 2 * $pad
    $scale = $inner / 40.0
    function P([double]$x, [double]$y) {
        return New-Object System.Drawing.PointF(
            [single]($pad + $x * $scale),
            [single]($pad + $y * $scale))
    }

    # Cubo BRANCO em fundo laranja (alto contraste em qualquer size)
    $whiteFull = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
    $whiteMed  = [System.Drawing.Color]::FromArgb(180, 255, 255, 255)
    $whiteLow  = [System.Drawing.Color]::FromArgb(110, 255, 255, 255)

    # Face right (mais clara): M20 8 L31.6 14.4 L31.6 25.6 L20 32 L20 19.8 Z
    $faceRight = @( (P 20 8), (P 31.6 14.4), (P 31.6 25.6), (P 20 32), (P 20 19.8) )
    $b1 = New-Object System.Drawing.SolidBrush($whiteFull)
    $g.FillPolygon($b1, $faceRight)

    # Face top: M20 8 L20 19.8 L8.4 14.4 Z
    $faceTop = @( (P 20 8), (P 20 19.8), (P 8.4 14.4) )
    $b2 = New-Object System.Drawing.SolidBrush($whiteMed)
    $g.FillPolygon($b2, $faceTop)

    # Face left: M8.4 14.4 L20 19.8 L20 32 L8.4 25.6 Z
    $faceLeft = @( (P 8.4 14.4), (P 20 19.8), (P 20 32), (P 8.4 25.6) )
    $b3 = New-Object System.Drawing.SolidBrush($whiteLow)
    $g.FillPolygon($b3, $faceLeft)

    # Em sizes grandes, contorno fino para definir as arestas do cubo
    if ($size -ge 32) {
        $edgeColor = [System.Drawing.Color]::FromArgb(120, 30, 15, 5)
        $edgePen = New-Object System.Drawing.Pen($edgeColor, [single](0.7 * $scale))
        $g.DrawPolygon($edgePen, $faceRight)
        $g.DrawPolygon($edgePen, $faceTop)
        $g.DrawPolygon($edgePen, $faceLeft)
        $edgePen.Dispose()
    }

    $bgBrush.Dispose(); $b1.Dispose(); $b2.Dispose(); $b3.Dispose()
    $g.Dispose()
    return $bmp
}

$sizes = @(16, 24, 32, 40, 48, 64, 128, 256)
$pngs  = [System.Collections.Generic.List[byte[]]]::new()

foreach ($s in $sizes) {
    $bmp = Make-Bitmap $s
    $ms  = [System.IO.MemoryStream]::new()
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngs.Add($ms.ToArray())
    $ms.Dispose(); $bmp.Dispose()
}

# Calcular offsets: header(6) + n*dirEntry(16) + png data
$headerSize = 6
$dirSize    = $sizes.Count * 16
$offsets    = [int[]]::new($sizes.Count)
$off        = $headerSize + $dirSize
for ($i = 0; $i -lt $sizes.Count; $i++) {
    $offsets[$i] = $off
    $off += $pngs[$i].Length
}

$outPath = Join-Path $PSScriptRoot "..\src\Lumia3DCore\Assets\icon.ico"
$null = New-Item -ItemType Directory -Force -Path (Split-Path $outPath)

$fs = [System.IO.FileStream]::new($outPath, [System.IO.FileMode]::Create)
$bw = [System.IO.BinaryWriter]::new($fs)

# ICO header
$bw.Write([uint16]0)               # reserved
$bw.Write([uint16]1)               # type = icon
$bw.Write([uint16]$sizes.Count)    # number of images

# Directory entries (16 bytes each)
for ($i = 0; $i -lt $sizes.Count; $i++) {
    $w = if ($sizes[$i] -eq 256) { [byte]0 } else { [byte]$sizes[$i] }
    $h = if ($sizes[$i] -eq 256) { [byte]0 } else { [byte]$sizes[$i] }
    $bw.Write([byte]$w)
    $bw.Write([byte]$h)
    $bw.Write([byte]0)             # color count (0 = true color)
    $bw.Write([byte]0)             # reserved
    $bw.Write([uint16]1)           # color planes
    $bw.Write([uint16]32)          # bits per pixel
    $bw.Write([uint32]$pngs[$i].Length)
    $bw.Write([uint32]$offsets[$i])
}

# PNG blobs
foreach ($png in $pngs) { $bw.Write($png, 0, $png.Length) }

$bw.Close(); $fs.Close()

$kb = [Math]::Round($off / 1024, 1)
Write-Host "OK: icon.ico gerado: $kb KB ($($sizes -join '/') px)"
