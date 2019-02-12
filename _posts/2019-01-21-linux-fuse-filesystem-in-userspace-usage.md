---
layout: default
title: "Linux FUSE（用户态文件系统）的使用：用libfuse创建FUSE文件系统"
author: 李佶澳
createdate: "2019-01-21 10:57:16 +0800"
changedate: "2019-02-12 17:16:36 +0800"
categories: 技巧
tags: linux
keywords: linux,fuse,libfuse,用户态文件系统
description: FUSE是Linux Kernel的特性之一，一个用户态文件系统框架，用户态部分用libfuse实现
---

* auto-gen TOC:
{:toc}

## 说明

[FUSE][1]是Linux Kernel的特性之一：一个用户态文件系统框架，a userspace filesystem framework。
形象的说就是可以在用户态运行一个程序，这个程序暴露出一个FUSE文件系统，对这个文件系统进行的读写操作都会被转给用户态的程序处理。

FUSE由内核模块`fuse.ko`和用户空间的动态链接库`libfuse.*`组成，如果要开发使用fuse的用户态程序，需要安装`fuse-devel`：

	yum install fuse-devel

## 资料

Kernel中有两份关于FUSE的文档：

1. [kernel/Documentation/filesystems/fuse.txt][1]

2. [kernel/Documentation/filesystems/fuse-io.txt][2]

内核文档写的都超级简单，可以结合使用fuse的例子来学习fuse的使用：[lxc/lxcfs][3]。

## libfuse初级使用

Libfuse的头文件`/usr/include/fuse/fuse.h`中给出的了libfuse的接口，内容比较多。

下面例子中使用的[源代码](https://github.com/lijiaocn/workspace/tree/master/studys/study-libfuse)。

### libfuse的命令行参数

main.c内容如下，就是单纯调用fuse_main()：

```c
/*
 * main.c
 * Copyright (C) 2019 lijiaocn <lijiaocn@foxmail.com>
 *
 * Distributed under terms of the GPL license.
 */

#include <fuse/fuse.h>

int main(int argc, char *argv[])
{
	if (!fuse_main(argc, argv, NULL, NULL)){
		return -1;
	}
	return 0;
}
```

编译方法：

```makefile
all: main.c
	gcc -D_FILE_OFFSET_BITS=64 -DFUSE_USE_VERSION=26 -lfuse main.c
```

编译的时候需要指定FUSE的版本`-DFUSE_USE_VERSION=26`，上面代码中`fuse_main()`用的是fuse的新接口，和老接口不一样。

如果不指定26版本，会遇到下面的错误：

```
In file included from /usr/include/fuse/fuse.h:26:0,
                 from main.c:8:
/usr/include/fuse/fuse_common.h:497:4: error: #error Compatibility with API version other than 21, 22, 24, 25 and 11 not supported
 #  error Compatibility with API version other than 21, 22, 24, 25 and 11 not supported
    ^
main.c: In function ‘main’:
main.c:12:2: error: too many arguments to function ‘fuse_main_compat1’
  if (!fuse_main(argc, argv, NULL, NULL)){
  ^
In file included from /usr/include/fuse/fuse.h:1012:0,
                 from main.c:8:
/usr/include/fuse/fuse_compat.h:198:6: note: declared here
 void fuse_main_compat1(int argc, char *argv[],
      ^
main.c:12:2: error: invalid use of void expression
  if (!fuse_main(argc, argv, NULL, NULL)){
  ^
make: *** [all] Error 1
```

上面的代码编译得到程序不会做任何事情，但我们可以用它来看一下，libfuse的版本和支持的命令行参数：

```
$ ./a.out -V
FUSE library version: 2.9.2
fusermount version: 2.9.2
using FUSE kernel interface version 7.19
```

命令行参数：

```
$ ./a.out -h
usage: ./a.out mountpoint [options]

general options:
    -o opt,[opt...]        mount options
    -h   --help            print help
    -V   --version         print version

FUSE options:
    -d   -o debug          enable debug output (implies -f)
    -f                     foreground operation
    -s                     disable multi-threaded operation
    -o allow_other         allow access to other users
    -o allow_root          allow access to root
    ...(省略)...
Module options:

[iconv]
    -o from_code=CHARSET   original encoding of file names (default: UTF-8)
    -o to_code=CHARSET     new encoding of the file names (default: UTF-8)

[subdir]
    -o subdir=DIR           prepend this directory to all paths (mandatory)
    -o [no]rellinks        transform absolute symlinks to relative
```

通过`-h`，我们知道了fuse支持的所有`options`。

```
FUSE options:
    -d   -o debug          enable debug output (implies -f)
    -f                     foreground operation
    -s                     disable multi-threaded operation
    -o allow_other         allow access to other users
    -o allow_root          allow access to root
    ...(省略)...
```

### 挂载fuse文件系统

先用上面的程序尝试挂载，直接挂载/tmp/x目录，没有使用任何挂载参数：

```
$ ./a.out /tmp/x
```

挂载后，在`/proc/mounts`中可以看到多出了一个挂载点：

```
$ cat /proc/mounts |grep "/tmp/x"
a.out /tmp/x fuse.a.out rw,nosuid,nodev,relatime,user_id=0,group_id=0 0 0
```

`/sys/fs/fuse/connections/`中也会相应多出一个connection目录：

```
$ ls /sys/fs/fuse/connections/
38  40  42
```

这时对/tmp/x目录进行任何操作，都会提示下面错误：

```
$ cat /tmp/x
cat: /tmp/x: Function not implemented

$ ls /tmp/x
ls: cannot access /tmp/x: Function not implemented

$ echo "abc" >/tmp/x/a
-bash: /tmp/x/a: Function not implemented
```

这是因为前面的代码中，`fuse_main()`的第三个参数没有设置，是NULL：

```c
if (!fuse_main(argc, argv, NULL, NULL)){
	return -1;
}
```

文件操作函数的实现放在下一节中，卸载fuse的方式是直接umount：

```c
umount /tmp/x
```

### 实现几个假的文件操作函数

在上面代码的基础上，实现几个假的文件处理函数，并将它们传给fuse_main()，篇幅关系就不贴出所有代码了，只展示下代码轮廓：

完整代码：[示例代码 workspace/studys/study-libfuse/][4]

```c
#include <fuse/fuse.h>
#include "operations.h"

int fake_getattr(const char * input, struct stat * stat){
    printf("input: %s\n", input);
    return 0;
}

int fake_mkdir(const char * input, mode_t mode){
    printf("input: %s\n", input);
    return 0;
}

...省略...

const struct fuse_operations fake_ops = {
    .getattr = fake_getattr,
    .readlink = NULL,
    .getdir = NULL,
    .mknod = NULL,
    .mkdir = fake_mkdir,
    ...省略...
}

int main(int argc, char *argv[])
{
    if (!fuse_main(argc, argv, &fake_ops, NULL)){
        return -1;
    }
    return 0;
}
```

加上`-d`参数，在debug模式运行：

```
$ ./demo-fake -d /tmp/x
FUSE library version: 2.9.2
nullpath_ok: 0
nopath: 0
utime_omit_ok: 0
unique: 1, opcode: INIT (26), nodeid: 0, insize: 56, pid: 0
INIT: 7.22
flags=0x0000f7fb
max_readahead=0x00020000
   INIT: 7.19
   flags=0x00000011
   max_readahead=0x00020000
   max_write=0x00020000
   max_background=0
   congestion_threshold=0
   unique: 1, success, outsize: 40

```

这时候在一个新开的shell中操作/tmp/x：

```
$ ls /tmp/x/abc
ls: cannot access /tmp/x/abc: Input/output error
```

在demo-fake运行的shell中，可以看到下面的内容：

```
unique: 2, opcode: LOOKUP (1), nodeid: 1, insize: 44, pid: 25404
LOOKUP /abc
getattr /abc
input: /abc
   NODEID: 2
   unique: 2, success, outsize: 144
```

输出的正是代码中实现的几个`假的`操作函数打印出的内容。

## fuse control filesystem

加载内核模块fuse.ko后，可以用下面的命令加载fusectl fs：

	mount -t fusectl none /sys/fs/fuse/connections

每个使用fuse的进程有一个对应的目录：

	$ ls  /sys/fs/fuse/connections
	38  42

## 直接挂载 fuse filesystem 文件系统

[kernel/Documentation/filesystems/fuse.txt][1]中说fuse提供了`fuse`和`fuseblk`两种文件系统类型，可以作为mount命令的`-t`参数的参数值。

没搞清楚要怎样用mount直接挂载fuse文件系统，这里先收录文档给出的挂载选项，具体挂载方法弄明白以后再补充（2019-01-21 19:12:47）：

```
'fd=N'

  The file descriptor to use for communication between the userspace
  filesystem and the kernel.  The file descriptor must have been
  obtained by opening the FUSE device ('/dev/fuse').

'rootmode=M'

  The file mode of the filesystem's root in octal representation.

'user_id=N'

  The numeric user id of the mount owner.

'group_id=N'

  The numeric group id of the mount owner.

'default_permissions'

  By default FUSE doesn't check file access permissions, the
  filesystem is free to implement its access policy or leave it to
  the underlying file access mechanism (e.g. in case of network
  filesystems).  This option enables permission checking, restricting
  access based on file mode.  It is usually useful together with the
  'allow_other' mount option.

'allow_other'

  This option overrides the security measure restricting file access
  to the user mounting the filesystem.  This option is by default only
  allowed to root, but this restriction can be removed with a
  (userspace) configuration option.

'max_read=N'

  With this option the maximum size of read operations can be set.
  The default is infinite.  Note that the size of read requests is
  limited anyway to 32 pages (which is 128kbyte on i386).

'blksize=N'

  Set the block size for the filesystem.  The default is 512.  This
  option is only valid for 'fuseblk' type mounts.
```

## Lxcfs中的libfuse用法

[lxc/lxcfs][3]是一个使用了libfuse的程序，下面把它对libfuse的用法摘出来，作为libfuse用法的例子：

>一无所知的时候，看一下别人怎么用的，会特别有帮助，感觉这个例子比较“大”，可以看后面章节中我整理出来的更简短的例子。

lxcfs代码中开始使用fuse的地方：

```c
if (!fuse_main(nargs, newargv, &lxcfs_ops, NULL))
    ret = EXIT_SUCCESS;
```

`fuse_main()`定义如下：

```c
/**
 * Main function of FUSE.
 *
 * This is for the lazy.  This is all that has to be called from the
 * main() function.
 *
 * This function does the following:
 *   - parses command line options (-d -s and -h)
 *   - passes relevant mount options to the fuse_mount()
 *   - installs signal handlers for INT, HUP, TERM and PIPE
 *   - registers an exit handler to unmount the filesystem on program exit
 *   - creates a fuse handle
 *   - registers the operations
 *   - calls either the single-threaded or the multi-threaded event loop
 *
 * Note: this is currently implemented as a macro.
 *
 * @param argc the argument counter passed to the main() function
 * @param argv the argument vector passed to the main() function
 * @param op the file system operation
 * @param user_data user data supplied in the context during the init() method
 * @return 0 on success, nonzero on failure
 */
/*
  int fuse_main(int argc, char *argv[], const struct fuse_operations *op,
  void *user_data);
*/
#define fuse_main(argc, argv, op, user_data)                \
    fuse_main_real(argc, argv, op, sizeof(*(op)), user_data)
```

### Lxcfs中fuse_main的输入参数: argc、argv，命令行参数

`fuse_main()`的第一个参数`argc`是输入参数的个数，等于第二个参数`argv`数组的长度。

上面的头文件注释中`没有`明确说支持哪些参数，[lxcfs][3]中传入的参数是：

`-d/-f`：二选一，没有参数值：

	-f running foreground by default
	-d enable debug output

`-o`：挂载参数，有参数值，lxcfs中设置的参数是:

	allow_other,direct_io,entry_timeout=0.5,attr_timeout=0.5,nonempty

### Lxcfs中fuse_main的输入参数：op，文件操作函数

`fuse_main()`的第三个参数`op`非常关键，里面设置了所有文件操作对应的处理函数。

```c
const struct fuse_operations lxcfs_ops = {
    .getattr = lxcfs_getattr,
    .readlink = NULL,
    .getdir = NULL,
    .mknod = NULL,
    .mkdir = lxcfs_mkdir,
    .unlink = NULL,
    .rmdir = lxcfs_rmdir,
    .symlink = NULL,
    .rename = NULL,
    .link = NULL,
    .chmod = lxcfs_chmod,
    .chown = lxcfs_chown,
    .truncate = lxcfs_truncate,
    .utime = NULL,

    .open = lxcfs_open,
    .read = lxcfs_read,
    .release = lxcfs_release,
    .write = lxcfs_write,

    .statfs = NULL,
    .flush = lxcfs_flush,
    .fsync = lxcfs_fsync,

    .setxattr = NULL,
    .getxattr = NULL,
    .listxattr = NULL,
    .removexattr = NULL,

    .opendir = lxcfs_opendir,
    .readdir = lxcfs_readdir,
    .releasedir = lxcfs_releasedir,

    .fsyncdir = NULL,
    .init = NULL,
    .destroy = NULL,
    .access = lxcfs_access,
    .create = NULL,
    .ftruncate = NULL,
    .fgetattr = NULL,
};
```

`fuse_operations`在文件`/usr/include/fuse/fuse.h`中定义。

## 参考

1. [kernel/Documentation/filesystems/fuse.txt][1]
2. [kernel/Documentation/filesystems/fuse-io.txt][2]
3. [lxc/lxcfs][3]
4. [示例代码：workspace/studys/study-libfuse/][4]

[1]: https://github.com/torvalds/linux/blob/master/Documentation/filesystems/fuse.txt "kernel/Documentation/filesystems/fuse.txt"
[2]: https://github.com/torvalds/linux/blob/master/Documentation/filesystems/fuse-io.txt "kernel/Documentation/filesystems/fuse-io.txt"
[3]: https://github.com/lxc/lxcfs "lxc/lxcfs"
[4]: https://github.com/lijiaocn/workspace/tree/master/studys/study-libfuse "示例代码：workspace/studys/study-libfuse/"
