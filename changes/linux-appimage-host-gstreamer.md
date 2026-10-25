---
type: fix
impact: 4
highlight: true
---
The Linux AppImage opens on newer distros and plays audio again

The AppImage no longer fails to start on Debian 13 and other recent distros, and audio inside the app works on all of them, including Arch. On NVIDIA, the app turns off the driver's explicit sync itself, so you no longer need to set `__NV_DISABLE_EXPLICIT_SYNC=1`.
