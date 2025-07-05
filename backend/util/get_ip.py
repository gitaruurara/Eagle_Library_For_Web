"""
現在のローカルIPアドレスを取得するためのユーティリティモジュール。
"""
# backend/get_ip.py
import socket

def get_ip_address():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't actually send data
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except socket.error:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

if __name__ == "__main__":
    print(get_ip_address())
