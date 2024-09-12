#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
#include <stdlib.h>
#include <string.h>

int main(int argc, char **argv) {
  setuid(0);

  if (argc < 2)
    return 1;

  char buf[4096];
  char *cmdline = buf;
  if (argc > 2) {
    cmdline += sprintf(cmdline, "/bin/bash /tezos/tezos-shell.sh %s %s", argv[1], argv[2]);
  } else {
    cmdline += sprintf(cmdline, "/bin/bash /tezos/tezos-shell.sh %s", argv[1]);
  }

  system(buf);
  return 0;
}

/*
int main(int argc, char **argv) {
  const char *args[] = {"/bin/bash", "/tezos/tezos-shell.sh", &argv[1]};
  execvp("/bin/bash", args);
  return 0;
}*/
