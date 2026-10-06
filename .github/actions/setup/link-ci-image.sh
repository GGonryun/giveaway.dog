#!/usr/bin/env bash
set -euo pipefail

image_root=/opt/ci/workspace

while IFS= read -r dir; do
  mkdir -p "$image_root/$dir"
  for entry in "$dir"/* "$dir"/.[!.]* "$dir"/..?*; do
    if [ ! -e "$entry" ] && [ ! -L "$entry" ]; then
      continue
    fi
    name=${entry##*/}
    if [ "$name" = node_modules ] || [ -e "$image_root/$dir/$name" ]; then
      continue
    fi
    ln -s "$PWD/$entry" "$image_root/$dir/$name"
  done
  if [ -d "$image_root/$dir/node_modules" ]; then
    ln -s "$image_root/$dir/node_modules" "$dir/node_modules"
  fi
done < /opt/ci/importers

echo "Linked the node_modules of $(wc -l < /opt/ci/importers) workspace projects from the CI image"
