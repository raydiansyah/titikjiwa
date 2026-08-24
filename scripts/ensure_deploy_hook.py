from pathlib import Path

SERVER = Path("/app/backend/server.py")
text = SERVER.read_text()

if "trigger_deploy" in text:
    print("deploy hook sudah ada")
    raise SystemExit(0)

if "import subprocess" not in text:
    if "import os\n" not in text:
        raise SystemExit("anchor import os tidak ditemukan")
    text = text.replace("import os\n", "import os\nimport subprocess\n", 1)

ENDPOINT = '''
@api_router.post("/deploy")
async def trigger_deploy(request: Request):
    if request.headers.get("x-deploy-token", "") != os.environ.get("DEPLOY_TOKEN", ""):
        raise HTTPException(status_code=401, detail="Token deploy tidak valid.")
    log = open("/var/log/auto_deploy.log", "a")
    subprocess.Popen(["/app/scripts/auto_deploy.sh"], stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
    return {"ok": True, "message": "Deploy dimulai. Pantau /var/log/auto_deploy.log."}

'''

marker = "app.include_router(api_router)"
if marker not in text:
    raise SystemExit("anchor include_router tidak ditemukan")
text = text.replace(marker, ENDPOINT + marker, 1)
SERVER.write_text(text)
print("deploy hook dipasang")
