#!/usr/bin/env python3
"""把 Google 雲端硬碟「管理員專用」資料夾裡的圖片同步成網站用的 WebP。

只在 GitHub Action（.github/workflows/sync-images.yml）裡執行；網站本身仍是純靜態。

用法：
  # 連 Google 雲端硬碟（需要環境變數 GDRIVE_SA_KEY 與 GDRIVE_ROOT_FOLDER_ID）
  python tools/sync_drive_images.py

  # 測試用：從本機資料夾讀相同結構，不連 Google
  python tools/sync_drive_images.py --local <資料夾>

GDRIVE_SA_KEY         service account 的 JSON 金鑰「內容」（不是檔名）
GDRIVE_ROOT_FOLDER_ID 「管理員專用」資料夾的 id，例如 15kYNAy8PwyNyIubTE-dhtPXJlg9o3Z-A

雲端硬碟結構：
  成員/mXX-暱稱/頭像.*、造型-<n>.*
  網站相簿/<分類>/<YYYY-MM 標題>/<任意檔名的照片>
  橫幅與故事配圖/橫幅.*、故事配圖.*

輸出：
  assets/images/members/<mXX>/avatar.webp、outfit-<n>.webp
  assets/images/site/banner.webp、story.webp
  assets/images/gallery/<id>.webp、<id>-thumb.webp
  data/gallery.json（每次重新產生）
  tools/image-sync-state.json（記錄已同步的檔案，用來判斷有沒有變動）
"""

import argparse
import hashlib
import io
import json
import os
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageOps

REPO_ROOT = Path(__file__).resolve().parent.parent

STATE_PATH = 'tools/image-sync-state.json'
GALLERY_JSON = 'data/gallery.json'

# 只允許刪除／寫入這幾個資料夾底下的檔案
OUTPUT_DIRS = ('assets/images/members/', 'assets/images/site/', 'assets/images/gallery/')

DIR_MEMBERS = '成員'
DIR_GALLERY = '網站相簿'
DIR_SITE = '橫幅與故事配圖'

# 相簿分類固定這 6 個，gallery.json 也照這個順序排
CATEGORIES = ['團體合照', '副本', '節日活動', '演奏', '日常', '紀念日']

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tif', '.tiff'}

WEBP_QUALITY = 80

# 尺寸上限（寬, 高），None 表示不限制；只縮小、不放大
SIZE_AVATAR = (400, 400)
SIZE_OUTFIT = (None, 900)
SIZE_BANNER = (1600, None)
SIZE_STORY = (1200, None)
SIZE_GALLERY = 1600        # 長邊
SIZE_GALLERY_THUMB = 480   # 長邊

RE_MEMBER_DIR = re.compile(r'^(m\d{2,})(?:[-－_ \s].*)?$', re.IGNORECASE)
RE_OUTFIT = re.compile(r'^造型\s*[-－_ ]?\s*0*(\d+)$')
RE_SAFE_ID = re.compile(r'^[A-Za-z0-9_-]+$')
RE_ALBUM_DIR = re.compile(r'^(\d{4})-(\d{2})\s+(\S.*)$')

FOLDER_MIME = 'application/vnd.google-apps.folder'

warnings = []


def warn(msg):
    warnings.append(msg)
    print(f'警告：{msg}', file=sys.stderr)


def norm(name):
    """統一 Unicode 寫法並去掉前後空白，避免看起來一樣的名稱比對失敗。"""
    return unicodedata.normalize('NFC', name).strip()


def split_name(name):
    """回傳（主檔名, 小寫副檔名）。"""
    stem, ext = os.path.splitext(norm(name))
    return stem.strip(), ext.lower()


# ---------------------------------------------------------------------------
# 來源：雲端硬碟 / 本機資料夾
# 兩者都提供 list(folder) 與 read(entry)。
# list 回傳 dict：id, name, is_folder, mime, md5, modified, ref
# ---------------------------------------------------------------------------

class LocalSource:
    def __init__(self, root):
        self.root = Path(root).resolve()
        if not self.root.is_dir():
            sys.exit(f'找不到資料夾：{self.root}')

    def root_folder(self):
        return {'id': 'local-root', 'name': self.root.name, 'is_folder': True, 'ref': self.root}

    def list(self, folder):
        items = []
        for p in sorted(folder['ref'].iterdir()):
            if p.name.startswith('.'):
                continue
            rel = p.relative_to(self.root).as_posix()
            item = {
                # 本機模式用相對路徑的雜湊當 id（只用小寫英數，避免和雲端 id 混淆）
                'id': 'local-' + hashlib.sha1(rel.encode('utf-8')).hexdigest()[:16],
                'name': p.name,
                'is_folder': p.is_dir(),
                'mime': '',
                'ref': p,
            }
            if not p.is_dir():
                item['md5'] = hashlib.md5(p.read_bytes()).hexdigest()
                item['modified'] = datetime.fromtimestamp(
                    p.stat().st_mtime, timezone.utc).isoformat()
            items.append(item)
        return items

    def read(self, entry):
        return entry['ref'].read_bytes()


class DriveSource:
    def __init__(self, folder_id):
        key = os.environ.get('GDRIVE_SA_KEY', '').strip()
        if not key:
            sys.exit('缺少環境變數 GDRIVE_SA_KEY（service account 金鑰內容）。')
        if not folder_id:
            sys.exit('缺少資料夾 id：請設定環境變數 GDRIVE_ROOT_FOLDER_ID 或使用 --folder-id。')
        try:
            info = json.loads(key)
        except json.JSONDecodeError:
            # 不要把金鑰內容印出來
            sys.exit('GDRIVE_SA_KEY 不是有效的 JSON，請確認貼上的是整個金鑰檔的內容。')

        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        creds = service_account.Credentials.from_service_account_info(
            info, scopes=['https://www.googleapis.com/auth/drive.readonly'])
        self.service = build('drive', 'v3', credentials=creds, cache_discovery=False)
        self.folder_id = folder_id

    def root_folder(self):
        meta = self.service.files().get(
            fileId=self.folder_id, fields='id, name, mimeType',
            supportsAllDrives=True).execute()
        if meta.get('mimeType') != FOLDER_MIME:
            sys.exit('GDRIVE_ROOT_FOLDER_ID 指到的不是資料夾。')
        return {'id': meta['id'], 'name': meta['name'], 'is_folder': True}

    def list(self, folder):
        items = []
        token = None
        while True:
            resp = self.service.files().list(
                q=f"'{folder['id']}' in parents and trashed = false",
                fields='nextPageToken, files(id, name, mimeType, md5Checksum, modifiedTime)',
                pageSize=1000,
                pageToken=token,
                supportsAllDrives=True,
                includeItemsFromAllDrives=True,
            ).execute()
            for f in resp.get('files', []):
                items.append({
                    'id': f['id'],
                    'name': f['name'],
                    'is_folder': f['mimeType'] == FOLDER_MIME,
                    'mime': f['mimeType'],
                    'md5': f.get('md5Checksum', ''),
                    'modified': f.get('modifiedTime', ''),
                })
            token = resp.get('nextPageToken')
            if not token:
                break
        items.sort(key=lambda x: (norm(x['name']).casefold(), x['id']))
        return items

    def read(self, entry):
        from googleapiclient.http import MediaIoBaseDownload

        buf = io.BytesIO()
        req = self.service.files().get_media(fileId=entry['id'], supportsAllDrives=True)
        downloader = MediaIoBaseDownload(buf, req)
        done = False
        while not done:
            _, done = downloader.next_chunk()
        return buf.getvalue()


# ---------------------------------------------------------------------------
# 掃描資料夾，整理出「要產生哪些輸出檔」
# 每個 target：entry（來源檔）、outputs [(路徑, 尺寸種類)]、where（log 用）
# ---------------------------------------------------------------------------

def is_image(entry, where):
    """判斷是不是可以處理的圖片；不是的話警告並回傳 False。"""
    if entry['is_folder']:
        warn(f'{where}：不認得的資料夾，略過')
        return False
    _, ext = split_name(entry['name'])
    if ext not in IMAGE_EXTS:
        warn(f'{where}：不支援的檔案格式，略過（支援 jpg、png、webp、gif、bmp、tif）')
        return False
    return True


def add_target(targets, claimed, entry, outputs, where):
    """登記一個輸出；若輸出路徑已經被別的檔案佔用（例如同時有 頭像.jpg 和 頭像.png），略過後來的。"""
    for path, _ in outputs:
        if path in claimed:
            warn(f'{where}：和「{claimed[path]}」對到同一個輸出 {path}，略過這個檔案')
            return False
    for path, _ in outputs:
        claimed[path] = where
    targets.append({'entry': entry, 'outputs': outputs, 'where': where})
    return True


def scan(source):
    targets = []
    claimed = {}
    gallery_rows = []   # 先記下來源檔 id，轉檔完再決定要不要放進 gallery.json

    root = source.root_folder()
    for top in source.list(root):
        name = norm(top['name'])
        if not top['is_folder']:
            # 根目錄的試算表是正常的，不用警告
            if not top.get('mime', '').startswith('application/vnd.google-apps.'):
                warn(f'{name}：根目錄的檔案不會同步，略過')
            continue
        if name == DIR_MEMBERS:
            scan_members(source, top, targets, claimed)
        elif name == DIR_GALLERY:
            scan_gallery(source, top, targets, claimed, gallery_rows)
        elif name == DIR_SITE:
            scan_site(source, top, targets, claimed)
        else:
            warn(f'{name}/：不認得的資料夾，略過')
    return targets, gallery_rows


def scan_members(source, folder, targets, claimed):
    for mdir in source.list(folder):
        mname = norm(mdir['name'])
        where_dir = f'{DIR_MEMBERS}/{mname}'
        if not mdir['is_folder']:
            warn(f'{where_dir}：成員資料夾裡應該放資料夾，略過這個檔案')
            continue
        m = RE_MEMBER_DIR.match(mname)
        if not m:
            warn(f'{where_dir}/：名稱開頭不是 m01- 這種成員編號，略過')
            continue
        member_id = m.group(1).lower()
        for f in source.list(mdir):
            where = f"{where_dir}/{norm(f['name'])}"
            if not is_image(f, where):
                continue
            stem, _ = split_name(f['name'])
            if stem == '頭像':
                out = [(f'assets/images/members/{member_id}/avatar.webp', 'avatar')]
            else:
                om = RE_OUTFIT.match(stem)
                if not om:
                    warn(f'{where}：檔名不是「頭像」或「造型-數字」，略過')
                    continue
                out = [(f'assets/images/members/{member_id}/outfit-{int(om.group(1))}.webp', 'outfit')]
            add_target(targets, claimed, f, out, where)


def scan_site(source, folder, targets, claimed):
    names = {'橫幅': ('assets/images/site/banner.webp', 'banner'),
             '故事配圖': ('assets/images/site/story.webp', 'story')}
    for f in source.list(folder):
        where = f"{DIR_SITE}/{norm(f['name'])}"
        if not is_image(f, where):
            continue
        stem, _ = split_name(f['name'])
        if stem not in names:
            warn(f'{where}：檔名不是「橫幅」或「故事配圖」，略過')
            continue
        add_target(targets, claimed, f, [names[stem]], where)


def scan_gallery(source, folder, targets, claimed, gallery_rows):
    for cdir in source.list(folder):
        category = norm(cdir['name'])
        where_c = f'{DIR_GALLERY}/{category}'
        if not cdir['is_folder'] or category not in CATEGORIES:
            warn(f'{where_c}：不是固定的 6 個分類資料夾（{"、".join(CATEGORIES)}），略過')
            continue
        for adir in source.list(cdir):
            album = norm(adir['name'])
            where_a = f'{where_c}/{album}'
            if not adir['is_folder']:
                warn(f'{where_a}：分類資料夾裡應該放相簿資料夾，略過這個檔案')
                continue
            am = RE_ALBUM_DIR.match(album)
            if not am or not (1 <= int(am.group(2)) <= 12):
                warn(f'{where_a}/：相簿資料夾名稱要是「YYYY-MM 標題」，例如「2010-08 夏日合奏」，略過')
                continue
            date = f'{am.group(1)}-{am.group(2)}'
            photos = []
            for f in source.list(adir):
                where = f"{where_a}/{norm(f['name'])}"
                if is_image(f, where):
                    photos.append(f)
            # 同一本相簿內依檔名排序（數字部分照大小排，例如 2 排在 10 前面）
            photos.sort(key=lambda f: (natural_key(f['name']), f['id']))
            for i, f in enumerate(photos, start=1):
                fid = f['id']
                if not RE_SAFE_ID.match(fid):
                    warn(f"{where_a}/{norm(f['name'])}：檔案 id 含有不允許的字元，略過")
                    continue
                out = [(f'assets/images/gallery/{fid}.webp', 'gallery'),
                       (f'assets/images/gallery/{fid}-thumb.webp', 'gallery_thumb')]
                if add_target(targets, claimed, f, out, f"{where_a}/{norm(f['name'])}"):
                    gallery_rows.append({
                        'id': fid,
                        'album': album,
                        'category': category,
                        'date': date,
                        'image': out[0][0],
                        'thumb': out[1][0],
                        'sort_order': i,
                    })


def natural_key(name):
    parts = re.split(r'(\d+)', norm(name).casefold())
    return [(0, int(p), '') if p.isdigit() else (1, 0, p) for p in parts]


# ---------------------------------------------------------------------------
# 轉檔
# ---------------------------------------------------------------------------

def fit(img, max_w, max_h):
    """等比縮小到不超過 max_w × max_h（None 表示不限），不放大。"""
    w, h = img.size
    scale = 1.0
    if max_w and w > max_w:
        scale = min(scale, max_w / w)
    if max_h and h > max_h:
        scale = min(scale, max_h / h)
    if scale < 1.0:
        size = (max(1, round(w * scale)), max(1, round(h * scale)))
        img = img.resize(size, Image.LANCZOS)
    return img


def resize_for(img, kind):
    if kind == 'avatar':
        return fit(img, *SIZE_AVATAR)
    if kind == 'outfit':
        return fit(img, *SIZE_OUTFIT)
    if kind == 'banner':
        return fit(img, *SIZE_BANNER)
    if kind == 'story':
        return fit(img, *SIZE_STORY)
    if kind == 'gallery':
        return fit(img, SIZE_GALLERY, SIZE_GALLERY)
    if kind == 'gallery_thumb':
        return fit(img, SIZE_GALLERY_THUMB, SIZE_GALLERY_THUMB)
    raise ValueError(kind)


def load_image(data):
    with Image.open(io.BytesIO(data)) as im:
        im.seek(0)                      # 動圖只取第一格
        im = ImageOps.exif_transpose(im)  # 依 EXIF 方向轉正
        has_alpha = im.mode in ('RGBA', 'LA', 'PA') or (
            im.mode == 'P' and 'transparency' in im.info)
        im = im.convert('RGBA' if has_alpha else 'RGB')
    # 複製成全新的圖，丟掉所有原始資訊（EXIF、GPS 等）
    clean = Image.new(im.mode, im.size)
    clean.paste(im)
    return clean


def write_webp(img, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix('.tmp')
    img.save(tmp, 'WEBP', quality=WEBP_QUALITY, method=6, exif=b'', xmp=b'')
    tmp.replace(path)


# ---------------------------------------------------------------------------
# 主流程
# ---------------------------------------------------------------------------

def safe_output(rel):
    rel = str(rel)
    return (any(rel.startswith(d) for d in OUTPUT_DIRS)
            and '..' not in rel.split('/') and rel.endswith('.webp'))


def load_state(repo):
    p = repo / STATE_PATH
    if not p.exists():
        return {}
    try:
        data = json.loads(p.read_text(encoding='utf-8'))
    except json.JSONDecodeError:
        warn(f'{STATE_PATH} 格式錯誤，當作第一次同步')
        return {}
    return data.get('files', {}) if isinstance(data, dict) else {}


def write_json_if_changed(path, data):
    text = json.dumps(data, ensure_ascii=False, indent=2) + '\n'
    if path.exists():
        try:
            if json.loads(path.read_text(encoding='utf-8')) == data:
                return False
        except json.JSONDecodeError:
            pass
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding='utf-8')
    return True


def remove_empty_dirs(repo):
    for d in OUTPUT_DIRS:
        base = repo / d
        if not base.is_dir():
            continue
        for sub in sorted(base.rglob('*'), reverse=True):
            if sub.is_dir() and not any(sub.iterdir()):
                sub.rmdir()


def sync(source, repo):
    old_state = load_state(repo)
    targets, gallery_rows = scan(source)

    new_paths = {path for t in targets for path, _ in t['outputs']}
    target_ids = {t['entry']['id'] for t in targets}

    added, updated, removed, failed = [], [], [], []
    new_state = {}

    # 1. 雲端已刪除（或改名後不再對應）的檔案：刪掉舊輸出
    to_delete = set()
    for fid, info in old_state.items():
        old_outputs = info.get('outputs', [])
        if fid not in target_ids:
            removed.append(info.get('source', fid))
        to_delete.update(p for p in old_outputs if p not in new_paths)
    for rel in sorted(to_delete):
        if not safe_output(rel):
            warn(f'狀態檔裡的路徑不在允許範圍，不刪除：{rel}')
            continue
        p = repo / rel
        if p.exists():
            p.unlink()
            print(f'刪除 {rel}')

    # 2. 新增或變動的檔案：下載並轉檔
    for t in targets:
        e = t['entry']
        outputs = [path for path, _ in t['outputs']]
        old = old_state.get(e['id'])
        unchanged = (
            old is not None
            and old.get('outputs') == outputs
            and all((repo / p).exists() for p in outputs)
            and (old.get('md5') == e['md5'] if e['md5']
                 else old.get('modified') == e['modified'])
        )
        record = {'source': t['where'], 'md5': e['md5'], 'modified': e['modified'],
                  'outputs': outputs}
        if unchanged:
            new_state[e['id']] = record
            continue
        try:
            img = load_image(source.read(e))
            for path, kind in t['outputs']:
                write_webp(resize_for(img, kind), repo / path)
        except Exception as exc:  # 單一檔案失敗不影響其他檔案
            warn(f"{t['where']}：轉檔失敗，略過（{type(exc).__name__}: {exc}）")
            failed.append(t['where'])
            if old is not None and all((repo / p).exists() for p in old.get('outputs', [])):
                new_state[e['id']] = old   # 保留上次成功的版本，下次再試
            continue
        new_state[e['id']] = record
        (updated if old is not None else added).append(t['where'])
        print(f"{'更新' if old is not None else '新增'} {t['where']} → {', '.join(outputs)}")

    remove_empty_dirs(repo)

    # 3. 重新產生 gallery.json（只放成功轉檔的照片）
    cat_order = {c: i for i, c in enumerate(CATEGORIES)}
    rows = [r for r in gallery_rows if r['id'] in new_state]
    rows.sort(key=lambda r: (cat_order[r['category']], r['date'], natural_key(r['album']),
                             r['sort_order']))
    gallery_changed = write_json_if_changed(repo / GALLERY_JSON, rows)

    # 4. 狀態檔
    state = {'note': '圖片同步程式自動產生，請勿手動修改。',
             'files': dict(sorted(new_state.items()))}
    write_json_if_changed(repo / STATE_PATH, state)

    return {'added': added, 'updated': updated, 'removed': removed, 'failed': failed,
            'gallery_changed': gallery_changed, 'gallery_count': len(rows)}


def write_summary(path, result):
    lines = [
        '這是圖片同步程式自動開的 Pull Request：從 Google 雲端硬碟「管理員專用」資料夾同步網站圖片。',
        '',
        '| 項目 | 數量 |',
        '|---|---|',
        f"| 新增圖片 | {len(result['added'])} |",
        f"| 更新圖片 | {len(result['updated'])} |",
        f"| 刪除圖片 | {len(result['removed'])} |",
        f"| 轉檔失敗（略過） | {len(result['failed'])} |",
        f"| 相簿照片總數（data/gallery.json） | {result['gallery_count']} |",
        '',
    ]
    for title, key in (('新增', 'added'), ('更新', 'updated'), ('刪除', 'removed'),
                       ('轉檔失敗', 'failed')):
        items = result[key]
        if items:
            lines.append(f'<details><summary>{title}（{len(items)}）</summary>')
            lines.append('')
            lines.extend(f'- {x}' for x in items[:300])
            if len(items) > 300:
                lines.append(f'- ……另外 {len(items) - 300} 個')
            lines.extend(['', '</details>', ''])
    if warnings:
        lines.append(f'<details><summary>警告（{len(warnings)}）</summary>')
        lines.append('')
        lines.extend(f'- {w}' for w in warnings[:300])
        lines.extend(['', '</details>', ''])
    lines.append('確認圖片沒問題後合併，GitHub Pages 會在幾分鐘內更新網站。')
    Path(path).write_text('\n'.join(lines) + '\n', encoding='utf-8')


def main():
    ap = argparse.ArgumentParser(description='同步 Google 雲端硬碟圖片成網站用的 WebP。')
    ap.add_argument('--local', metavar='資料夾', help='從本機資料夾讀取相同結構（測試用，不連 Google）')
    ap.add_argument('--folder-id', default=os.environ.get('GDRIVE_ROOT_FOLDER_ID', ''),
                    help='雲端硬碟資料夾 id（預設讀環境變數 GDRIVE_ROOT_FOLDER_ID）')
    ap.add_argument('--repo', default=str(REPO_ROOT), help='輸出到哪個專案資料夾（預設本專案）')
    ap.add_argument('--summary', metavar='檔案', help='把結果摘要寫成 Markdown（給 PR 說明用）')
    args = ap.parse_args()

    source = LocalSource(args.local) if args.local else DriveSource(args.folder_id.strip())
    result = sync(source, Path(args.repo).resolve())

    print(f"完成：新增 {len(result['added'])}、更新 {len(result['updated'])}、"
          f"刪除 {len(result['removed'])}、失敗 {len(result['failed'])}、"
          f"警告 {len(warnings)}；相簿照片 {result['gallery_count']} 張")
    if args.summary:
        write_summary(args.summary, result)


if __name__ == '__main__':
    main()
