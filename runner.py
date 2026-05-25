import subprocess
import time
import sys
import os

server_process = subprocess.Popen([sys.executable, "server.py"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(3)

print("Running tests...")
test_process = subprocess.run([sys.executable, "test_site.py"], capture_output=True, text=True)
print("TEST STDOUT:\n", test_process.stdout)
print("TEST STDERR:\n", test_process.stderr)

server_process.terminate()
