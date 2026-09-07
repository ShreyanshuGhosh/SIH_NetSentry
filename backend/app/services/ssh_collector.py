import socket
import time
from typing import AsyncGenerator, Dict, Any
import paramiko

async def stream_ssh_collection(
    host: str,
    port: int = 22,
    username: str = "admin",
    password: str = "",
    enable_password: str = "",
    command: str = "show running-config"
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Real Paramiko SSH Connection with honest status streaming.
    Yields status updates to WebSocket consumers.
    """
    yield {
        "status": "connecting",
        "message": f"Opening TCP socket to {host}:{port}...",
        "timestamp": time.time()
    }

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        # Step 1: Connect with 4s timeout
        yield {
            "status": "authenticating",
            "message": f"Establishing SSHv2 handshake and authenticating user '{username}'...",
            "timestamp": time.time()
        }

        client.connect(
            hostname=host,
            port=port,
            username=username,
            password=password,
            timeout=4.0,
            allow_agent=False,
            look_for_keys=False
        )

        yield {
            "status": "collecting",
            "message": f"SSH channel established. Executing '{command}'...",
            "timestamp": time.time()
        }

        stdin, stdout, stderr = client.exec_command(command, timeout=5.0)
        output = stdout.read().decode("utf-8", errors="replace")
        err_output = stderr.read().decode("utf-8", errors="replace")

        if err_output and not output:
            yield {
                "status": "failed",
                "message": f"Remote command error: {err_output.strip()}",
                "timestamp": time.time()
            }
        else:
            yield {
                "status": "completed",
                "message": f"Successfully pulled {len(output)} bytes from {host}",
                "config_text": output,
                "timestamp": time.time()
            }

    except paramiko.AuthenticationException as e:
        yield {
            "status": "failed",
            "message": f"SSH Authentication Failed: Invalid credentials for user '{username}' ({str(e)})",
            "timestamp": time.time()
        }
    except (socket.timeout, TimeoutError):
        yield {
            "status": "timeout",
            "message": f"Socket Timeout: Host {host}:{port} is unreachable or dropped SYN packet (Firewall / Air-gapped boundary)",
            "timestamp": time.time()
        }
    except Exception as e:
        yield {
            "status": "failed",
            "message": f"Socket Connection Error: {str(e)}",
            "timestamp": time.time()
        }
    finally:
        client.close()
