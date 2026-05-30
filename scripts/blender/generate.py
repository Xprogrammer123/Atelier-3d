"""
Atelier: generate GLB from listing photos.
- Seating / Lighting / Surfaces use curated template meshes (same family as landing demos)
- Other categories fall back to a dimensioned box with 4 photo textures

Usage:
  blender --background --python generate.py -- \\
    <work_dir> <output.glb> [width_m depth_m height_m] [category]
"""

import sys
import os

import bpy
from mathutils import Vector

LABELS = ["front", "back", "left", "right"]
DEFAULT_DIMS = (1.0, 0.6, 0.8)

# Maps listing category → demo-quality template in public/models/
CATEGORY_TEMPLATES = {
    "Seating": "chair.glb",
    "Lighting": "floor-lamp.glb",
    "Surfaces": "side-table.glb",
    "Dining": "side-table.glb",
    "Office": "side-table.glb",
}


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def load_image(path: str):
    if not os.path.isfile(path):
        print(f"Missing image: {path}")
        return None
    return bpy.data.images.load(path, check_existing=False)


def project_root():
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def resolve_template(category: str):
    filename = CATEGORY_TEMPLATES.get(category)
    if not filename:
        return None
    path = os.path.join(project_root(), "public", "models", filename)
    return path if os.path.isfile(path) else None


def make_textured_material(name: str, image):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = image
    tex.interpolation = "Smart"
    links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def make_flat_material(name: str, rgb=(0.75, 0.72, 0.68, 1.0)):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = rgb
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def dominant_axis(normal: Vector):
    axes = [("x", normal.x), ("y", normal.y), ("z", normal.z)]
    axis, value = max(axes, key=lambda item: abs(item[1]))
    return axis, 1 if value >= 0 else -1


def assign_materials(box, slot_by_label: dict):
    face_map = {
        ("y", 1): "front",
        ("y", -1): "back",
        ("x", 1): "right",
        ("x", -1): "left",
    }
    label_to_index = {label: i for i, label in enumerate(LABELS)}
    top_index = len(LABELS)
    bottom_index = len(LABELS) + 1

    for poly in box.data.polygons:
        axis, sign = dominant_axis(poly.normal)
        if axis == "z":
            poly.material_index = top_index if sign == 1 else bottom_index
            continue
        label = face_map.get((axis, sign))
        if label and label in slot_by_label:
            poly.material_index = label_to_index[label]
        else:
            poly.material_index = 0


def build_textured_box(images: dict, width_m: float, depth_m: float, height_m: float):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, height_m / 2))
    box = bpy.context.active_object
    box.name = "ListingModel"
    box.scale = (width_m, depth_m, height_m)

    materials = [make_textured_material(f"Mat_{label}", images[label]) for label in LABELS]
    materials.append(make_flat_material("Mat_top"))
    materials.append(make_flat_material("Mat_bottom"))

    box.data.materials.clear()
    for mat in materials:
        box.data.materials.append(mat)

    assign_materials(box, {label: i for i, label in enumerate(LABELS)})
    return box


def apply_front_texture_to_object(obj, front_image):
    if not front_image or not obj.data.materials:
        return
    mat = obj.data.materials[0]
    if not mat.use_nodes:
        mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    tex_nodes = [n for n in nodes if n.type == "TEX_IMAGE"]
    if tex_nodes:
        tex_nodes[0].image = front_image
        return

    bsdf = next((n for n in nodes if n.type == "BSDF_PRINCIPLED"), None)
    if not bsdf:
        return
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = front_image
    tex.interpolation = "Smart"
    links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])


def build_from_template(template_path: str, front_image, width_m: float, depth_m: float, height_m: float):
    bpy.ops.import_scene.gltf(filepath=template_path)
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if not meshes:
        return None

    bpy.ops.object.select_all(action="DESELECT")
    for obj in meshes:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()

    obj = bpy.context.active_object
    obj.name = "ListingModel"

    dims = obj.dimensions
    if dims.x > 0.001:
        obj.scale.x *= width_m / dims.x
    if dims.y > 0.001:
        obj.scale.y *= depth_m / dims.y
    if dims.z > 0.001:
        obj.scale.z *= height_m / dims.z

    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    # Sit on floor (z = 0)
    bpy.context.view_layer.update()
    min_z = min((obj.matrix_world @ Vector(corner)).z for corner in obj.bound_box)
    obj.location.z -= min_z

    apply_front_texture_to_object(obj, front_image)
    print(f"Used template: {template_path}")
    return obj


def parse_args(argv):
    if len(argv) < 2:
        print("Usage: generate.py <work_dir> <output.glb> [width_m depth_m height_m] [category]")
        sys.exit(1)

    work_dir, output = argv[0], argv[1]
    width, depth, height = DEFAULT_DIMS
    category = "Surfaces"

    if len(argv) >= 5:
        try:
            width = max(float(argv[2]), 0.05)
            depth = max(float(argv[3]), 0.05)
            height = max(float(argv[4]), 0.05)
        except ValueError:
            print("Invalid dimensions — using defaults")

    if len(argv) >= 6:
        category = argv[5]

    return work_dir, output, width, depth, height, category


def main():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    work_dir, output, width_m, depth_m, height_m, category = parse_args(argv)

    images = {}
    for label in LABELS:
        img = load_image(os.path.join(work_dir, f"{label}.jpg"))
        if img is None:
            print(f"ERROR: required photo missing for {label}")
            sys.exit(1)
        images[label] = img
        print(f"Loaded {label}: {img.size[0]}x{img.size[1]}")

    clear_scene()

    template = resolve_template(category)
    model = None
    if template:
        model = build_from_template(template, images["front"], width_m, depth_m, height_m)

    if model is None:
        print(f"No template for '{category}' — using textured box")
        build_textured_box(images, width_m, depth_m, height_m)

    os.makedirs(os.path.dirname(output) or ".", exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=output,
        export_format="GLB",
        export_apply=True,
        export_draco_mesh_compression_enable=True,
    )
    print(f"Exported {output} ({width_m:.2f}m x {depth_m:.2f}m x {height_m:.2f}m, {category})")


if __name__ == "__main__":
    main()
