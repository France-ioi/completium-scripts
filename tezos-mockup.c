#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
#include <stdlib.h>
#include <string.h>

int main(int argc, char **argv) {
  setuid(0);

  char buf[4096];
  char *cmdline = buf;
  cmdline += sprintf(cmdline, "/usr/bin/docker exec tezos completium-cli mockup init");

  system(buf);
  return 0;
}
