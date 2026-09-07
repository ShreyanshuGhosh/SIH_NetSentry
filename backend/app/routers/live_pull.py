import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional

from app.services.ssh_collector import stream_ssh_collection

router = APIRouter(tags=["live_pull"])

class SSHTestRequest(BaseModel):
    host: str
    port: int = 22
    username: str = "admin"
    password: Optional[str] = ""
    command: Optional[str] = "show running-config"

@router.websocket("/ws/live-pull")
async def websocket_live_pull(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_text()
        params = json.loads(data)
        host = params.get("host", "127.0.0.1")
        port = int(params.get("port", 22))
        username = params.get("username", "admin")
        password = params.get("password", "")
        enable_pw = params.get("enable_password", "")
        command = params.get("command", "show running-config")

        async for event in stream_ssh_collection(
            host=host,
            port=port,
            username=username,
            password=password,
            enable_password=enable_pw,
            command=command
        ):
            await websocket.send_json(event)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({
                "status": "failed",
                "message": f"WebSocket server error: {str(e)}"
            })
        except Exception:
            pass

@router.post("/api/live-pull/test")
async def test_ssh_connection(req: SSHTestRequest):
    logs = []
    async for event in stream_ssh_collection(
        host=req.host,
        port=req.port,
        username=req.username,
        password=req.password or "",
        command=req.command or "show running-config"
    ):
        logs.append(event)
    return {"host": req.host, "port": req.port, "events": logs}
