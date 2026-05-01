#!/usr/bin/env pwsh
# Gera src/Lumia3DCore/Assets/icon.ico com tamanhos 16/32/48/256 px.
# Requer Windows (usa System.Drawing).
# Uso: pwsh tools/generate-icon.ps1   (da raiz do repositório)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function Make-Bitmap([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    # Fundo escuro arredondado
    $bgBrush = New-Object System.Drawing.SolidBrush(
        [System.Drawing.Color]::FromArgb(255, 15, 17, 21))
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)

    # Círculo laranja (cor da marca: #FF7A1A)
    $pad = [Math]::Max(1, [int]($size * 0.07))
    $orangeBrush = New-Object System.Drawing.SolidBrush(
        [System.Drawing.Color]::FromArgb(255, 255, 122, 26))
    $g.FillEllipse($orangeBrush, $pad, $pad, $size - $pad*2, $size - $pad*2)

    # Inner highlight
    if ($size -ge 32) {
        $hiPad  = [int]($size * 0.22)
        $hiSize = [int]($size * 0.25)
        $hiBrush = New-Object System.Drawing.SolidBrush(
            [System.Drawing.Color]::FromArgb(60, 255, 255, 255))
        $g.FillEllipse($hiBrush, $hiPad, $hiPad, $hiSize, $hiSize)
        $hiBrush.Dispose()
    }

    $bgBrush.Dispose(); $orangeBrush.Dispose(); $g.Dispose()
    return $bmp
}

$sizes = @(16, 32, 48, 256)
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
