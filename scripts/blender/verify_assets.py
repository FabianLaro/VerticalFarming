"""Read-only verification of the authored Blender sources and local deliverables."""
import json
import math
import struct
from pathlib import Path
import bpy

root = Path(__file__).resolve().parents[2]
report = {'blender': bpy.app.version_string, 'blend_files': [], 'models': [], 'renders': []}
for path in sorted((root / 'output/blender').glob('*.blend')):
    bpy.ops.wm.open_mainfile(filepath=str(path))
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    assert meshes, f'No editable meshes in {path.name}'
    assert not [image for image in bpy.data.images if image.source == 'FILE' and not image.packed_file and not Path(bpy.path.abspath(image.filepath)).is_file()], f'Missing image dependency in {path.name}'
    report['blend_files'].append({'file': path.name, 'mesh_objects': len(meshes), 'camera': bool(bpy.context.scene.camera)})

for path in sorted((root / 'public/models').glob('*.glb')):
    blob = path.read_bytes()
    assert blob[:4] == b'glTF' and struct.unpack_from('<I', blob, 4)[0] == 2
    assert struct.unpack_from('<I', blob, 8)[0] == len(blob)
    size = struct.unpack_from('<I', blob, 12)[0]
    data = json.loads(blob[20:20 + size])
    assert 'Blender' in data['asset']['generator']
    assert data.get('meshes') and data.get('materials')
    assert all(not item.get('uri') or item['uri'].startswith('data:') for item in data.get('buffers', []) + data.get('images', []))
    triangles = 0
    for mesh in data['meshes']:
        for primitive in mesh['primitives']:
            positions = data['accessors'][primitive['attributes']['POSITION']]
            assert positions['count'] > 0
            assert all(math.isfinite(value) for value in positions.get('min', []) + positions.get('max', []))
            triangles += data['accessors'][primitive['indices']]['count'] // 3 if 'indices' in primitive else positions['count'] // 3
    report['models'].append({'file': path.name, 'bytes': len(blob), 'triangles': triangles, 'generator': data['asset']['generator']})

for name in ['vertical-farm.png', 'greenhouse.png', 'field.png', 'lettuce-detail.png']:
    blob = (root / 'public/renders' / name).read_bytes()
    assert blob[:8] == b'\x89PNG\r\n\x1a\n'
    width, height = struct.unpack_from('>II', blob, 16)
    assert (width, height) == (2048, 1408)
    report['renders'].append({'file': name, 'width': width, 'height': height})

report['passed'] = True
(root / 'output/blender/validation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf8')
print(f"VERIFIED: {len(report['blend_files'])} editable Blender files, {len(report['models'])} GLBs, {len(report['renders'])} renders", flush=True)
