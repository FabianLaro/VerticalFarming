"""Original sunlit greenhouse and field models; no imported geometry or textures.

Called by build_assets.py inside Blender. Coordinates: metres, Z up.
"""
import math
import random
import bpy
from mathutils import Vector


def _beam(api, name, start, end, width, mat, depth=None):
    a, b = Vector(start), Vector(end)
    obj = api.box(name, (a + b) * .5, (width, depth or width, (b - a).length), mat, bevel=min(width * .14, .015))
    obj.rotation_euler = (b - a).to_track_quat('Z', 'Y').to_euler()
    return obj


def _soil(api, name, color):
    mat = api.material(name, color, rough=.96)
    nodes = mat.node_tree.nodes
    shader = next(node for node in nodes if node.type == 'BSDF_PRINCIPLED')
    tex = nodes.new('ShaderNodeTexNoise')
    tex.inputs['Scale'].default_value = 28
    tex.inputs['Detail'].default_value = 3
    tex.inputs['Roughness'].default_value = .8
    bump = nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = .24
    bump.inputs['Distance'].default_value = .055
    mat.node_tree.links.new(tex.outputs['Fac'], bump.inputs['Height'])
    mat.node_tree.links.new(bump.outputs['Normal'], shader.inputs['Normal'])
    return mat


def _crate(api, loc, name='Erntekiste', filled=False, scale=1):
    x, y, z = loc
    w, d, h = .82 * scale, .58 * scale, .34 * scale
    plastic = api.M['dark']
    api.box(name + '_Boden', (x, y, z + .035 * scale), (w, d, .07 * scale), plastic, bevel=.015)
    for dx in [-1, 1]:
        for dy in [-1, 1]:
            api.box(name + '_Eckprofil', (x + dx * (w / 2 - .025), y + dy * (d / 2 - .025), z + h / 2), (.05 * scale, .05 * scale, h), plastic, bevel=.009)
    for row in range(4):
        zz = z + .09 * scale + row * .07 * scale
        for dy in [-1, 1]:
            api.box(name + '_Laengsrippe', (x, y + dy * d / 2, zz), (w, .028 * scale, .035 * scale), plastic, bevel=.006)
        for dx in [-1, 1]:
            api.box(name + '_Querrippe', (x + dx * w / 2, y, zz), (.028 * scale, d, .035 * scale), plastic, bevel=.006)
    for dy in [-1, 1]:
        api.box(name + '_Stapelrand', (x, y + dy * d / 2, z + h), (w + .04 * scale, .07 * scale, .05 * scale), plastic, bevel=.012)
    for dx in [-1, 1]:
        api.box(name + '_Stapelrand', (x + dx * w / 2, y, z + h), (.07 * scale, d + .04 * scale, .05 * scale), plastic, bevel=.012)
    if filled:
        api.add_lettuce(loc=(x - .2 * scale, y, z + .09 * scale), scale=.82 * scale, seed=421)
        api.add_lettuce(loc=(x + .2 * scale, y, z + .09 * scale), scale=.82 * scale, seed=422)


def _water_station(api, loc, name='Wasseranschluss'):
    x, y, z = loc
    tankmat = api.material(name + '_HDPE', (.74, .77, .65, 1), rough=.35)
    api.box(name + '_Palette', (x, y, z + .08), (1.14, 1.02, .16), api.M['dark'], bevel=.025)
    api.box(name + '_Behaelter', (x, y, z + .72), (.99, .89, 1.12), tankmat, bevel=.085)
    for yy in [-.47, .47]:
        for dx in [-.5, -.25, 0, .25, .5]:
            api.box(name + '_GitterV', (x + dx, y + yy, z + .72), (.025, .025, 1.2), api.M['steel'], bevel=.006)
        for zz in [.17, .45, .74, 1.02, 1.3]:
            api.box(name + '_GitterH', (x, y + yy, z + zz), (1.09, .025, .025), api.M['steel'], bevel=.006)
    for xx in [-.54, .54]:
        for dy in [-.43, 0, .43]:
            api.box(name + '_GitterSeite', (x + xx, y + dy, z + .72), (.025, .025, 1.2), api.M['steel'], bevel=.006)
        for zz in [.17, .45, .74, 1.02, 1.3]:
            api.box(name + '_GitterSeiteH', (x + xx, y, z + zz), (.025, .97, .025), api.M['steel'], bevel=.006)
    api.cyl(name + '_Deckel', (x, y, z + 1.32), .16, .065, api.M['dark'])
    api.pipe(name + '_Auslauf', [(x, y - .49, z + .25), (x, y - .65, z + .25), (x + .35, y - .65, z + .25)], .044, api.M['water'])
    api.box(name + '_Ventilhebel', (x + .1, y - .65, z + .32), (.22, .045, .035), api.M['dark'], bevel=.01)
    api.box(name + '_Steuerung', (x + .78, y, z + .68), (.28, .45, .72), api.M['white'], bevel=.035)
    api.box(name + '_Anzeige', (x + .78, y - .232, z + .81), (.19, .018, .13), api.M['dark'], bevel=.006)
    api.cyl(name + '_Schalter', (x + .77, y - .25, z + .55), .035, .025, api.M['water'], rot=(math.pi / 2, 0, 0), vertices=20)


def _soil_scatter(api, bounds, z, mat, seed, count=170):
    # A single authored mesh for all small clods keeps the scene economical.
    rng = random.Random(seed)
    verts, faces = [], []
    x0, x1, y0, y1 = bounds
    for _ in range(count):
        x, y = rng.uniform(x0, x1), rng.uniform(y0, y1)
        sx, sy, sz = rng.uniform(.016, .048), rng.uniform(.014, .04), rng.uniform(.007, .022)
        base = len(verts)
        verts.extend([(x - sx, y, z), (x, y - sy, z), (x + sx, y, z), (x, y + sy, z), (x, y, z + sz)])
        faces.extend([(base, base + 1, base + 4), (base + 1, base + 2, base + 4), (base + 2, base + 3, base + 4), (base + 3, base, base + 4)])
    mesh = bpy.data.meshes.new('ErdkrumenMesh')
    mesh.from_pydata(verts, [], faces)
    mesh.materials.append(mat)
    obj = bpy.data.objects.new('Erdkrumen', mesh)
    bpy.context.collection.objects.link(obj)


def greenhouse_scene(api):
    """Soil-grown, sunlit glasshouse, opened at one roof quarter as a cutaway."""
    m = api.M
    soil = _soil(api, 'Gewaechshaus_Lebender_Boden', (.19, .125, .074, 1))
    floor = api.material('Gewaechshaus_Betonweg', (.57, .56, .48, 1), rough=.89)
    api.box('Gewaechshaus_Schnittsockel', (0, 0, -.08), (14.5, 9.25, .35), m['concrete'], bevel=.08)
    api.box('Gewaechshaus_Fundament', (0, 0, .13), (11.85, 7.4, .23), floor, bevel=.025)
    # Ground-level soil beds, deliberately not hydroponic racks.
    for bed, x in enumerate([-4.2, -1.4, 1.4, 4.2]):
        api.box('Bodenbeet_%d' % bed, (x, 0, .3), (2.16, 6.35, .18), soil, bevel=.035)
        for side in [-1, 1]:
            api.box('Verzinkte_Beetkante', (x + side * 1.09, 0, .3), (.035, 6.42, .24), m['steel'], bevel=.008)
        for row in range(13):
            for col in range(4):
                api.add_lettuce(loc=(x - .77 + col * .51, -2.96 + row * .49, .405), scale=1.08 + .04 * ((col + row + bed) % 4), seed=1000 + bed * 100 + row * 4 + col)
        for dx in [-.52, .52]:
            api.pipe('Beet_Tropfrohr', [(x + dx, -3.15, .4), (x + dx, 3.15, .4)], .015, m['dark'])
        _soil_scatter(api, (x - 1.05, x + 1.05, -3.13, 3.13), .395, soil, 24 + bed, 65)
    # Real structural rhythm: stanchions, rafters, ridge and glazing bars.
    wall, ridge, half = 3.35, 5.3, 5.8
    frames = [-3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6]
    for frame, y in enumerate(frames):
        for side in [-1, 1]:
            _beam(api, 'Alu_Stuetze', (side * half, y, .2), (side * half, y, wall), .075, m['steel'])
            _beam(api, 'Dachbinder', (side * half, y, wall), (0, y, ridge), .09, m['steel'])
        _beam(api, 'Querzug', (-half, y, wall), (half, y, wall), .04, m['steel'])
    for x, zz in [(-half, wall), (half, wall), (0, ridge), (-half, .28), (half, .28), (-half, 1.6), (half, 1.6)]:
        _beam(api, 'Laengsprofil', (x, -3.65, zz), (x, 3.65, zz), .06, m['steel'])
    for x in [-4.35, -2.9, -1.45, 1.45, 2.9, 4.35]:
        zz = ridge - abs(x) / half * (ridge - wall)
        _beam(api, 'Dachpfette', (x, -3.64, zz), (x, 3.64, zz), .035, m['steel'])
    # Individual glass lights reveal construction and cast restrained reflections.
    slope = math.atan2(ridge - wall, half)
    roof_length = math.hypot(half, ridge - wall)
    for bay in range(6):
        y = -3 + bay * 1.2
        for side in [-1, 1]:
            # The near-right quarter is a purposeful architectural opening.
            if side == 1 and bay < 3:
                continue
            obj = api.box('Dachglas', (side * half / 2, y, (ridge + wall) / 2), (roof_length - .035, 1.165, .012), m['glass'], bevel=.003)
            obj.rotation_euler[1] = side * slope
    for side in [-1, 1]:
        for bay in range(6):
            y = -3 + bay * 1.2
            # Clear lower front corner in the cutaway; the far side stays enclosed.
            if side == 1 and bay < 2:
                continue
            api.box('Seitenglas', (side * 5.8, y, 1.83), (.012, 1.165, 2.95), m['glass'], bevel=.002)
    # Back gable, with triangular panes generated directly as thin surfaces.
    api.box('Rueckwandglas', (0, 3.61, 1.82), (11.55, .012, 3.0), m['glass'], bevel=.002)
    for side in [-1, 1]:
        coords = [(side * .03, 3.61, wall + .03), (side * 5.76, 3.61, wall + .03), (side * .03, 3.61, ridge - .035)]
        mesh = bpy.data.meshes.new('GiebelglasMesh')
        mesh.from_pydata(coords, [], [(0, 1, 2)])
        mesh.materials.append(m['glass'])
        obj = bpy.data.objects.new('Giebelglas', mesh)
        bpy.context.collection.objects.link(obj)
    # Front opening has a recognizable sliding-door rail and door pulled aside.
    _beam(api, 'Tuersturz', (-2.1, -3.66, 2.62), (2.1, -3.66, 2.62), .08, m['steel'])
    for x in [-1.05, 1.05]:
        _beam(api, 'Tuerpfosten', (x, -3.66, .22), (x, -3.66, 2.63), .065, m['steel'])
    for x in [1.12, 2.1]:
        _beam(api, 'Schiebetuerrahmen', (x, -3.68, .24), (x, -3.68, 2.55), .035, m['steel'])
    api.box('Schiebetuerglas', (1.61, -3.68, 1.4), (.95, .012, 2.26), m['glass'], bevel=.003)
    api.box('Tuergriff', (1.25, -3.75, 1.35), (.035, .06, .23), m['dark'], bevel=.009)
    # Gutter and downpipe lead to a metered auxiliary water supply.
    api.pipe('Dachrinne', [(5.91, -3.72, 3.37), (5.91, 3.72, 3.37)], .075, m['steel'])
    api.pipe('Regenfallrohr', [(5.91, 3.5, 3.37), (6.05, 3.5, 3.23), (6.05, 3.5, .32), (6.25, 3.25, .32)], .05, m['steel'])
    _water_station(api, (6.35, 1.9, .11), 'Gewaechshaus_Zusatzwasser')
    api.pipe('Bewasserungsverteiler', [(6.35, 1.2, .36), (6.35, 3.24, .36), (-4.72, 3.24, .36)], .036, m['dark'])
    for x in [-4.2, -1.4, 1.4, 4.2]:
        api.pipe('Bewasserungsabzweig', [(x, 3.24, .36), (x, 2.98, .4)], .022, m['dark'])
    _crate(api, (6.3, -2.0, .12), 'Erntekiste', filled=True)
    _crate(api, (6.3, -2.78, .12), 'Leerkisten_Untere')
    _crate(api, (6.3, -2.78, .49), 'Leerkisten_Obere')


def field_scene(api):
    """Seasonal ground cultivation with soil profile and drip irrigation."""
    m = api.M
    rng = random.Random(143)
    soil = _soil(api, 'Freiland_Oberboden', (.25, .16, .09, 1))
    subsoil = _soil(api, 'Freiland_Unterboden', (.40, .29, .17, 1))
    stone = api.material('Freiland_Kiesel', (.45, .42, .34, 1), rough=.94)
    api.box('Freiland_Schnittsockel', (0, 0, -.08), (14.5, 9.25, .32), m['concrete'], bevel=.07)
    # Layered cross-section rather than an abstract green slab.
    api.box('Mineralischer_Unterboden', (0, 0, .17), (13.9, 8.7, .28), subsoil, bevel=.025)
    api.box('Humoser_Oberboden', (0, 0, .39), (13.9, 8.7, .16), soil, bevel=.025)
    for bed, y in enumerate([-3.2, -1.92, -.64, .64, 1.92, 3.2]):
        # Rounded raised beds have shallow sloping shoulders, made as custom mesh.
        half_length, half_width, low, high = 6.55, .49, .47, .64
        cross = [(-half_width - .12, low), (-half_width, high - .035), (-half_width + .13, high), (half_width - .13, high), (half_width, high - .035), (half_width + .12, low)]
        verts = [(xx, y + yy, zz) for xx in [-half_length, half_length] for yy, zz in cross]
        faces = []
        for i in range(len(cross) - 1):
            faces.append((i, i + 1, len(cross) + i + 1, len(cross) + i))
        faces.extend([tuple(reversed(range(len(cross)))), tuple(range(len(cross), 2 * len(cross)))])
        mesh = bpy.data.meshes.new('FreilandbeetMesh')
        mesh.from_pydata(verts, [], faces)
        mesh.materials.append(soil)
        obj = bpy.data.objects.new('Geformtes_Bodenbeet_%02d' % bed, mesh)
        bpy.context.collection.objects.link(obj)
        for row in range(23):
            for col in range(2):
                x = -6.08 + row * .55
                yy = y - .23 + col * .46
                if x > 5.2 and -1.25 < yy < 1.3:
                    continue  # Small working corner, not crops intersecting harvest crates.
                api.add_lettuce(loc=(x + rng.uniform(-.035, .035), yy + rng.uniform(-.025, .025), .645), scale=rng.uniform(.95, 1.18), seed=2000 + bed * 100 + row * 2 + col)
        api.pipe('Tropfschlauch', [(-6.6, y, .652), (6.6, y, .652)], .015, m['dark'])
        _soil_scatter(api, (-6.5, 6.5, y - .45, y + .45), .647, soil, 70 + bed, 85)
    # Header manifold, hose couplings and capped laterals are real geometry.
    api.pipe('Freiland_Hauptleitung', [(-6.76, -3.82, .54), (-6.76, 3.65, .54)], .038, m['dark'])
    for y in [-3.2, -1.92, -.64, .64, 1.92, 3.2]:
        api.pipe('Tropfabzweig', [(-6.76, y, .54), (-6.6, y, .65)], .02, m['dark'])
        api.cyl('Endkappe', (6.6, y, .652), .028, .045, m['dark'], rot=(0, math.pi / 2, 0), vertices=16)
    _water_station(api, (6.15, -3.55, .5), 'Freiland_Bewasserung')
    api.pipe('Versorgungsschlauch', [(6.12, -4.21, .75), (5.8, -4.22, .55), (-6.76, -4.22, .55), (-6.76, -3.82, .54)], .035, m['dark'])
    # Three visible geological bands on the front face, with sparse embedded stones.
    for index in range(24):
        x = rng.uniform(-6.7, 6.7)
        z = rng.uniform(.07, .28)
        obj = api.box('Bodenprofil_Kiesel', (x, -4.356, z), (rng.uniform(.04, .13), .019, rng.uniform(.025, .065)), stone, bevel=.015)
        obj.rotation_euler[1] = rng.uniform(-.5, .5)
    # Harvest corner and one tool: functional agricultural details, no stock props.
    _crate(api, (6.0, -.6, .5), 'Freiland_Erntekiste', filled=True)
    _crate(api, (6.0, .2, .5), 'Freiland_Leerkiste')
    _crate(api, (6.0, .2, .87), 'Freiland_Leerkiste_Oben')
    _beam(api, 'Spatenstiel', (6.6, 1.05, .65), (6.3, 1.17, 2.14), .045, m['wood'])
    api.box('Spatenblatt', (6.63, 1.04, .65), (.27, .045, .37), m['steel'], bevel=.04)
    _beam(api, 'Spatengriff_Quer', (6.13, 1.17, 2.15), (6.47, 1.17, 2.15), .055, m['wood'])
    for xx in [-6.8, 6.8]:
        for yy in [-4.1, 4.1]:
            api.box('Parzellenmarkierung', (xx, yy, .75), (.07, .07, .55), m['wood'], bevel=.008)

