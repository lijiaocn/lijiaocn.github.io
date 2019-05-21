---
layout: default
title: "Lxcfs根据cpu-share、cpu-quota等cgroup信息生成容器内的/proc文件（上）"
author: 李佶澳
createdate: "2019-02-11 10:49:45 +0800"
changedate: "2019-02-21 13:47:36 +0800"
categories: 技巧
tags: cgroup docker
keywords: lxcfs,cgroup,cpu-share,cpu-quota,
description: 使用lxcfs，在容器中看到的还是宿主机的CPU状态，如何按照cpu-share和cpu-quota展示容器的cpu状态？
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

在[lxcfs是什么？通过lxcfs在容器内显示容器的CPU、内存状态][1] 中遇到一个问题：

	使用lxcfs之后，在容器中看到CPU状态还是宿主机的CPU状态。

研究一下，看看是否可以通过修改lxcfs，支持按照cpu-share和cpu-quota展示容器的cpu状态。计划写两篇笔记，这是第一篇，先学习一下lxcfs的实现。

**相关笔记**：

[Lxcfs根据cpu-share、cpu-quota等cgroup信息生成容器内的/proc文件（上）](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/11/lxcfs-support-cpu-share-and-cpu-quota-1.html)

[Lxcfs根据cpu-share、cpu-quota等cgroup信息生成容器内的/proc文件（中）](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/15/lxcfs-support-cpu-share-and-cpu-quota-2.html)

[Lxcfs根据cpu-share、cpu-quota等cgroup信息生成容器内的/proc文件（下）](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/21/lxcfs-support-cpu-share-and-cpu-quota-3.html)

[Lxcfs是什么？怎样通过lxcfs在容器内显示容器的CPU、内存状态](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/09/kubernetes-lxcfs-docker-container.html)

[Linux的cgroup功能（三）：cgroup controller汇总和控制器的参数（文件接口）](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/18/linux-tool-cgroup-parameters.html)

[Linux的cgroup功能（二）：资源限制cgroup v1和cgroup v2的详细介绍](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/28/linux-tool-cgroup-detail.html)

[Linux的cgroup功能（一）：初级入门使用方法](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/07/26/linux-tool-cgroup.html)

## libfuse的使用方法

[lxcfs][1]是用libfuse实现的用户空间的虚拟文件系统，要动lxcfs的代码，必须要先学会用libfuse。

libfuse的学习笔记：[Linux FUSE（用户态文件系统）的使用：用libfuse创建FUSE文件系统][3]。

## cgroup

搞定了[libfuse][3]之后，还需要搞定cgroup。要把cgroup中的信息“翻译”成容器自己的`/proc`文件中的内容，必须熟悉cgroup目录的关联关系，以及每个相关的参数的含义。

cgroup的学习笔记：

1. [Linux中cgroup的初级使用方法][2],

2. [Linux的资源限制功能cgroups v1和cgroups v2的详细介绍][4]。

## lxcfs的实现（源码分析）

掌握了libfuse和cgroup之后就可以按照自己的意图修改lxcfs了。 

这里在lxcfs-3.0.3的基础上修改，修改之前，先学习一下lxcfs的实现。

```
[root@10.10.64.58 lxcfs]# git branch
* (HEAD detached at lxcfs-3.0.3)
  master
```

主要关注`.open`和`.read`操作（需要修改的是.read操作，但是为了多了解一下lxcfs的实现，顺便将open操作的实现学习一下） ：

```c
// lxcfs.c: 717
const struct fuse_operations lxcfs_ops = {
     // ... 省略 ...
     .open = lxcfs_open,
     .read = lxcfs_read,
     // ... 省略 ...
}
```

## Open操作：lxcfs_open

```c
// lxcfs.c: 550
static int lxcfs_open(const char *path, struct fuse_file_info *fi)
{
    int ret;
    if (strncmp(path, "/cgroup", 7) == 0) {
        up_users();                    //用户计数器加1
        ret = do_cg_open(path, fi);
        down_users();                  //用户计数器减1
        return ret;
    }
    if (strncmp(path, "/proc", 5) == 0) {
        up_users();                    //用户计数器加1
        ret = do_proc_open(path, fi);
        down_users();                  //用户计数器减1
        return ret;
    }

    return -EACCES;
}
```

### Open操作之：目标文件信息

`lxcfs_open()`的第一个参数是要打开的文件的完整路径，这没什么好说的，重点是第二个参数`struct fuse_file_info *fi`。

fi中包含了目标文件的大量信息：

```c
// /usr/include/fuse/fuse_common.h: 45
struct fuse_file_info {
    /** Open flags.  Available in open() and release() */
    int flags;

    /** Old file handle, don't use */
    unsigned long fh_old;

    /** In case of a write operation indicates if this was caused by a
        writepage */
    int writepage;

    /** Can be filled in by open, to use direct I/O on this file.
        Introduced in version 2.4 */
    unsigned int direct_io : 1;

    /** Can be filled in by open, to indicate, that cached file data
        need not be invalidated.  Introduced in version 2.4 */
    unsigned int keep_cache : 1;

    /** Indicates a flush operation.  Set in flush operation, also
        maybe set in highlevel lock operation and lowlevel release
        operation.  Introduced in version 2.6 */
    unsigned int flush : 1;

    /** Can be filled in by open, to indicate that the file is not
        seekable.  Introduced in version 2.8 */
    unsigned int nonseekable : 1;

    /* Indicates that flock locks for this file should be
       released.  If set, lock_owner shall contain a valid value.
       May only be set in ->release().  Introduced in version
       2.9 */
    unsigned int flock_release : 1;

    /** Padding.  Do not use*/
    unsigned int padding : 27;

    /** File handle.  May be filled in by filesystem in open().
        Available in all other file operations */
    uint64_t fh;

    /** Lock owner id.  Available in locking operations and flush */
    uint64_t lock_owner;
};
```

### Open操作之：/proc目录的处理：do_proc_open

cpu、内存等信息都是从/proc目录中读取的，因此这里重点关注`do_proc_open`的实现。

do_proc_open最终调用的是`proc_open()`：

```c
// lxcfs/bindings.c：4174
int proc_open(const char *path, struct fuse_file_info *fi)
{
    int type = -1;
    struct file_info *info;

    if (strcmp(path, "/proc/meminfo") == 0)
        type = LXC_TYPE_PROC_MEMINFO;
    else if (strcmp(path, "/proc/cpuinfo") == 0)
        type = LXC_TYPE_PROC_CPUINFO;
    else if (strcmp(path, "/proc/uptime") == 0)
        type = LXC_TYPE_PROC_UPTIME;
    else if (strcmp(path, "/proc/stat") == 0)
        type = LXC_TYPE_PROC_STAT;
    else if (strcmp(path, "/proc/diskstats") == 0)
        type = LXC_TYPE_PROC_DISKSTATS;
    else if (strcmp(path, "/proc/swaps") == 0)
        type = LXC_TYPE_PROC_SWAPS;
    if (type == -1)
        return -ENOENT;

    info = malloc(sizeof(*info));
    if (!info)
        return -ENOMEM;

    memset(info, 0, sizeof(*info));
    info->type = type;

    info->buflen = get_procfile_size(path) + BUF_RESERVE_SIZE;
    do {
        info->buf = malloc(info->buflen);
    } while (!info->buf);
    memset(info->buf, 0, info->buflen);
    /* set actual size to buffer size */
    info->size = info->buflen;

    fi->fh = (unsigned long)info;
    return 0;
}
```

从上面代码中可以看到，根据文件路径选择的操作类型 `LXC_TYPE_PROC_XXXX` 和新建的数据缓冲区`buf`，都被填入`info`中，最终保留在`fi->fh`中。

在后面读取文件内容时，会从`fi->fh`中取出操作类型和缓存区地址。.open操作主要就是准备数据缓冲区。

## Read操作：lxcfs_read

```c
// lxcfs/lxcfs.c: 569
static int lxcfs_read(const char *path, char *buf, size_t size, off_t offset,
        struct fuse_file_info *fi)
{
    int ret;
    if (strncmp(path, "/cgroup", 7) == 0) {
        up_users();
        ret = do_cg_read(path, buf, size, offset, fi);
        down_users();
        return ret;
    }
    if (strncmp(path, "/proc", 5) == 0) {
        up_users();
        ret = do_proc_read(path, buf, size, offset, fi);
        down_users();
        return ret;
    }

    return -EINVAL;
}
```

传入参数增加了`buf`、`size`和`offset`。 

### Read操作之：/proc目录的处理：do_proc_read

```c
// lxcfs/bindings.c：4230
int proc_read(const char *path, char *buf, size_t size, off_t offset,
        struct fuse_file_info *fi)
{
    struct file_info *f = (struct file_info *) fi->fh;

    switch (f->type) {
    case LXC_TYPE_PROC_MEMINFO:
        return proc_meminfo_read(buf, size, offset, fi);
    case LXC_TYPE_PROC_CPUINFO:
        return proc_cpuinfo_read(buf, size, offset, fi);
    case LXC_TYPE_PROC_UPTIME:
        return proc_uptime_read(buf, size, offset, fi);
    case LXC_TYPE_PROC_STAT:
        return proc_stat_read(buf, size, offset, fi);
    case LXC_TYPE_PROC_DISKSTATS:
        return proc_diskstats_read(buf, size, offset, fi);
    case LXC_TYPE_PROC_SWAPS:
        return proc_swaps_read(buf, size, offset, fi);
    default:
        return -EINVAL;
    }
}
```

这里根据`f->type`的值调用不同的处理函数，`f->type`是在.open操作时设置的。

### Read操作之：cpuinfo的读取：proc_cpuinfo_read

代码细节太多，不全部展开了，这里只记录主要流程，分析最重要的地方。

proc_cpuinfo_read的工作流程是这样的：

1、 调用`fuse_get_context()`获得正在发起读请求的进程号current_pid，current_pid是lxcfs所在namespace中的进程号，不是容器中看到的进程号。

```c
//fc->pid就是发起读请求的进程的进程号
struct fuse_context *fc = fuse_get_context();
```

2、 通过current_pid查到它所在的namespaces中，也就是容器中的1号进程的在lxcfs所在的namespace中的进程号init_pid。

```c
pid_t initpid = lookup_initpid_in_store(fc->pid);
```

3、 读取/proc/[init_pid]/cgroup文件，到其中指定的cgroup目录中读取资源信息。

最关键的是第二步：怎样获取容器中的1号进程在容器外的进程号？

#### 怎样获取容器中的1号进程在容器外的进程号？

这一步在`lookup_initpid_in_store()`中实现。

```c
// lxcfs/bindings.c: 1080
static pid_t lookup_initpid_in_store(pid_t qpid)
{
    pid_t answer = 0;
    struct stat sb;
    struct pidns_init_store *e;
    char fnam[100];

    snprintf(fnam, 100, "/proc/%d/ns/pid", qpid);
    store_lock();
    if (stat(fnam, &sb) < 0)
        goto out;
    e = lookup_verify_initpid(&sb);
    if (e) {
        answer = e->initpid;
        goto out;
    }
    answer = get_init_pid_for_task(qpid);
    if (answer > 0)
        save_initpid(&sb, answer);

out:
    /* we prune at end in case we are returning
     * the value we were about to return */
    prune_initpid_store();
    store_unlock();
    return answer;
}
```

`lookup_verify_initpid(&sb)`是查找缓存的结果，不是根本方法，略过。

`get_init_pid_for_task(qpid)`是关键，它是这样实现的：

1. 创建一个socketpair（一对socket），sock[0]和sock[1]；
2. 用fork创建一个子进程，父进程准备从sock[1]中读数据，子进程准备向sock[0]写数据；
3. 子进程不是直接向sock[0]写数据的，而是用clone()又创建了一个孙进程，孙进程负责写；
4. 孙进程先被绑定到了发起读请求的进程所在的namespace，也就是绑定到了容器的namespace；
5. 孙进程成为容器中的进程后，开始向socket写入数据，它使用了socket的控制头；
6. 孙进程写入socket的控制头中填写的发送者进程号是1，即容器中的1号进程；
7. 父进程（lxcfs进程）从socket中收到孙进程发来的控制头；
8. 父进程看到的控制头中的发送者进程不是1，而是容器的1号进程在容器外的进程号！

可以通过gdb验证这个过程：

```bash
(gdb) b proc_cpuinfo_read   # 打断点
Function "proc_cpuinfo_read" not defined.
Make breakpoint pending on future shared library load? (y or [n]) y
Breakpoint 1 (proc_cpuinfo_read) pending.
(gdb) start  -d  /var/lib/lxcfs
Temporary breakpoint 2 at 0x400d60: file lxcfs.c, line 845.
...
Breakpoint 1, proc_read (path=0x7fffe8000990 "/proc/cpuinfo", buf=0x7fffe8000ee0 "\220\n", size=8192, offset=0, fi=0x7ffff6795cf0) at bindings.c:4239
4239			return proc_cpuinfo_read(buf, size, offset, fi);
(gdb) s
proc_cpuinfo_read (fi=0x7ffff6795cf0, offset=0, size=8192, buf=0x7fffe8000ee0 "\220\n") at bindings.c:3321
...
(gdb) n
3333		if (offset){
(gdb) print *fc             # 发起读请求的进程的进程号是11711，不是在容器中看到的进程号！
$1 = {fuse = 0x605d40, uid = 0, gid = 0, pid = 11711, private_data = 0x0, umask = 0}
(gdb) 
gdb) s
proc_cpuinfo_read (fi=<optimized out>, offset=0, size=8192, buf=0x7fffe8000ee0 "\220\n") at bindings.c:3344
3344		pid_t initpid = lookup_initpid_in_store(fc->pid);
...
3345		if (initpid <= 0)
(gdb) print *fc
$2 = {fuse = 0x605d40, uid = 0, gid = 0, pid = 11711, private_data = 0x0, umask = 0}
(gdb) print initpid        # 父进程从socket读到的进程号是11609，不是孙进程中发送时填入的1！
$3 = 11609
```

下面是`get_init_pid_for_task()`的实现代码，子进程调用`write_task_init_pid_exit(sock[0], task)`：

```c
// lxcfs/bindings.c: 1046
static pid_t get_init_pid_for_task(pid_t task)
{
    int sock[2];
    pid_t pid;
    pid_t ret = -1;
    char v = '0';
    struct ucred cred;

    if (socketpair(AF_UNIX, SOCK_DGRAM, 0, sock) < 0) {
        perror("socketpair");
        return -1;
    }

    pid = fork();
    if (pid < 0)
        goto out;
    if (!pid) {
        close(sock[1]);
        // 子进程调用函数，写入sock[0]
        write_task_init_pid_exit(sock[0], task);
        _exit(0);
    }

    if (!recv_creds(sock[1], &cred, &v))
        goto out;
    ret = cred.pid;

out:
    close(sock[0]);
    close(sock[1]);
    if (pid > 0)
        wait_for_pid(pid);
    return ret;
}
```

下面是`write_task_init_pid_exit()`的实现代码，`send_creds_clone_wrapper()`被传给孙进程执行：

```c
// lxcfs/bindings.c: 999
static void write_task_init_pid_exit(int sock, pid_t target)
{
    char fnam[100];
    pid_t pid;
    int fd, ret;
    size_t stack_size = sysconf(_SC_PAGESIZE);
    void *stack = alloca(stack_size);
    
    //获取发起读请求的进程的namespace，也就是容器的namespace
    ret = snprintf(fnam, sizeof(fnam), "/proc/%d/ns/pid", (int)target);
    if (ret < 0 || ret >= sizeof(fnam))
        _exit(1);

    fd = open(fnam, O_RDONLY);
    if (fd < 0) {
        perror("write_task_init_pid_exit open of ns/pid");
        _exit(1);
    }
    // 绑定到容器的namespace
    if (setns(fd, 0)) {
        perror("write_task_init_pid_exit setns 1");
        close(fd);
        _exit(1);
    }
    // 传给孙进程执行
    pid = clone(send_creds_clone_wrapper, stack + stack_size, SIGCHLD, &sock);
    if (pid < 0)
        _exit(1);
    if (pid != 0) {
        if (!wait_for_pid(pid))
            _exit(1);
        _exit(0);
    }
}
```

在`send_creds_clone_wrapper()`的实现中，可以看到传入的cred.pid=`1`：

```c
// lxcfs/bindings.c：1031
static int send_creds_clone_wrapper(void *arg) {
    struct ucred cred;
    char v;
    int sock = *(int *)arg;

    /* we are the child */
    cred.uid = 0;
    cred.gid = 0;
    cred.pid = 1;      //传入的进程号是1
    v = '1';
    if (send_creds(sock, &cred, v, true) != SEND_CREDS_OK)
        return 1;
    return 0;
}
```

最后是向socket写入：

```c
// lxcfs/bindings.c：2053
static int send_creds(int sock, struct ucred *cred, char v, bool pingfirst)
{
    struct msghdr msg = { 0 };
    struct iovec iov;
    struct cmsghdr *cmsg;
    char cmsgbuf[CMSG_SPACE(sizeof(*cred))];
    char buf[1];
    buf[0] = 'p';

    if (pingfirst) {
        if (msgrecv(sock, buf, 1) != 1) {
            lxcfs_error("%s\n", "Error getting reply from server over socketpair.");
            return SEND_CREDS_FAIL;
        }
    }

    msg.msg_control = cmsgbuf;
    msg.msg_controllen = sizeof(cmsgbuf);

    cmsg = CMSG_FIRSTHDR(&msg);
    cmsg->cmsg_len = CMSG_LEN(sizeof(struct ucred));
    cmsg->cmsg_level = SOL_SOCKET;
    cmsg->cmsg_type = SCM_CREDENTIALS;
    memcpy(CMSG_DATA(cmsg), cred, sizeof(*cred));

    msg.msg_name = NULL;
    msg.msg_namelen = 0;

    buf[0] = v;
    iov.iov_base = buf;
    iov.iov_len = sizeof(buf);
    msg.msg_iov = &iov;
    msg.msg_iovlen = 1;

    if (sendmsg(sock, &msg, 0) < 0) {
        lxcfs_error("Failed at sendmsg: %s.\n",strerror(errno));
        if (errno == 3)
            return SEND_CREDS_NOTSK;
        return SEND_CREDS_FAIL;
    }

    return SEND_CREDS_OK;
}
```

父进程的接收实现：

```
// lxcfs/bindings.c: 2097
static bool recv_creds(int sock, struct ucred *cred, char *v)
{
    struct msghdr msg = { 0 };
    struct iovec iov;
    struct cmsghdr *cmsg;
    char cmsgbuf[CMSG_SPACE(sizeof(*cred))];
    char buf[1];
    int ret;
    int optval = 1;

    *v = '1';

    cred->pid = -1;
    cred->uid = -1;
    cred->gid = -1;

    if (setsockopt(sock, SOL_SOCKET, SO_PASSCRED, &optval, sizeof(optval)) == -1) {
        lxcfs_error("Failed to set passcred: %s\n", strerror(errno));
        return false;
    }
    buf[0] = '1';
    if (write(sock, buf, 1) != 1) {
        lxcfs_error("Failed to start write on scm fd: %s\n", strerror(errno));
        return false;
    }

    msg.msg_name = NULL;
    msg.msg_namelen = 0;
    msg.msg_control = cmsgbuf;
    msg.msg_controllen = sizeof(cmsgbuf);

    iov.iov_base = buf;
    iov.iov_len = sizeof(buf);
    msg.msg_iov = &iov;
    msg.msg_iovlen = 1;

    if (!wait_for_sock(sock, 2)) {
        lxcfs_error("Timed out waiting for scm_cred: %s\n", strerror(errno));
        return false;
    }
    ret = recvmsg(sock, &msg, MSG_DONTWAIT);
    if (ret < 0) {
        lxcfs_error("Failed to receive scm_cred: %s\n", strerror(errno));
        return false;
    }

    cmsg = CMSG_FIRSTHDR(&msg);

    if (cmsg && cmsg->cmsg_len == CMSG_LEN(sizeof(struct ucred)) &&
            cmsg->cmsg_level == SOL_SOCKET &&
            cmsg->cmsg_type == SCM_CREDENTIALS) {
        memcpy(cred, CMSG_DATA(cmsg), sizeof(*cred));
    }
    *v = buf[0];

    return true;
}
```

#### 从cgroup中读取cpuinfo

通过上一节的操作找到了容器中1号进程在容器外的进程号，数据的时候就从这个进程对应的/proc目录中查取。

对于cpuinfo，lxcfs当前的实现是：从/proc/XX/cgroup中，`cpuset`controller的路径里读取。

```c
// lxcfs/bindings.c: 3347
cg = get_pid_cgroup(initpid, "cpuset");    // cg就是/proc/XX/cgroup中"cpuset"对应的路径
if (!cg)
    return read_file("proc/cpuinfo", buf, size, d);
prune_init_slice(cg);
```

进程的cgroup文件内容格式如下：

```sh
sh-4.2# cat /proc/1/cgroup
11:blkio:/docker/919149c7a5de3c7c6ef3d5ac2c371ab284bed33734e6167b5c5adbeec1baa98a
10:freezer:/docker/919149c7a5de3c7c6ef3d5ac2c371ab284bed33734e6167b5c5adbeec1baa98a
9:net_prio,net_cls:/docker/919149c7a5de3c7c6ef3d5ac2c371ab284bed33734e6167b5c5adbeec1baa98a
8:devices:/docker/919149c7a5de3c7c6ef3d5ac2c371ab284bed33734e6167b5c5adbeec1baa98a
7:cpuset:/docker/919149c7a5de3c7c6ef3d5ac2c371ab284bed33734e6167b5c5adbeec1baa98a
6:memory:/docker/919149c7a5de3c7c6ef3d5ac2c371ab284bed33734e6167b5c5adbeec1baa98a
5:perf_event:/docker/919149c7a5de3c7c6ef3d5ac2c371ab284bed33734e6167b5c5adbeec1baa98a
4:pids:/docker/919149c7a5de3c7c6ef3d5ac2c371ab284bed33734e6167b5c5adbeec1baa98a
3:cpuacct,cpu:/docker/919149c7a5de3c7c6ef3d5ac2c371ab284bed33734e6167b5c5adbeec1baa98a
2:hugetlb:/docker/919149c7a5de3c7c6ef3d5ac2c371ab284bed33734e6167b5c5adbeec1baa98a
1:name=systemd:/docker/919149c7a5de3c7c6ef3d5ac2c371ab284bed33734e6167b5c5adbeec1baa98a
```

对于`/proc/cpuinfo`，lxcfs先从`/sys/fs/cgroup/cpuset/docker/919149...a98a/cpuset.cpus`中读到容器中可用的cpu，例如`0-3`，然后将这几个cpu在/proc/cpuinfo中对应的数据读取出来返回。

这个过程中没有考虑容器分配到的cpu份额，所以在容器内看到的cpu个数和宿主机上的cpu个数是相同的。

根据cpu-share和cpu-quota显示cpu信息的问题在[Does lxcfs have plans to support cpu-shares and cpu-quota?](https://github.com/lxc/lxcfs/issues/239)中有讨论。[aither64](https://github.com/aither64)修改lxcfs的实现，实现了按照容器的cpu配额计算应该展现的cpu的数量，见[aither64/lxcfs][5]：

>Yes, I have it [implemented](https://github.com/lxc/lxcfs/compare/master...aither64:cpu-views), but I haven't gotten around to cleaning it up and making a PR yet. It works with CPU quotas set e.g. using `lxc.cgroup.cpu.cfs_{quota,period}_us`, CPU shares didn't make sense to me.

```bash
git clone https://github.com/aither64/lxcfs.git
cd lxcfs
git  branch  cpu-views -t  origin/cpu-views
git checkout   cpu-views
```

lxc/lxcfs的master分支已经合入了aither64的修改，stable-3.0和stable-2.0分支没有合入：[Merge pull request #260 from aither64/cpu-views ](https://github.com/lxc/lxcfs/commit/ea1e6b3776221917464c7dd70d179409719dc41c)。

## lxcfs能够提供的/proc文件

读取其它/proc文件的过程类似，不一一列举了，这里汇总一下lxcfs提供的proc文件：

```
$ ls /var/lib/lxcfs/proc/
cpuinfo  diskstats  loadavg  meminfo  stat  swaps  uptime
```

原则上这些文件都可以挂载到容器中，覆盖容器中的原有文件，例如：

```sh
docker run -it --rm -m 256m  --cpus 2 --cpuset-cpus "0,1" \
      -v /var/lib/lxcfs/proc/cpuinfo:/proc/cpuinfo:rw \
      -v /var/lib/lxcfs/proc/diskstats:/proc/diskstats:rw \
      -v /var/lib/lxcfs/proc/meminfo:/proc/meminfo:rw \
      -v /var/lib/lxcfs/proc/stat:/proc/stat:rw \
      -v /var/lib/lxcfs/proc/swaps:/proc/swaps:rw \
      -v /var/lib/lxcfs/proc/uptime:/proc/uptime:rw \
      centos:latest /bin/sh
```

注意上面没有挂载`loadavg`文件，docker版本是18.03时，如果挂载/proc/loadavg，容器启动会出错：

```
-v /var/lib/lxcfs/proc/loadavg:/proc/loadavg:rw \
```

错误如下：

	docker: Error response from daemon: 
	OCI runtime create failed: container_linux.go:348: starting container process caused "process_linux.go:402: 
	container init caused \"rootfs_linux.go:58: mounting \\\"/var/lib/lxcfs/proc/loadavg\\\" to rootfs \\\
	"/data/docker/overlay2/00a7e88464953f4e8c433c3d24974e01153fda64e00c00f3f98b150d954b6241/merged\\\" at 
	\\\"/proc/loadavg\\\" caused \\\"\\\\\\\"/data/docker/overlay2/00a7e88464953f4e8c433c3d24974e01153fda64e00c00f3f98b150d954b6241/merged/proc/loadavg\\\\\\\" 
	cannot be mounted because it is located inside \\\\\\\"/proc\\\\\\\"\\\"\"": unknown.

[网易云博客：Docker 容器的显示问题及修复][6]遇到了同样的问题，说是因为`Docker不允许在proc目录下随意挂文件`，为了规避这个问题，需要修改Docker依赖项目runc的代码：

`@2019-02-14 18:17:34 runc的master分支中已经允许/proc/loadavg了`：[runc/libcontainer/rootfs_linux.go](https://github.com/opencontainers/runc/blob/master/libcontainer/rootfs_linux.go)

```go
// runc/libcontainer/rootfs_linux.go
func checkMountDestination(rootfs, dest string) error {
	invalidDestinations := []string{
		"/proc",
	}
	// White list, it should be sub directories of invalid destinations
	validDestinations := []string{
		// These entries can be bind mounted by files emulated by fuse,
		// so commands like top, free displays stats in container.
		"/proc/cpuinfo",
		"/proc/diskstats",
		"/proc/meminfo",
		"/proc/stat",
		"/proc/swaps",
		"/proc/uptime",
		"/proc/loadavg",      // @2019-02-14 18:17:34 runc的master分支中已经允许/proc/loadavg了
		"/proc/net/dev",    
}
```

## 部分/proc文件的含义

来自`man proc`。

**/proc/cpuinfo**，used by command `lscpu`：

	This is a collection of CPU and system architecture dependent items, for each supported  archi‐
	tecture  a  different  list.   Two  common  entries  are  processor  which gives CPU number and
	bogomips; a system constant that is calculated during kernel initialization.  SMP machines have
	information for each CPU.  The lscpu(1) command gathers its information from this file.

**/proc/diskstats**：

	This file contains disk I/O statistics for each disk device.  See the Linux kernel source  file
	Documentation/iostats.txt for further information.

**/proc/meminfo**，used by command `free`：

	This file reports statistics about memory usage on the system.  It is used by free(1) to report
	the amount of free and used memory (both physical and swap) on the system as well as the shared
	memory  and  buffers  used  by the kernel.  Each line of the file consists of a parameter name,
	followed by a colon, the value of the parameter, and  an  option  unit  of  measurement  (e.g.,
	"kB").   The list below describes the parameter names and the format specifier required to read
	the field value.  Except as noted below, all of the fields have been  present  since  at  least
	Linux 2.6.0.  Some fileds are displayed only if the kernel was configured with various options;
	those dependencies are noted in the list.

**/proc/stat**：

	kernel/system statistics.  Varies with architecture.  Common entries include:
	cpu  3357 0 4313 1362393
	       The amount of time, measured in units of USER_HZ (1/100ths of a second on most architec‐
	       tures,  use  sysconf(_SC_CLK_TCK)  to  obtain the right value), that the system spent in
	       various states:
	
	page 5741 1808
	       The number of pages the system paged in and the number that were paged out (from disk).
	
	swap 1 0
	       The number of swap pages that have been brought in and out.
	
	intr 1462898
	       This line shows counts of interrupts serviced since boot time, for each of the  possible
	       system  interrupts.  The first column is the total of all interrupts serviced; each sub‐
	       sequent column is the total for a particular interrupt.
	
	disk_io: (2,0):(31,30,5764,1,2) (3,0):...
	       (major,disk_idx):(noinfo, read_io_ops, blks_read, write_io_ops, blks_written)
	       (Linux 2.4 only)
	
	ctxt 115315
	       The number of context switches that the system underwent.
	
	btime 769041601
	       boot time, in seconds since the Epoch, 1970-01-01 00:00:00 +0000 (UTC).
	
	processes 86031
	       Number of forks since boot.
	
	procs_running 6
	       Number of processes in runnable state.  (Linux 2.5.45 onward.)
	
	procs_blocked 2
	       Number of processes blocked waiting for I/O to complete.  (Linux 2.5.45 onward.)

**/proc/swaps**：

	Swap areas in use.  See also swapon(8).

**/proc/uptime**：

	This  file  contains  two  numbers:  the uptime of the system (seconds), and the amount of time
	spent in idle process (seconds).

**/proc/loadavg**：

	The  first  three fields in this file are load average figures giving the number of jobs in the
	run queue (state R) or waiting for disk I/O (state D) averaged over 1, 5, and 15 minutes.  They
	are  the  same  as  the load average numbers given by uptime(1) and other programs.  The fourth
	field consists of two numbers separated by a slash (/).  The first of these is  the  number  of
	currently  runnable kernel scheduling entities (processes, threads).  The value after the slash
	is the number of kernel scheduling entities that currently exist  on  the  system.   The  fifth
	field is the PID of the process that was most recently created on the system.

**/proc/net/dev**：

	The dev pseudo-file contains network device status  information.   This  gives  the  number  of
	received  and  sent  packets,  the  number of errors and collisions and other basic statistics.
	These are used by the ifconfig(8) program to report device status.  The format is:
	
	 Inter-|   Receive                                                |  Transmit
	 face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
	   lo: 2776770   11307    0    0    0     0          0         0  2776770   11307    0    0    0     0       0          0
	 eth0: 1215645    2751    0    0    0     0          0         0  1782404    4324    0    0    0   427       0          0
	 ppp0: 1622270    5552    1    0    0     0          0         0   354130    5669    0    0    0     0       0          0
	 tap0:    7714      81    0    0    0     0          0         0     7714      81    0    0    0     0       0          0

## 下篇

下篇分析proc文件的内容是怎么生成的：[lxcfs（二）：根据cpu-share、cpu-quota等cgroup信息生成容器内的/proc文件（下）](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/15/lxcfs-support-cpu-share-and-cpu-quota-2.html#aither64%E5%AF%B9procstat%E7%9A%84%E4%BF%AE%E6%AD%A3)

## 参考

1. [LXCFS是什么？通过LXCFS在容器内显示容器的CPU、内存状态][1]
2. [Linux中cgroup的使用方法][2]
3. [Linux FUSE（用户态文件系统）的使用：用libfuse创建FUSE文件系统][3]
4. [Linux的资源限制功能cgroups v1和cgroups v2的详细介绍][4]
5. [aither64/lxcfs][5]
6. [网易云博客：Docker 容器的显示问题及修复][6]

[1]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/09/kubernetes-lxcfs-docker-container.html "LXCFS是什么？通过LXCFS在容器内显示容器的CPU、内存状态"
[2]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/07/26/linux-tool-cgroup.html "Linux中cgroup的使用方法"
[3]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/21/linux-fuse-filesystem-in-userspace-usage.html "Linux FUSE（用户态文件系统）的使用：用libfuse创建FUSE文件系统"
[4]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/28/linux-tool-cgroup-detail.html "Linux的资源限制功能cgroups v1和cgroups v2的详细介绍"
[5]: https://github.com/aither64/lxcfs  "aither64/lxcfs"
[6]: https://sq.163yun.com/blog/article/155817999160799232  "网易云博客：Docker 容器的显示问题及修复"
