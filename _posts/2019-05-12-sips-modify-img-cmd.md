---
layout: default
title: "在命令行用sips进行图片格式转换、图片大小修改、图片属性设置等操作"
author: 李佶澳
createdate: "2019-05-12T10:01:01+0800"
last_modified_at: "2019-05-12T13:22:20+0800"
categories:  技巧
tags: imgtool
cover:
keywords: sips,修改图片大小,图片格式转换,图片旋转,图片翻转
description: 用sips在命令行修改图片等方法，转换图片格式、扩大填充、缩小采样、修改图片质量等，mac可用
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

sips是一个命令行的图片处理工具，具有转换图片格式、修改图片大小（扩充或者重新采样缩小图片）、修改质量，设置版权信息等功能。
在命令行使用，简单方便，mac系统上也有这个命令。

使用sips的时候要注意，如果不用`--out`指定输出目录或者图片名，sips会直接修改原始图片。

## sips修改图片属性

图片的属性分为`Image property`和`Profile property`，每一类都有十多个配置项。
sips能够查阅修改图片的属性，用`--getProperty`查看，用`--setProperty`修改，用`--deleteProperty`删除。

sips能够查看操作的属性，在手册`man sips`中可以找到：

```sh
Image property keys:
dpiHeight        float
dpiWidth         float
pixelHeight      integer (read-only)
pixelWidth       integer (read-only)
typeIdentifier   string (read-only)
format           string jpeg | tiff | png | gif | jp2 | pict | bmp | qtif | psd | sgi | tga
formatOptions    string default | [low|normal|high|best|<percent>] | [lzw|packbits]
space            string (read-only)
samplesPerPixel  integer (read-only)
bitsPerSample    integer (read-only)
creation         string (read-only)
make             string
model            string
software         string (read-only)
description      string
copyright        string
artist           string
profile          binary data
hasAlpha         boolean (read-only)

Profile property keys:
description         utf8 string
size                integer (read-only)
cmm                 string
version             string
class               string (read-only)
space               string (read-only)
pcs                 string (read-only)
creation            string
platform            string
quality             string normal | draft | best
deviceManufacturer  string
deviceModel         integer
deviceAttributes0   integer
deviceAttributes1   integer
renderingIntent     string perceptual | relative | saturation | absolute
creator             string
copyright           string
md5                 string (read-only)
```

read-only外的属性可以用--setProperty修改、用--deleteProperty删除，后面转换图片格式的操做是通过修改format属性完成的（编码一并被更新）。

用--getProperty all查看图片的所有属性：

```sh
$ sips --getProperty all origin-640x426.jpg
  pixelWidth: 640
  pixelHeight: 426
  typeIdentifier: public.jpeg
  format: jpeg
  formatOptions: default
  dpiWidth: 300.000
  dpiHeight: 300.000
  samplesPerPixel: 3
  bitsPerSample: 8
  hasAlpha: no
  space: RGB
  make: NIKON CORPORATION
  model: NIKON D3300
```

## sips转换图片格式

sips支持将图片转换成下面的格式：

```
jpeg   tiff   png   gif   jp2   pict   bmp   qtif   psd   sgi   tga
```

用`-s format`指定目标格式，`-s formatOptions`指定图片质量，图片质量支持default、low、normal、high、best、 百分比、lzw、packbits：

```sh
sips -s format jpeg -s formatOptions default img.png --out img.jpeg
```

## sips修改图片大小

原始图片是640x426大jpg格式文件：

```sh
$ file origin-640x426.jpg
origin-640x426.jpg: JPEG image data, JFIF standard 1.01, resolution (DPI), density 300x300, 
segment length 16, Exif Standard: [TIFF image data, big-endian, direntries=4, 
manufacturer=NIKON CORPORATION, model=NIKON D3300], baseline, precision 8, 640x426, frames 3
```

![原始图片640x426]({{ site.imglocal }}/tools-sips/origin-640x426.jpg)

### 放大图片

1 用像素填充的方式，将图片放大为960x540

```sh
sips --padToHeightWidth 540 960  origin-640x426.jpg --out pad-960x540.jpg
```

默认是用黑色填充：

![黑色填充到960x540]({{ site.imglocal }}/tools-sips/pad-960x540.jpg)

指定填充颜色（FFFFFF 白色），--padColor一定要在--padToHeightWidth 后面，否则无效：

```sh
sips --padToHeightWidth 540 960 --padColor FFFFFF origin-640x426.jpg --out pad-960x540-white.jpg
```

![白色填充到960x540]({{ site.imglocal }}/tools-sips/pad-960x540-white.jpg)

### 裁剪图片

裁剪操作不会对图片进行缩放，如果指定的裁剪尺寸大于原始图片，多处的区块被填充，如果小于原始图片，多余的区块被丢弃。

1 指定尺寸大于原始图片，效果和用像素填充放大是一样的：

```sh
sips --cropToHeightWidth 540 960 --padColor FFFFFF origin-640x426.jpg --out crop-960x540.jpg 
```

![白色填充裁剪960x540]({{ site.imglocal }}/tools-sips/crop-960x540.jpg)

2 指定尺寸小于原始图片，图片被从中心向外截取（或许有指定截取区域的方法？）：

```sh
sips --cropToHeightWidth 200 200 origin-640x426.jpg --out crop-200x200.jpg 
```

![裁剪截取200x200]({{ site.imglocal }}/tools-sips/crop-200x200.jpg)

### 采样缩放

用采样的方式修改图片大小，不会产生填空区块，或者将多余区域丢弃，如果长宽比例和原始图片不同，图片会变形（拉长或压缩）。

1 采样放大图片：

```sh
sips --resampleHeightWidth 540 960  origin-640x426.jpg --out res-960x540.jpg
```

![采样放大图片到960x540]({{ site.imglocal }}/tools-sips/res-960x540.jpg)


2 采样缩小图片：

```sh
sips --resampleHeightWidth 300 300  origin-640x426.jpg --out res-300x300.jpg
```

![采样缩小图片到300x300]({{ site.imglocal }}/tools-sips/res-300x300.jpg)

## sips旋转图片

可以用任意角度旋转图片，度数为正，是顺时针旋转，旋转时，图片的长宽会被改变。如果不是90度的倍数，会产生填充。

1 顺时针旋转45度，产生填充，指定填充颜色为白色：

```sh
sips --rotate 45  --padColor FFFFFF origin-640x426.jpg --out rot-45.jpg
```

![顺时针旋转45度]({{ site.imglocal }}/tools-sips/rot-45.jpg)

## sips翻转图片

将图片中的内容水平对调，或者垂直对调，注意不是旋转，而是内容对调。

1 水平方向上翻转：

```sh
sips --flip horizontal origin-640x426.jpg --out flip-horiz.jpg
```

![水平方向上翻转flip]({{ site.imglocal }}/tools-sips/flip-horiz.jpg)

2 垂直方向上翻转：

```sh
sips --flip vertical origin-640x426.jpg --out flip-verti.jpg
```

![垂直方向上翻转flip]({{ site.imglocal }}/tools-sips/flip-verti.jpg)


## 参考

1. [Immediately Resize, Rotate, and Flip Images via Command Line with sips][1]

[1]: http://osxdaily.com/2010/07/13/immediately-resize-rotate-and-flip-images-via-the-command-line/ "Immediately Resize, Rotate, and Flip Images via Command Line with sips"

