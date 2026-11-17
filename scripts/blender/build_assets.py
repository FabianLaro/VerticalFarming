"""Stadtlabor: original editable models, local glTF assets and Cycles renders.

Run: blender --background --python scripts/blender/build_assets.py -- --assets
     blender --background --python scripts/blender/build_assets.py -- --scene vertical --preview
     blender --background --python scripts/blender/build_assets.py -- --render-all
All geometry/materials are authored here; no stock models, images or textures.
Blender uses Z-up. glTF export converts the models to Y-up.
"""
import argparse
import bpy
import math
import random
import sys
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
MODELS = ROOT / 'public' / 'models'
RENDERS = ROOT / 'public' / 'renders'
EDITABLE = ROOT / 'output' / 'blender'
for directory in [MODELS, RENDERS, EDITABLE]:
    directory.mkdir(parents=True, exist_ok=True)
M = {}
LETTUCE_DATA = None
RENDER_QUALITY = False


def material(name, color, rough=.5, metal=0, transmission=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color[:3], 1)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    if bsdf.inputs.get('Transmission Weight'):
        bsdf.inputs['Transmission Weight'].default_value = transmission
    mat.diffuse_color = (*color[:3], 1)
    if transmission:
        bsdf.inputs['IOR'].default_value = 1.45
    return mat


def palette():
    global M
    M = {
        'concrete': material('Warm mineral concrete', (.58, .60, .55), .8),
        'steel': material('Brushed anodised aluminium', (.49, .57, .57), .29, .8),
        'dark': material('Graphite powder coating', (.065, .10, .085), .42, .25),
        'water': material('Supply pipe blue enamel', (.08, .27, .32), .32, .3),
        'return': material('Return pipe deep teal', (.055, .17, .17), .4, .25),
        'leaf': material('Lettuce leaf with authored vertex colour', (.21, .40, .085), .57),
        'glass': material('Low iron horticultural glass', (.86, .94, .91), .06, 0, 1),
        'soil': material('Moist growing soil', (.105, .068, .035), .94),
        'soilcut': material('Earth profile cut surface', (.28, .18, .095), .98),
        'wood': material('Pale untreated timber', (.44, .31, .17), .78),
        'white': material('Warm white polymer', (.76, .79, .72), .4),
        'green': material('Forest green equipment', (.075, .19, .105), .43, .15),
        'rubber': material('Black rubber', (.013, .018, .014), .79),
        'brass': material('Brass valve fittings', (.48, .29, .075), .28, .75),
        'led': material('LED diffuser', (.77, .91, .83), .22),
        'silver': material('Bright machined steel', (.7, .73, .72), .23, .9),
    }
    leaf = M['leaf']
    bsdf = leaf.node_tree.nodes.get('Principled BSDF')
    vc = leaf.node_tree.nodes.new('ShaderNodeVertexColor')
    vc.layer_name = 'Col'
    leaf.node_tree.links.new(vc.outputs['Color'], bsdf.inputs['Base Color'])
    if bsdf.inputs.get('Subsurface Weight'):
        bsdf.inputs['Subsurface Weight'].default_value = .09
        bsdf.inputs['Subsurface Radius'].default_value = (.3, .8, .2)
    # Authored UV vein network: central midrib and soft oblique branch ridges.
    # No image texture is used. glTF keeps the authored vertex colour / shape;
    # Cycles additionally evaluates the small vascular surface relief.
    nodes, links = leaf.node_tree.nodes, leaf.node_tree.links
    uv=nodes.new('ShaderNodeTexCoord')
    separate=nodes.new('ShaderNodeSeparateXYZ');links.new(uv.outputs['UV'],separate.inputs[0])
    def mathnode(op,a,b=None):
        node=nodes.new('ShaderNodeMath');node.operation=op
        for i,value in enumerate([a,b] if b is not None else [a]):
            if hasattr(value,'is_output'): links.new(value,node.inputs[i])
            else: node.inputs[i].default_value=value
        return node.outputs[0]
    width=mathnode('ABSOLUTE',mathnode('SUBTRACT',separate.outputs['Y'],.5))
    phase=mathnode('SUBTRACT',mathnode('MULTIPLY',separate.outputs['X'],6),mathnode('MULTIPLY',width,2.7))
    branches=mathnode('POWER',mathnode('MAXIMUM',mathnode('COSINE',mathnode('MULTIPLY',phase,math.pi*2)),0),20)
    midrib=mathnode('POWER',mathnode('MAXIMUM',mathnode('SUBTRACT',1,mathnode('MULTIPLY',width,32)),0),2)
    height=mathnode('ADD',midrib,mathnode('MULTIPLY',branches,.42))
    bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.23;bump.inputs['Distance'].default_value=.004
    links.new(height,bump.inputs['Height']);links.new(bump.outputs['Normal'],bsdf.inputs['Normal'])
    led = M['led'].node_tree.nodes.get('Principled BSDF')
    if led.inputs.get('Emission Color'):
        led.inputs['Emission Color'].default_value = (.55, .77, .64, 1)
        led.inputs['Emission Strength'].default_value = 3
    return M


def assign(obj, mat):
    obj.data.materials.append(mat)
    return obj


def smooth(obj):
    if obj.type == 'MESH':
        for polygon in obj.data.polygons:
            polygon.use_smooth = True
    return obj


def box(name, loc, size, mat, bevel=.02):
    # Direct mesh creation avoids a whole-scene dependency update for every screw/rail.
    x,y,z=(v/2 for v in size)
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata([(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)],[],[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])
    mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    obj.location=loc
    assign(obj, mat)
    if bevel:
        mod = obj.modifiers.new('Manufactured edge radius', 'BEVEL')
        mod.width = min(bevel, min(size) * .3)
        mod.segments = 3
        mod.limit_method = 'ANGLE'
        normal = obj.modifiers.new('Weighted face normals', 'WEIGHTED_NORMAL')
        normal.keep_sharp = True
    return obj


def cyl(name, loc, radius, depth, mat, rot=None, vertices=32):
    points=[(math.cos(i*2*math.pi/vertices)*radius,math.sin(i*2*math.pi/vertices)*radius,z) for z in [-depth/2,depth/2] for i in range(vertices)]
    faces=[(i,(i+1)%vertices,(i+1)%vertices+vertices,i+vertices) for i in range(vertices)]
    faces.extend([tuple(reversed(range(vertices))),tuple(range(vertices,2*vertices))])
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(points,[],faces)
    mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    obj.location=loc
    if rot:
        obj.rotation_euler = rot
    assign(obj, mat)
    mod = obj.modifiers.new('Turned edge radius', 'BEVEL')
    mod.width = min(.012, radius * .08)
    mod.segments = 2
    for polygon in obj.data.polygons:
        polygon.use_smooth=polygon.index<vertices
    return obj


def pipe(name, points, radius, mat):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.resolution_u = 2
    curve.bevel_depth = radius
    curve.bevel_resolution = 2
    spline = curve.splines.new('POLY')
    spline.points.add(len(points) - 1)
    for p, pos in zip(spline.points, points):
        p.co = (*pos, 1)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    assign(obj, mat)
    return obj


def beam(name, start, end, width, mat):
    a, b = Vector(start), Vector(end)
    obj = box(name, (a + b) / 2, (width, width, (b - a).length), mat, width * .12)
    obj.rotation_euler = (b - a).to_track_quat('Z', 'Y').to_euler()
    return obj


def label(name, text, loc, size=.12, rot=(math.pi/2, 0, 0), mat=None):
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = text
    curve.size = size
    curve.extrude = .0008
    curve.align_x = 'CENTER'
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = rot
    assign(obj, mat or M['dark'])
    return obj


def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


def collection(name):
    coll = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(coll)
    return coll


def move_collection(objects, coll):
    for obj in objects:
        for old in list(obj.users_collection):
            old.objects.unlink(obj)
        coll.objects.link(obj)


def build_lettuce(low=False):
    """Hand-shaped curved/wavy leaves; one realtime mesh, one vertex-colour material."""
    global LETTUCE_DATA
    verts, faces, colors, uvs = [], [], [], []
    rng = random.Random(2040)
    for layer, count, length, width, lift in [(0, 9, .225, .106, .064), (1, 7, .178, .089, .12), (2, 5, .125, .065, .16)]:
        for index in range(count):
            angle = index * 2 * math.pi / count + layer * .59 + rng.uniform(-.12, .12)
            phase = rng.uniform(0, 6)
            l = length * rng.uniform(.89, 1.1)
            w = width * rng.uniform(.9, 1.13)
            start = len(verts)
            segs, cross = (32,12) if RENDER_QUALITY else (10,6) if low else (18,10)
            for j in range(segs+1):
                # Cosine spacing resolves the rounded elliptical leaf tips.
                u = (1-math.cos(math.pi*j/segs))/2
                radial = .008 + l * u * (.98 - layer*.14)
                z = .013 + lift * math.sin(u * math.pi*.72) + .012*u - (.037 if layer == 0 else .009) * u**3
                for k in range(cross+1):
                    v = -1 + 2*k/cross
                    edge = math.sin(math.pi*u)**.5
                    breadth = w * edge * v * (1+.025*math.sin(u*math.pi*4+phase))
                    ripple = (math.sin(u*math.pi*4+phase)*.0035 + math.sin(u*math.pi*8+phase)*.0009)*abs(v)**3*edge
                    midrib_height=.0035*math.exp(-abs(v)*14)*edge
                    height = z + .017*v*v*edge + ripple + midrib_height + .0015*math.sin(u*math.pi*3+v*2+phase)*edge
                    x = math.cos(angle)*radial - math.sin(angle)*breadth
                    y = math.sin(angle)*radial + math.cos(angle)*breadth
                    verts.append((x,y,height))
                    uvs.append((u,(v+1)/2))
                    midrib = math.exp(-abs(v)*20)
                    vein = max(0, math.cos((u*7-abs(v)*1.6)*math.pi*2))**12 * .14
                    tint = .91 + .035*math.sin(u*3+phase) + .02*math.cos(v*math.pi)
                    colors.append((min(.55, (.16 + .13*u + .11*midrib + vein)*tint), min(.65, (.31 + .18*u + .06*midrib + vein)*tint), (.035 + .06*u + .04*midrib)*tint, 1))
            for j in range(segs):
                for k in range(cross):
                    a = start+j*(cross+1)+k
                    faces.append((a,a+1,a+cross+2,a+cross+1))
    mesh = bpy.data.meshes.new('Lettuce_curved_leaf_surfaces')
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    col = mesh.color_attributes.new(name='Col', type='FLOAT_COLOR', domain='POINT')
    for item, color in zip(col.data, colors):
        item.color = color
    uv=mesh.uv_layers.new(name='Leaf local UV')
    for polygon in mesh.polygons:
        for loop_index in polygon.loop_indices:
            uv.data[loop_index].uv=uvs[mesh.loops[loop_index].vertex_index]
    obj = bpy.data.objects.new('Lettuce', mesh)
    bpy.context.collection.objects.link(obj)
    assign(obj,M['leaf'])
    smooth(obj)
    if RENDER_QUALITY:
        # Subdivide the prototype once, then share its mesh across all plants.
        # Per-instance subdivision would create hundreds of huge evaluated copies.
        subdiv=obj.modifiers.new('Soft continuous leaf surface','SUBSURF')
        subdiv.subdivision_type='CATMULL_CLARK';subdiv.levels=1;subdiv.render_levels=1
        bpy.context.view_layer.objects.active=obj
        obj.select_set(True)
        bpy.ops.object.modifier_apply(modifier=subdiv.name)
    LETTUCE_DATA = obj.data
    return obj


def add_lettuce(loc, scale=1, seed=0):
    global LETTUCE_DATA
    if LETTUCE_DATA is None:
        obj = build_lettuce()
    else:
        obj = bpy.data.objects.new('Lettuce_%04d' % seed, LETTUCE_DATA)
        bpy.context.collection.objects.link(obj)
    rng = random.Random(seed + 440)
    obj.location = loc
    s = scale * rng.uniform(.85, 1.08)
    obj.scale = (s, s, s*rng.uniform(.86,1.12))
    obj.rotation_euler[2] = rng.uniform(0,2*math.pi)
    return obj


def tray_component():
    # The component origin is the underside; 2.18 m wide x 6.5 m long.
    for x in [-.81,-.27,.27,.81]:
        box('NFT channel base', (x,0,.045), (.42,6.5,.09), M['white'], .015)
        for side in [-1,1]:
            box('NFT channel raised rim',(x+side*.208,0,.11),(.025,6.5,.08),M['white'],.008)
        for y in [-3.22,3.22]:
            box('Channel end cap',(x,y,.095),(.445,.045,.14),M['white'],.008)
        for row in range(12):
            cyl('Planting collar',(x,-2.78+row*.5,.096),.075,.013,M['dark'],vertices=16)
    for y in [-3.16,-1.05,1.05,3.16]:
        box('Tray aluminium cross support',(0,y,.008),(2.18,.07,.06),M['steel'],.009)
    for x in [-1.07,1.07]:
        box('Tray perimeter beam',(x,0,.018),(.07,6.5,.075),M['steel'],.009)


def add_tank(loc=(0,0,0)):
    before=set(bpy.data.objects)
    cyl('Tank main rotational body',(0,0,.76),.69,1.43,M['white'],vertices=64)
    cyl('Tank raised shoulder',(0,0,1.47),.665,.09,M['white'],vertices=64)
    cyl('Tank removable lid',(0,0,1.54),.71,.07,M['green'],vertices=64)
    cyl('Tank service cap',(.24,0,1.59),.13,.05,M['dark'])
    for z in [.22,1.15]:
        bpy.ops.mesh.primitive_torus_add(major_radius=.691,minor_radius=.014,major_segments=64,minor_segments=6,location=(0,0,z))
        assign(bpy.context.object,M['steel'])
        bpy.context.object.name='Tank moulded reinforcement ring'
    box('Level gauge backing',(0,-.695,.8),(.14,.025,.95),M['dark'],.008)
    box('Transparent gauge fill',(0,-.716,.65),(.065,.015,.61),M['water'],.004)
    for i in range(9):
        box('Gauge tick',(.044,-.731,.37+i*.09),(.042,.005,.008),M['white'],0)
    box('Tank identification plate',(0,-.707,1.36),(.45,.015,.13),M['green'],.006)
    label('Tank engraved label','NUTRIENT',(0,-.719,1.325),.07,mat=M['white'])
    pipe('Tank outlet',[(.55,-.3,.21),(.88,-.3,.21),(.88,-.63,.21)],.045,M['water'])
    for x in [-.38,.38]:
        for y in [-.38,.38]:
            cyl('Tank foot',(x,y,.045),.075,.09,M['dark'])
    for obj in set(bpy.data.objects)-before:
        obj.location += Vector(loc)


def add_pump(loc=(0,0,0)):
    before=set(bpy.data.objects)
    box('Pump anchor base',(0,0,.045),(.76,.66,.09),M['dark'],.02)
    for x in [-.30,.30]:
        for y in [-.24,.24]:
            cyl('Pump foundation bolt',(x,y,.105),.025,.04,M['silver'],vertices=8)
    cyl('Electric pump motor',(-.13,.07,.27),.18,.44,M['green'],rot=(0,math.pi/2,0))
    for x in [-.30,-.25,-.20,-.15,-.10,-.05]:
        cyl('Motor cooling fin',(x,.07,.27),.195,.015,M['green'],rot=(0,math.pi/2,0))
    cyl('Centrifugal pump casing',(.18,.07,.27),.235,.16,M['steel'],rot=(0,math.pi/2,0))
    pipe('Pump discharge',[(.18,.07,.45),(.18,.07,.64),(.18,-.19,.64)],.047,M['water'])
    pipe('Pump inlet',[(.33,.07,.27),(.47,.07,.27),(.47,-.2,.27)],.052,M['water'])
    for z in [.27,.64]:
        cyl('Brass pipe fitting',(.18 if z>.3 else .47,-.14,z),.068,.06,M['brass'],rot=(math.pi/2,0,0))
    cyl('Pressure gauge housing',(-.03,-.01,.59),.095,.04,M['silver'],rot=(math.pi/2,0,0))
    cyl('Pressure gauge dial',(-.03,-.035,.59),.084,.009,M['white'],rot=(math.pi/2,0,0))
    beam('Gauge pointer',(-.03,-.044,.59),(.012,-.044,.639),.008,M['dark'])
    for i in range(9):
        a=-math.pi*.7+i*math.pi*1.4/8
        p=(-.03+math.sin(a)*.067,-.044,.59+math.cos(a)*.067)
        box('Gauge scale',p,(.007,.005,.014),M['dark'],0).rotation_euler[1]=-a
    box('Motor electrical box',(-.13,.07,.49),(.17,.19,.1),M['dark'],.012)
    for obj in set(bpy.data.objects)-before:
        obj.location += Vector(loc)


def add_climate(loc=(0,0,0)):
    before=set(bpy.data.objects)
    box('Air handler outer cabinet',(0,0,.77),(2.2,1.2,1.5),M['white'],.045)
    for x in [-.54,.54]:
        cyl('Fan dark recess',(x,-.616,.86),.405,.035,M['dark'],rot=(math.pi/2,0,0),vertices=48)
        for blade in range(7):
            a=blade*2*math.pi/7
            box('Fan curved blade',(x+math.sin(a)*.15,-.64,.86+math.cos(a)*.15),(.17,.025,.31),M['steel'],.035).rotation_euler[1]=a+.34
        for radius in [.16,.29,.39]:
            bpy.ops.mesh.primitive_torus_add(major_radius=radius,minor_radius=.008,major_segments=48,minor_segments=5,location=(x,-.665,.86),rotation=(math.pi/2,0,0))
            assign(bpy.context.object,M['silver'])
            bpy.context.object.name='Protective fan guard ring'
        for a in [0,math.pi/3,2*math.pi/3]:
            beam('Fan guard spoke',(x-math.sin(a)*.39,-.67,.86-math.cos(a)*.39),(x+math.sin(a)*.39,-.67,.86+math.cos(a)*.39),.013,M['silver'])
        cyl('Fan spindle',(x,-.69,.86),.075,.06,M['silver'],rot=(math.pi/2,0,0))
    box('Lower service panel',(0,-.61,.25),(2.03,.025,.27),M['steel'],.015)
    for x in [-.96,.96]:
        for z in [.18,.34]:
            cyl('Cabinet fastener',(x,-.632,z),.016,.01,M['dark'],rot=(math.pi/2,0,0),vertices=8)
    for x in [-1.112,1.112]:
        for j in range(10):
            box('Ventilation slot',(x,0,.4+j*.085),(.015,.83,.028),M['dark'],.009)
    for x in [-.87,.87]:
        box('Vibration isolated foot',(x,0,.04),(.21,.92,.08),M['dark'],.012)
    for obj in set(bpy.data.objects)-before:
        obj.location += Vector(loc)


def crate(loc, full=False):
    before=set(bpy.data.objects)
    box('Harvest crate bottom',(0,0,.035),(.65,.47,.07),M['green'],.018)
    for z in [.1,.18,.26]:
        for x in [-.315,.315]:
            box('Crate slotted side',(x,0,z),(.025,.47,.045),M['green'],.007)
        for y in [-.225,.225]:
            box('Crate slotted end',(0,y,z),(.65,.025,.045),M['green'],.007)
    for x in [-.30,.30]:
        for y in [-.21,.21]:
            box('Crate corner rib',(x,y,.16),(.043,.043,.30),M['green'],.008)
    if full:
        add_lettuce((-.14,0,.08),.7,42)
        add_lettuce((.14,0,.08),.7,43)
    for obj in set(bpy.data.objects)-before:
        obj.location += Vector(loc)


def add_harvest_cart(loc=(0,0,0)):
    before=set(bpy.data.objects)
    box('Packing worktop',(0,0,.95),(2.1,1.25,.075),M['silver'],.025)
    box('Lower cart shelf',(0,0,.28),(1.98,1.12,.045),M['steel'],.015)
    for x in [-.91,.91]:
        for y in [-.48,.48]:
            box('Cart tubular leg',(x,y,.54),(.055,.055,.8),M['steel'],.012)
            cyl('Castor tyre',(x,y,.12),.11,.055,M['rubber'],rot=(math.pi/2,0,0),vertices=24)
            cyl('Castor hub',(x,y-.03,.12),.051,.06,M['steel'],rot=(math.pi/2,0,0),vertices=20)
            box('Castor fork',(x,y,.22),(.09,.08,.14),M['steel'],.018)
    pipe('Cart push handle',[(1.01,-.45,.9),(1.13,-.45,1.23),(1.13,.45,1.23),(1.01,.45,.9)],.026,M['steel'])
    crate((-.53,-.05,.99),True)
    crate((.34,.08,.99),True)
    crate((.35,0,.31),False)
    box('Packing scale',(0,-.42,1.03),(.34,.26,.075),M['white'],.02)
    box('Scale display',(0,-.558,1.065),(.19,.025,.04),M['dark'],.005)
    for obj in set(bpy.data.objects)-before:
        obj.location += Vector(loc)


def asset_export(name, builder):
    clear()
    builder()
    objects=list(bpy.context.scene.objects)
    coll=collection(name + ' editable components')
    move_collection(objects,coll)
    bpy.ops.wm.save_as_mainfile(filepath=str(EDITABLE / (name+'.blend')))
    bpy.ops.object.select_all(action='SELECT')
    props=bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    kwargs={'filepath':str(MODELS/(name+'.glb')),'export_format':'GLB','use_selection':True,'export_apply':True,'export_texcoords':False,'export_normals':True,'export_materials':'EXPORT','export_cameras':False,'export_lights':False,'export_yup':True,'export_extras':True,'export_draco_mesh_compression_enable':False}
    kwargs={key:value for key,value in kwargs.items() if key in props}
    bpy.ops.export_scene.gltf(**kwargs)
    print('ASSET_READY '+name,flush=True)


def rack_at(x, levels=4):
    ztop=.65+(levels-1)*.85+.72
    for dx in [-1.08,1.08]:
        for y in [-3.2,0,3.2]:
            box('Slotted upright',(x+dx,y,(ztop+.2)/2),(.065,.065,ztop+.2),M['steel'],.008)
            for i in range(int(ztop/.12)):
                box('Rack upright slot',(x+dx-.034,y-.004,.28+i*.12),(.004,.02,.042),M['dark'],.002)
    for lev in range(levels):
        z=.65+lev*.85
        before=set(bpy.data.objects)
        tray_component()
        for obj in set(bpy.data.objects)-before:
            obj.location+=Vector((x,0,z))
        for col,dx in enumerate([-.81,-.27,.27,.81]):
            for row in range(12):
                add_lettuce((x+dx,-2.78+row*.5,z+.115),.93,row+col*44+lev*178)
        for dx in [-.72,.72]:
            box('LED heat sink',(x+dx,0,z+.68),(.085,6.3,.052),M['steel'],.008)
            box('LED opal diffuser',(x+dx,0,z+.65),(.059,6.25,.015),M['led'],.004)
            for y in [-2.5,2.5]:
                beam('LED mounting bracket',(x+dx,y,z+.72),(x+dx,y,z+.76),.025,M['dark'])
        pipe('Tray feed branch',[(x-1.2,-3.42,z+.14),(x,-3.42,z+.14)],.024,M['water'])
    pipe('Rack vertical feed',[(x-1.2,-3.42,.45),(x-1.2,-3.42,ztop-.1)],.035,M['water'])
    pipe('Rack return',[(x+1.16,3.4,.3),(x+1.16,3.4,ztop-.2)],.04,M['return'])


def vertical_scene():
    box('Cutaway foundation',(0,0,-.16),(14.6,9.4,.32),M['concrete'],.08)
    box('Washable production floor',(0,0,.015),(14.2,9.1,.035),M['white'],.02)
    wall=material('Warm architectural wall',(.66,.70,.65),.7)
    box('Rear insulated wall',(0,4.55,2.25),(14.3,.18,4.5),wall,.04)
    box('West cutaway wall',(-7.1,0,2.25),(.18,9.2,4.5),wall,.04)
    for x in [-7,0,7]:
        for y in [-4.5,4.5]:
            box('Structural column',(x,y,2.32),(.13,.13,4.65),M['steel'],.015)
    for y in [-4.5,4.5]:
        box('Open roof perimeter',(0,y,4.67),(14.25,.15,.18),M['steel'],.015)
    for x in [-7,7]:
        box('Open roof edge',(x,0,4.67),(.15,9.15,.18),M['steel'],.015)
    for x in [-4.5,-1.5,1.5]:
        rack_at(x)
    add_tank((5.72,2.7,.04))
    add_pump((6.4,1.65,.04))
    add_climate((5.25,-2.28,.05))
    add_harvest_cart((4.8,.15,.04))
    crate((6.1,-.9,.04),False)
    crate((6.1,-.9,.36),False)
    pipe('Blue nutrient supply manifold',[(6.54,1.44,.68),(6.54,3.74,.68),(-5.7,3.74,.68),(-5.7,3.42,.68)],.052,M['water'])
    pipe('Teal return collector',[(-5.8,-3.68,.28),(6.85,-3.68,.28),(6.85,2.18,.28),(6.1,2.18,.28)],.055,M['return'])
    pipe('Overhead climate distribution',[(5.25,-2.28,1.55),(5.25,-2.28,4.12),(5.25,3.92,4.12),(-5.8,3.92,4.12)],.21,M['steel'])
    for x in [-4.5,-1.5,1.5]:
        box('Climate diffuser outlet',(x,3.7,3.93),(.5,.52,.14),M['dark'],.025)
    box('Control cabinet',(6.93,3.7,1.6),(.2,.72,1.4),M['white'],.035)
    box('Control display',(6.81,3.7,1.9),(.025,.42,.29),M['dark'],.01)
    # Deliberate service aisle and threshold: no fabricated measurements in the picture.
    for y in [-3.8,-2.8,-1.8,-.8,.2,1.2,2.2,3.2]:
        box('Service aisle floor marking',(3.13,y,.04),(.025,.5,.003),M['green'],0)
    label('Production wall plaque','STADTLABOR / 2040',(-3.1,4.445,3.92),.18,mat=M['dark'])


def setup_scene(system, preview=False):
    scene=bpy.context.scene
    scene.render.engine='CYCLES'
    scene.cycles.samples=32 if preview else 128
    scene.cycles.use_adaptive_sampling=True
    scene.cycles.adaptive_threshold=.05 if preview else .02
    scene.cycles.use_denoising=True
    scene.cycles.max_bounces=7
    scene.cycles.transmission_bounces=5
    try:
        pref=bpy.context.preferences.addons['cycles'].preferences
        pref.compute_device_type='OPTIX'
        pref.get_devices()
        gpu=False
        for device in pref.devices:
            device.use=device.type=='OPTIX'
            gpu=gpu or device.use
        scene.cycles.device='GPU' if gpu else 'CPU'
        print('CYCLES_DEVICE '+scene.cycles.device,flush=True)
    except Exception as error:
        print('GPU_FALLBACK '+str(error),flush=True)
    scene.render.resolution_x=1000 if preview else 2048
    scene.render.resolution_y=688 if preview else 1408
    scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'
    scene.render.image_settings.color_mode='RGB'
    scene.render.image_settings.color_depth='8'
    scene.render.image_settings.compression=20
    scene.render.film_transparent=False
    world=bpy.data.worlds.new('Warm neutral photographic studio')
    world.use_nodes=True
    world.node_tree.nodes['Background'].inputs['Color'].default_value=(.77,.81,.74,1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value=.35
    scene.world=world
    scene.view_settings.view_transform='AgX'
    scene.view_settings.exposure=-.2
    try:
        scene.view_settings.look='AgX - Medium High Contrast'
    except Exception:
        pass
    stage=material('Photographic warm paper background',(.72,.73,.68),.86)
    box('Infinite photographic ground',(0,0,-.38),(200,200,.12),stage,.02)
    def light(name,pos,power,size,color):
        data=bpy.data.lights.new(name,'AREA')
        data.energy=power;data.shape='DISK';data.size=size;data.color=color
        obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=pos
        obj.rotation_euler=(Vector((0,0,1.3))-obj.location).to_track_quat('-Z','Y').to_euler()
    light('Large north skylight',(-3,-4,15),2300,9,(1,.96,.88))
    light('Soft window fill',(9,3,11),1800,8,(.84,.94,1))
    light('Back edge separation',(-8,5,10),1350,7,(.95,1,.88))
    sun=bpy.data.lights.new('Late morning sun','SUN');sun.energy=1.25;sun.angle=.18
    obj=bpy.data.objects.new('Late morning sun',sun);scene.collection.objects.link(obj)
    obj.rotation_euler=(math.radians(22),math.radians(-18),math.radians(-22))
    camdata=bpy.data.cameras.new('Exhibition camera')
    cam=bpy.data.objects.new('Exhibition camera',camdata);scene.collection.objects.link(cam)
    target=Vector((.4,0,1.5 if system!='field' else .3))
    cam.location=(18,-24,18.5 if system!='field' else 20)
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    camdata.type='ORTHO';camdata.ortho_scale=21.3 if system=='vertical' else 20.8
    camdata.lens=50
    scene.camera=cam
    scene.render.filepath=str((EDITABLE if preview else RENDERS)/(('vertical-farm' if system=='vertical' else system)+('-preview' if preview else '')+'.png'))


def render_scene(system,preview=False):
    global LETTUCE_DATA
    clear()
    # Keep shared editable leaf mesh and all PBR materials, rebuild scene independently.
    if system=='vertical':
        vertical_scene()
    else:
        import outdoor_scenes
        getattr(outdoor_scenes,system+'_scene')(sys.modules[__name__])
    scene_objects=list(bpy.context.scene.objects)
    coll=collection(system.title()+' / authored architecture and technical components')
    move_collection(scene_objects,coll)
    setup_scene(system,preview)
    bpy.ops.wm.save_as_mainfile(filepath=str(EDITABLE/(('vertical-farm' if system=='vertical' else system)+'.blend')))
    bpy.ops.render.render(write_still=True)
    print('RENDER_READY '+bpy.context.scene.render.filepath,flush=True)


def render_detail(preview=False):
    clear()
    vertical_scene()
    objects=list(bpy.context.scene.objects)
    move_collection(objects,collection('Lettuce detail / original leaf and NFT geometry'))
    setup_scene('vertical',preview)
    scene=bpy.context.scene
    cam=scene.camera
    target=Vector((-4.2,-1.94,2.57))
    cam.location=(-3.43,-4.85,3.22)
    cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.type='PERSP'
    cam.data.lens=67
    focus=bpy.data.objects.new('Leaf focus point',None)
    bpy.context.scene.collection.objects.link(focus)
    focus.location=target
    cam.data.dof.use_dof=True
    cam.data.dof.focus_object=focus
    cam.data.dof.aperture_fstop=9
    scene.render.filepath=str((EDITABLE if preview else RENDERS)/('lettuce-detail-preview.png' if preview else 'lettuce-detail.png'))
    bpy.ops.wm.save_as_mainfile(filepath=str(EDITABLE/'lettuce-detail.blend'))
    bpy.ops.render.render(write_still=True)
    print('DETAIL_READY '+scene.render.filepath,flush=True)


def main():
    global RENDER_QUALITY
    sys.path.insert(0,str(Path(__file__).resolve().parent))
    parser=argparse.ArgumentParser()
    parser.add_argument('--assets',action='store_true')
    parser.add_argument('--scene',choices=['vertical','greenhouse','field'])
    parser.add_argument('--preview',action='store_true')
    parser.add_argument('--render-all',action='store_true')
    parser.add_argument('--detail',action='store_true')
    args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
    RENDER_QUALITY=bool(args.scene or args.render_all or args.detail)
    clear();palette()
    if args.assets:
        asset_export('lettuce-low',lambda:build_lettuce(low=True))
        asset_export('lettuce',build_lettuce)
        asset_export('rack-tier',tray_component)
        asset_export('tank',add_tank)
        asset_export('pump',add_pump)
        asset_export('air-handler',add_climate)
        asset_export('harvest-cart',add_harvest_cart)
    if args.scene:
        render_scene(args.scene,args.preview)
    if args.detail:
        render_detail(args.preview)
    if args.render_all:
        for system in ['vertical','greenhouse','field']:
            render_scene(system)
        manifest={'authored':'2026-11-16','generator':'Blender 5.2 / scripts/blender/build_assets.py and outdoor_scenes.py','engine':'Cycles / OPTIX / 128 adaptive samples / denoised','resolution':[2048,1408],'assets':[{'system':s,'file':('vertical-farm' if s=='vertical' else s)+'.png','levels':4 if s=='vertical' else 1,'camera':'Individually framed orthographic exhibition view','modelSource':'output/blender/'+('vertical-farm' if s=='vertical' else s)+'.blend','meaning':'Fixed illustrative reference geometry, no operating plant, no live scenario state'} for s in ['vertical','greenhouse','field']]}
        manifest['assets'].append({'system':'vertical','file':'lettuce-detail.png','levels':4,'camera':'67 mm perspective, f/9 depth of field, leaf/NFT/LED detail','modelSource':'output/blender/lettuce-detail.blend','meaning':'Fixed close-up of authored organic leaf geometry, not a growth simulation'})
        (RENDERS/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')


if __name__=='__main__':
    main()
