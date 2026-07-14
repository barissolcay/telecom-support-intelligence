import subprocess
import sys


def main() -> None:
    api = subprocess.Popen([sys.executable, "-m", "uvicorn", "telcoassist.api.app:app", "--reload", "--port", "8000"])
    try:
        subprocess.run(["npm", "--prefix", "apps/web", "run", "dev"], check=True, shell=sys.platform == "win32")
    finally:
        api.terminate()


if __name__ == "__main__":
    main()
