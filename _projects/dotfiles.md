---
title: Dotfiles
discipline: software
kind: Configuration
status: ongoing
date: 2026-02-28
year: 2026
period: "2026"
summary: "My terminal and editor setup for macOS, Linux and Windows, installed and linked with a single bootstrap script."
platforms: [macOS, Linux, Windows]
stack: [Zsh, Neovim, tmux, Starship, WezTerm]
topics: [Developer tools, Terminal, Automation]
links:
  - { label: Repository, url: "https://github.com/haddagart/.dotfiles", icon: code, primary: true }
---
This is the configuration I use every day for my shell, editors and terminal tools, kept in one repository so a new machine feels familiar within minutes. A lightweight bootstrap script detects the operating system, installs the packages and links each file into place with symlinks.

## What is inside

- **Shell and prompt.** Zsh with plugins, and the Starship prompt. On Windows the setup uses Oh My Posh.
- **Editors.** Neovim (based on kickstart.nvim), a Vim configuration, and custom styles and scripts for VS Code.
- **Terminal.** A WezTerm configuration, tmux with its plugin manager, and Neofetch themes.
- **Small helpers.** A keychain helper that loads SSH keys, and structured JSON logging for the installer scripts.
- **Package lists per system.** Homebrew on macOS, apt, dnf or pacman on Linux, and winget on Windows.

## How it works

Each folder can declare its links in a `links.prop` file, one line per file, in the form `source = destination`. The bootstrap script finds every `links.prop` and creates the symlinks, so adding a new tool means adding one line. A separate, optional script applies macOS system preferences, and it asks before changing anything.

## Quick start

```sh
git clone --recurse-submodules https://github.com/haddagart/.dotfiles ~/.dotfiles
bash ~/.dotfiles/install/init.sh
```

The repository also holds short guides on Neovim and on macOS preferences.
