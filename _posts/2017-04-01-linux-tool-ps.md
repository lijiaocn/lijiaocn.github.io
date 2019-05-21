---
layout: default
title: "ps：Linux的ps等进程查看命令"
author: 李佶澳
createdate: 2017/04/26 17:18:17
changedate: 2018/07/22 14:57:01
categories: 技巧
tags: linuxtool
keywords: ps使用手册,http
description: 通过ps命令查看进程信息

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

ps是最常用的进程查看工具。

## 自定义输出

`-o`参数用来指定要显示的内容，例如：

	$ ps -o pid,stime,cmd
	  PID STIME CMD
	11176 06:33 sudo bash
	11177 06:33 bash
	11214 06:34 ps -o pid,stime,cmd


可以加上参数`e`查看所有进程：

	$ ps -eo pid,stime,cmd
	  PID STIME CMD
	    1 Jul19 /usr/lib/systemd/systemd --switched-root --system --deserialize 20
	    2 Jul19 [kthreadd]
	    3 Jul19 [ksoftirqd/0]
	    7 Jul19 [migration/0]
	    8 Jul19 [rcu_bh]
	...

在man ps中可以找到支持的输出的内容：

	%cpu        %CPU      cpu utilization of the process in "##.#" format.  Currently, it is the CPU time used
	                      divided by the time the process has been running (cputime/realtime ratio), expressed
	                      as a percentage.  It will not add up to 100% unless you are lucky.  (alias pcpu).
	%mem        %MEM      ratio of the process's resident set size  to the physical memory on the machine,
	                      expressed as a percentage.  (alias pmem).
	args        COMMAND   command with all its arguments as a string. Modifications to the arguments may be
	                      shown.  The output in this column may contain spaces.  A process marked <defunct> is
	                      partly dead, waiting to be fully destroyed by its parent.  Sometimes the process args
	                      will be unavailable; when this happens, ps will instead print the executable name in
	                      brackets.  (alias cmd, command).  See also the comm format keyword, the -f option, and
	                      the c option.
	                      When specified last, this column will extend to the edge of the display.  If ps can
	                      not determine display width, as when output is redirected (piped) into a file or
	                      another command, the output width is undefined (it may be 80, unlimited, determined by
	                      the TERM variable, and so on).  The COLUMNS environment variable or --cols option may
	                      be used to exactly determine the width in this case.  The w or -w option may be also
	                      be used to adjust width.
	blocked     BLOCKED   mask of the blocked signals, see signal(7).  According to the width of the field, a 32
	                      or 64-bit mask in hexadecimal format is displayed.  (alias sig_block, sigmask).
	bsdstart    START     time the command started.  If the process was started less than 24 hours ago, the
	                      output format is " HH:MM", else it is " Mmm:SS" (where Mmm is the three letters of the
	                      month).  See also lstart, start, start_time, and stime.
	bsdtime     TIME      accumulated cpu time, user + system.  The display format is usually "MMM:SS", but can
	                      be shifted to the right if the process used more than 999 minutes of cpu time.
	c           C         processor utilization. Currently, this is the integer value of the percent usage over
	                      the lifetime of the process.  (see %cpu).
	caught      CAUGHT    mask of the caught signals, see signal(7).  According to the width of the field, a 32
	                      or 64 bits mask in hexadecimal format is displayed.  (alias sig_catch, sigcatch).
	cgroup      CGROUP    display control groups to which the process belongs.
	class       CLS       scheduling class of the process.  (alias policy, cls).  Field's possible values are:
	                               -   not reported
	                               TS  SCHED_OTHER
	                               FF  SCHED_FIFO
	                               RR  SCHED_RR
	                               B   SCHED_BATCH
	                               ISO SCHED_ISO
	                               IDL SCHED_IDLE
	                               ?   unknown value
	cls         CLS       scheduling class of the process.  (alias policy, cls).  Field's possible values are:
	                               -   not reported
	                               TS  SCHED_OTHER
	                               FF  SCHED_FIFO
	                               RR  SCHED_RR
	                               B   SCHED_BATCH
	                               ISO SCHED_ISO
	                               IDL SCHED_IDLE
	                               ?   unknown value
	cmd         CMD       see args.  (alias args, command).
	comm        COMMAND   command name (only the executable name).  Modifications to the command name will not
	                      be shown.  A process marked <defunct> is partly dead, waiting to be fully destroyed by
	                      its parent.  The output in this column may contain spaces.  (alias ucmd, ucomm).  See
	                      also the args format keyword, the -f option, and the c option.
	                      When specified last, this column will extend to the edge of the display.  If ps can
	                      not determine display width, as when output is redirected (piped) into a file or
	                      another command, the output width is undefined (it may be 80, unlimited, determined by
	                      the TERM variable, and so on).  The COLUMNS environment variable or --cols option may
	                      be used to exactly determine the width in this case.  The w or -w option may be also
	                      be used to adjust width.
	command     COMMAND   See args.  (alias args, command).
	cp          CP        per-mill (tenths of a percent) CPU usage.  (see %cpu).
	cputime     TIME      cumulative CPU time, "[DD-]hh:mm:ss" format.  (alias time).
	drs         DRS       data resident set size, the amount of physical memory devoted to other than executable
	                      code.
	egid        EGID      effective group ID number of the process as a decimal integer.  (alias gid).
	egroup      EGROUP    effective group ID of the process.  This will be the textual group ID, if it can be
	                      obtained and the field width permits, or a decimal representation otherwise.  (alias
	                      group).
	eip         EIP       instruction pointer.
	esp         ESP       stack pointer.
	etime       ELAPSED   elapsed time since the process was started, in the form [[DD-]hh:]mm:ss.
	etimes      ELAPSED   elapsed time since the process was started, in seconds.
	euid        EUID      effective user ID (alias uid).
	euser       EUSER     effective user name.  This will be the textual user ID, if it can be obtained and the
	                      field width permits, or a decimal representation otherwise.  The n option can be used
	                      to force the decimal representation.  (alias uname, user).
	f           F         flags associated with the process, see the PROCESS FLAGS section.  (alias
	                      flag, flags).
	fgid        FGID      filesystem access group ID.  (alias fsgid).
	fgroup      FGROUP    filesystem access group ID.  This will be the textual group ID, if it can be obtained
	                      and the field width permits, or a decimal representation otherwise.  (alias fsgroup).
	flag        F         see f.  (alias f, flags).
	flags       F         see f.  (alias f, flag).
	fname       COMMAND   first 8 bytes of the base name of the process's executable file.  The output in this
	                      column may contain spaces.
	fuid        FUID      filesystem access user ID.  (alias fsuid).
	fuser       FUSER     filesystem access user ID.  This will be the textual user ID, if it can be obtained
	                      and the field width permits, or a decimal representation otherwise.
	gid         GID       see egid.  (alias egid).
	group       GROUP     see egroup.  (alias egroup).
	ignored     IGNORED   mask of the ignored signals, see signal(7).  According to the width of the field, a 32
	                      or 64 bits mask in hexadecimal format is displayed.  (alias sig_ignore, sigignore).
	ipcns       IPCNS     Unique inode number describing the namespace the process belongs to. See
	                      namespaces(7).
	label       LABEL     security label, most commonly used for SELinux context data.  This is for the
	                      Mandatory Access Control ("MAC") found on high-security systems.
	lstart      STARTED   time the command started.  See also bsdstart, start, start_time, and stime.
	lsession    SESSION   displays the login session identifier of a process, if systemd support has been
	                      included.
	lwp         LWP       light weight process (thread) ID of the dispatchable entity (alias spid, tid).  See
	                      tid for additional information.
	machine     MACHINE   displays the machine name for processes assigned to VM or container, if systemd
	                      support has been included.
	maj_flt     MAJFLT    The number of major page faults that have occurred with this process.
	min_flt     MINFLT    The number of minor page faults that have occurred with this process.
	mntns       MNTNS     Unique inode number describing the namespace the process belongs to. See
	                      namespaces(7).
	netns       NETNS     Unique inode number describing the namespace the process belongs to. See
	                      namespaces(7).
	ni          NI        nice value. This ranges from 19 (nicest) to -20 (not nice to others), see nice(1).
	                      (alias nice).
	nice        NI        see ni.(alias ni).
	nlwp        NLWP      number of lwps (threads) in the process.  (alias thcount).
	nwchan      WCHAN     address of the kernel function where the process is sleeping (use wchan if you want
	                      the kernel function name).  Running tasks will display a dash ('-') in this column.
	ouid        OWNER     displays the Unix user identifier of the owner of the session of a process, if systemd
	                      support has been included.
	pcpu        %CPU      see %cpu.  (alias %cpu).
	pending     PENDING   mask of the pending signals. See signal(7).  Signals pending on the process are
	                      distinct from signals pending on individual threads.  Use the m option or the -m
	                      option to see both.  According to the width of the field, a 32 or 64 bits mask in
	                      hexadecimal format is displayed.  (alias sig).
	pgid        PGID      process group ID or, equivalently, the process ID of the process group leader.  (alias
	                      pgrp).
	pgrp        PGRP      see pgid.  (alias pgid).
	pid         PID       a number representing the process ID (alias tgid).
	pidns       PIDNS     Unique inode number describing the namespace the process belongs to. See
	                      namespaces(7).
	pmem        %MEM      see %mem.  (alias %mem).
	policy      POL       scheduling class of the process.  (alias class, cls).  Possible values are:
	                               -   not reported
	                               TS  SCHED_OTHER
	                               FF  SCHED_FIFO
	                               RR  SCHED_RR
	                               B   SCHED_BATCH
	                               ISO SCHED_ISO
	                               IDL SCHED_IDLE
	                               ?   unknown value
	ppid        PPID      parent process ID.
	pri         PRI       priority of the process.  Higher number means lower priority.
	psr         PSR       processor that process is currently assigned to.
	rgid        RGID      real group ID.
	rgroup      RGROUP    real group name.  This will be the textual group ID, if it can be obtained and the
	                      field width permits, or a decimal representation otherwise.
	rss         RSS       resident set size, the non-swapped physical memory that a task has used (in
	                      kiloBytes).  (alias rssize, rsz).
	rssize      RSS       see rss.  (alias rss, rsz).
	rsz         RSZ       see rss.  (alias rss, rssize).
	rtprio      RTPRIO    realtime priority.
	ruid        RUID      real user ID.
	ruser       RUSER     real user ID.  This will be the textual user ID, if it can be obtained and the field
	                      width permits, or a decimal representation otherwise.
	s           S         minimal state display (one character).  See section PROCESS STATE CODES for the
	                      different values.  See also stat if you want additional information displayed.  (alias
	                      state).
	sched       SCH       scheduling policy of the process.  The policies SCHED_OTHER (SCHED_NORMAL),
	                      SCHED_FIFO, SCHED_RR, SCHED_BATCH, SCHED_ISO, and SCHED_IDLE are respectively
	                      displayed as 0, 1, 2, 3, 4, and 5.
	seat        SEAT      displays the identifier associated with all hardware devices assigned to a specific
	                      workplace, if systemd support has been included.
	sess        SESS      session ID or, equivalently, the process ID of the session leader.  (alias
	                      session, sid).
	sgi_p       P         processor that the process is currently executing on.  Displays "*" if the process is
	                      not currently running or runnable.
	sgid        SGID      saved group ID.  (alias svgid).
	sgroup      SGROUP    saved group name.  This will be the textual group ID, if it can be obtained and the
	                      field width permits, or a decimal representation otherwise.
	sid         SID       see sess.  (alias sess, session).
	sig         PENDING   see pending.  (alias pending, sig_pend).
	sigcatch    CAUGHT    see caught.  (alias caught, sig_catch).
	sigignore   IGNORED   see ignored.  (alias ignored, sig_ignore).
	sigmask     BLOCKED   see blocked.  (alias blocked, sig_block).
	size        SIZE      approximate amount of swap space that would be required if the process were to dirty
	                      all writable pages and then be swapped out.  This number is very rough!
	slice       SLICE     displays the slice unit which a process belongs to, if systemd support has been
	                      included.
	spid        SPID      see lwp.  (alias lwp, tid).
	stackp      STACKP    address of the bottom (start) of stack for the process.
	start       STARTED   time the command started.  If the process was started less than 24 hours ago, the
	                      output format is "HH:MM:SS", else it is "  Mmm dd" (where Mmm is a three-letter month
	                      name).  See also lstart, bsdstart, start_time, and stime.
	start_time  START     starting time or date of the process.  Only the year will be displayed if the process
	                      was not started the same year ps was invoked, or "MmmDD" if it was not started the
	                      same day, or "HH:MM" otherwise.  See also bsdstart, start, lstart, and stime.
	stat        STAT      multi-character process state.  See section PROCESS STATE CODES for the different
	                      values meaning.  See also s and state if you just want the first character displayed.
	state       S         see s. (alias s).
	suid        SUID      saved user ID.  (alias svuid).
	supgid      SUPGID    group ids of supplementary groups, if any.  See getgroups(2).
	supgrp      SUPGRP    group names of supplementary groups, if any.  See getgroups(2).
	suser       SUSER     saved user name.  This will be the textual user ID, if it can be obtained and the
	                      field width permits, or a decimal representation otherwise.  (alias svuser).
	svgid       SVGID     see sgid.  (alias sgid).
	svuid       SVUID     see suid.  (alias suid).
	sz          SZ        size in physical pages of the core image of the process.  This includes text, data,
	                      and stack space.  Device mappings are currently excluded; this is subject to change.
	                      See vsz and rss.
	tgid        TGID      a number representing the thread group to which a task belongs (alias pid).  It is the
	                      process ID of the thread group leader.
	thcount     THCNT     see nlwp.  (alias nlwp).  number of kernel threads owned by the process.
	tid         TID       the unique number representing a dispatchable entity (alias lwp, spid).  This value
	                      may also appear as: a process ID (pid); a process group ID (pgrp); a session ID for
	                      the session leader (sid); a thread group ID for the thread group leader (tgid); and a
	                      tty process group ID for the process group leader (tpgid).
	time        TIME      cumulative CPU time, "[DD-]HH:MM:SS" format.  (alias cputime).
	tname       TTY       controlling tty (terminal).  (alias tt, tty).
	tpgid       TPGID     ID of the foreground process group on the tty (terminal) that the process is connected
	                      to, or -1 if the process is not connected to a tty.
	trs         TRS       text resident set size, the amount of physical memory devoted to executable code.
	tt          TT        controlling tty (terminal).  (alias tname, tty).
	tty         TT        controlling tty (terminal).  (alias tname, tt).
	ucmd        CMD       see comm.  (alias comm, ucomm).
	ucomm       COMMAND   see comm.  (alias comm, ucmd).
	uid         UID       see euid.  (alias euid).
	uname       USER      see euser.  (alias euser, user).
	unit        UNIT      displays unit which a process belongs to, if systemd support has been included.
	user        USER      see euser.  (alias euser, uname).
	userns      USERNS    Unique inode number describing the namespace the process belongs to. See
	                      namespaces(7).
	utsns       UTSNS     Unique inode number describing the namespace the process belongs to. See
	                      namespaces(7).
	uunit       UUNIT     displays user unit which a process belongs to, if systemd support has been included.
	vsize       VSZ       see vsz.  (alias vsz).
	vsz         VSZ       virtual memory size of the process in KiB (1024-byte units).  Device mappings are
	                      currently excluded; this is subject to change.  (alias vsize).
	wchan       WCHAN     name of the kernel function in which the process is sleeping, a "-" if the process is
	                      running, or a "*" if the process is multi-threaded and ps is not displaying threads.
