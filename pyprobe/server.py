import asyncio
import json
import time
import datetime
import socket
import locale
import cpuinfo
import os

import psutil
from sanic import Sanic, response

from util import log, bytes2human, seconds2human

app = Sanic()
app.static("/static", "./static")


class ServerInfo(object):
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(ServerInfo, cls).__new__(
                cls, *args, **kwargs)
        return cls._instance

    def __init__(self):
        self.data = {}
        self.set_static_data()
        self._updatetime = None
        self.last_up_down = (0, 0)

    def set_static_data(self):
        """
        set static data for onece
        """
        self.data["cpu_numbers"] = psutil.cpu_count()
        self.data["cpu_freq"] = psutil.cpu_freq(percpu=False)
        self.data["hostname"] = socket.gethostname()
        self.data["host"] = socket.gethostbyname(self.data["hostname"])
        cpu_info = cpuinfo.get_cpu_info()
        self.data["processor_brand"] = cpu_info['brand']
        self.data["hz_advertised"] = cpu_info["hz_advertised"]
        self.data["l1_data_cache_size"] = cpu_info["l1_data_cache_size"]
        self.data["l1_instruction_cache_size"] = cpu_info[
            "l1_instruction_cache_size"]
        self.data["l2_cache_size"] = cpu_info["l2_cache_size"]
        self.data["l3_cache_size"] = cpu_info["l3_cache_size"]

    def update(self):
        """
        update dynamic data if it has not updated in 1 second
        """
        now = time.time()
        if not self._updatetime or now - self._updatetime > 1:
            self.update_cpu_data()
            self.update_mem_data()
            self.update_disk_data()
            self.update_network_data()
            self.update_time()

    def update_cpu_data(self):
        cpu_percent = psutil.cpu_percent(interval=None)
        self.data["cpu_percent"] = cpu_percent
        cpu_times_percent = psutil.cpu_times_percent()
        self.data["cpu_idle"] = cpu_times_percent.idle
        self.data["cpu_system"] = cpu_times_percent.system
        self.data["cpu_user"] = cpu_times_percent.user

    def update_mem_data(self):
        mem = psutil.virtual_memory()
        self.data["total_mem"] = bytes2human(mem.total)
        self.data["avaliabale_mem"] = bytes2human(mem.available)
        self.data["used_mem"] = bytes2human(mem.used)
        # shared (Linux, BSD): memory that may be simultaneously accessed by multiple processes.
        self.data["mem_shared"] = bytes2human(mem.shared)
        # cached (Linux, BSD): cache for various things.
        self.data["mem_cached"] = bytes2human(mem.cached)
        # active (UNIX): memory currently in use or very recently used, and so it is in RAM.
        self.data["mem_active"] = bytes2human(mem.active)
        # inactive (UNIX): memory that is marked as not used.
        self.data["mem_inactive"] = bytes2human(mem.inactive)
        self.data["mem_percent"] = mem.percent
        swap = psutil.swap_memory()
        self.data["total_swap"] = bytes2human(swap.total)
        self.data["free_swap"] = bytes2human(swap.free)
        self.data["used_swap"] = bytes2human(swap.used)
        self.data["swap_percent"] = swap.percent

    def update_disk_data(self):
        disk = psutil.disk_usage('/')
        self.data["disk_total"] = bytes2human(disk.total)
        self.data["disk_free"] = bytes2human(disk.free)
        self.data["disk_used"] = bytes2human(disk.used)
        self.data["disk_percent"] = disk.percent
        self.data["partitions_num"] = len(psutil.disk_partitions())
        self.data["type_of_file_system"] = psutil.disk_partitions()[0].fstype

    def update_network_data(self):
        net = psutil.net_io_counters()
        self.data["net_sent"] = bytes2human(net.bytes_sent)
        self.data["net_recv"] = bytes2human(net.bytes_recv)
        self.data["pack_sent"] = net.packets_sent
        self.data["pack_recv"] = net.packets_recv
        self.data["net_speed_up"] = bytes2human(net.bytes_sent -
                                                self.last_up_down[0])
        self.data["net_speed_down"] = bytes2human(net.bytes_recv -
                                                  self.last_up_down[1])
        self.last_up_down = (net.bytes_sent, net.bytes_recv)

    def update_time(self):
        self._updatetime = time.time()
        self.data["server_time"] = datetime.datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S")
        self.data["server_uptime"] = seconds2human(self._updatetime -
                                                   psutil.boot_time())


@app.route("/")
async def index(request):
    return await response.file("index.html")


@app.websocket('/ws/')
async def info(request, ws):
    info = ServerInfo()
    while True:
        info.update()
        await ws.send(json.dumps(info.data))
        await asyncio.sleep(1)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, workers=4)
