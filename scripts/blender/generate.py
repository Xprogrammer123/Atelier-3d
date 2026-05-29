"""
Atelier MVP: texture-mapped box mesh from 4 photos.
Usage: blender --background --python generate.py -- <work_dir> <output.glb>
Expects front.jpg, back.jpg, left.jpg, right.jpg in work_dir.
"""

import sys
import os

import bpy


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def load_image(path: str):
    if not os.path.isfile(path):
        return None
    return bpy.data.images.load(path, check_existing=True)


def main():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    if len(argv) < 2:
        print("Usage: generate.py <work_dir> <output.glb>")
        sys.exit(1)

    work_dir, output = argv[0], argv[1]
    labels = ["front", "back", "left", "right"]
    images = {label: load_image(os.path.join(work_dir, f"{label}.jpg")) for label in labels}

    clear_scene()

    # Parametric box — width 1m, depth 0.6m, height 0.8m (furniture-ish proportions)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.4))
    box = bpy.context.active_object
    box.scale = (0.5, 0.3, 0.4)

    mat = bpy.data.materials.new(name="FurnitureMat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = images.get("front") or next((v for v in images.values() if v), None)
    links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    box.data.materials.append(mat)

    # UV unwrap for texture
    bpy.ops.object.select_all(action="DESELECT")
    box.select_set(True)
    bpy.context.view_layer.objects.active = box
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project()
    bpy.ops.object.mode_set(mode="OBJECT")

    os.makedirs(os.path.dirname(output) or ".", exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=output,
        export_format="GLB",
        export_apply=True,
        export_draco_mesh_compression_enable=True,
    )
    print(f"Exported {output}")


if __name__ == "__main__":
    main()
