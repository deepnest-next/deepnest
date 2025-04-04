#!/bin/sh -x

set -e

SIZES="
16,16x16
32,16x16@2x
32,32x32
64,32x32@2x
128,128x128
256,128x128@2x
256,256x256
512,256x256@2x
512,512x512
1024,512x512@2x
"

FILES=/Zafiro-icons-master/apps/scalable/*

for SVG in $@; do
    echo "Processing $SVG file..."
    # take action on each file. $f store current file name
    BASE=$(basename "$SVG" | sed 's/\.[^\.]*$//')
    ICONSET="$BASE.iconset"
    mkdir -p "./icons/$ICONSET" || true
    svg2png -w 512 -h 512 "$SVG" "./icons/icon.png" || true
    for PARAMS in $SIZES; do
        SIZE=$(echo $PARAMS | cut -d, -f1)
        LABEL=$(echo $PARAMS | cut -d, -f2)
        svg2png -w $SIZE -h $SIZE "$SVG" "./icons/$ICONSET"/icon_$LABEL.png || true
    done
    iconutil -c icns "./icons/$ICONSET" || true
    magick -background transparent -define 'icon:auto-resize=16,24,32,64,128,256' "./icons/icon.png" "./icons/icon.ico" || true
    rm -rf "$ICONSET"
done
