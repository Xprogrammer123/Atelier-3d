"""
Atelier: texture-mapped box from 4 listing photos + seller dimensions.
Usage:
  blender --background --python generate.py -- <work_dir> <output.glb> [width_m depth_m height_m]
Expects front.jpg, back.jpg, left.jpg, right.jpg in work_dir.
"""

import sys
import os

import bpy
from mathutils import Vector

LABELS = ["front", "back", "left", "right"]
DEFAULT_DIMS = (1.0, 0.6, 0.8)  # width (X), depth (Y), height (Z) in metres


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def load_image(path: str):
    if not os.path.isfile(path):
        print(f"Missing image: {path}")
        return None
    # Always reload — avoid reusing datablocks from prior runs in the same session
    return bpy.data.images.load(path, check_existing=False)


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
    axes = [
        ("x", normal.x),
        ("y", normal.y),
        ("z", normal.z),
    ]
    axis, value = max(axes, key=lambda item: abs(item[1]))
    return axis, 1 if value >= 0 else -1


def assign_materials(box, slot_by_label: dict):
    """Map cube face normals to front/back/left/right photo materials."""
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


def parse_dims(argv):
    if len(argv) >= 5:
        try:
            width = max(float(argv[2]), 0.05)
            depth = max(float(argv[3]), 0.05)
            height = max(float(argv[4]), 0.05)
            return width, depth, height
        except ValueError:
            print("Invalid dimensions — using defaults")
    return DEFAULT_DIMS


def main():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    if len(argv) < 2:
        print("Usage: generate.py <work_dir> <output.glb> [width_m depth_m height_m]")
        sys.exit(1)

    work_dir, output = argv[0], argv[1]
    width_m, depth_m, height_m = parse_dims(argv)

    images = {}
    for label in LABELS:
        img = load_image(os.path.join(work_dir, f"{label}.jpg"))
        if img is None:
            print(f"ERROR: required photo missing for {label}")
            sys.exit(1)
        images[label] = img
        print(f"Loaded {label}: {img.size[0]}x{img.size[1]}")

    clear_scene()

    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, height_m / 2))
    box = bpy.context.active_object
    box.name = "ListingModel"
    box.scale = (width_m, depth_m, height_m)

    materials = []
    for label in LABELS:
        materials.append(make_textured_material(f"Mat_{label}", images[label]))
    materials.append(make_flat_material("Mat_top"))
    materials.append(make_flat_material("Mat_bottom"))

    box.data.materials.clear()
    for mat in materials:
        box.data.materials.append(mat)

    assign_materials(box, {label: i for i, label in enumerate(LABELS)})

    os.makedirs(os.path.dirname(output) or ".", exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=output,
        export_format="GLB",
        export_apply=True,
        export_draco_mesh_compression_enable=True,
    )
    print(f"Exported {output} ({width_m:.2f}m x {depth_m:.2f}m x {height_m:.2f}m)")


if __name__ == "__main__":
    main()
