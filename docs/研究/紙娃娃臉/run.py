"""Codex 生圖包裝：python run.py <名稱> <提示詞檔> <輸出資料夾> <參考圖 ...>
用 WS_codex_gen_image 的 chio.codex_gen，在 codex exec 後面加 -m gpt-6.1-terra 與輕度推理。
（gen_parts.py、gen_faces.py 都呼叫這支；要用 WS_codex_gen_image/.venv 的 python 執行）"""
import subprocess, sys
from pathlib import Path
sys.path.insert(0, r'D:/UserData/Documents/WS/WS_codex_gen_image')
from chio import codex_gen

_run = subprocess.run
def run(cmd, *a, **k):
    if len(cmd) > 1 and cmd[1] == 'exec':
        cmd = [cmd[0], 'exec', '-m', 'gpt-6.1-terra', '-c', 'model_reasoning_effort="low"', *cmd[2:]]
    return _run(cmd, *a, **k)
codex_gen.subprocess.run = run

name, prompt_file, out, *refs = sys.argv[1:]
final, record = codex_gen.generate(name, Path(prompt_file).read_text(encoding='utf-8'), refs, out)
print(record['status'], record['seconds'])
