import base64, json, pathlib
root = pathlib.Path(__file__).resolve().parent
b64 = lambda p: base64.b64encode(pathlib.Path(p).read_bytes()).decode()
imgs = {}
for n in ["camiseta", "regata", "legging", "short", "tenis", "luva", "garrafa", "halter"]:
    imgs[n] = "data:image/svg+xml;base64," + b64(root.parent / "public/demo" / f"{n}.svg")
t = (root / "template.html").read_text()
t = (t.replace("{{FONT_OUTFIT}}", b64(root.parent / "node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2"))
       .replace("{{FONT_INTER}}", b64(root.parent / "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2"))
       .replace("{{LOGO}}", b64(root.parent / "public/brand/ana-fitness-logo.png"))
       .replace("{{IMGS}}", json.dumps(imgs))
       .replace("{{APP_JS}}", (root / "app.js").read_text()))
(root / "ana-fitness-demo.html").write_text(t)
print(len(t) // 1024, "KB")
