"""Compatibility entry point: the selected folder is the source of truth."""
import subprocess,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[1]
node=shutil.which('node') or str(root/'.runtime/node.exe')
subprocess.run([node,str(root/'scripts/sync_selected_photos.mjs')],cwd=root,check=True)
