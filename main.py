import base64
import json
import os

import psutil
import asyncio
from aiohttp import web, WSMsgType

from util import log


class ServerInfo(object):
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(ServerInfo, cls).__new__(
                cls, *args, **kwargs)
        return cls._instance

    def __init__(self):
        self.data = {}
        set_static_data()

    def set_static_data():
        """
        set static data for onece
        """
        self.data["cpu_numbers"] = psutil.cpu_count()
        self.data["cpu_freq"] = psutil.cpu_freq(percpu=False)[0].max

    ###
    # TODO: add more info
    #       1.  cpu related
    #       2.  memory related
    #       3.  network related
    ###
    def update(self):
        """
        update dynamic data
        """
        cpu_percent = psutil.cpu_percent(interval=None)
        self.data["cpu_percent"] = cpu_percent


async def index(request):
    name = request.match_info.get('name', "Anonymous")
    text = "Hello, " + name
    return web.FileResponse('./index.html')


class chatroom(web.View):
    """
    chat room web socket
    """
    async def get(self):
        app = self.request.app
        ws = web.WebSocketResponse()
        await ws.prepare(self.request)
        app.connections.add(ws)
        log(app.connections)
        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                if msg.data == 'close':
                    app.connections.remove(ws)
                    await ws.close()
                else:
                    info = ServerInfo()
                    while 1:
                        await asyncio.sleep(1)
                        info.update()
                        log(info.data)
                        await self.brocast(info.data)

            elif msg.type == WSMsgType.ERROR:
                log('ws connection closed with exception %s' %
                    ws.exception())

    async def brocast(self, message: str)->None:
        for ws in self.request.app.connections:
            await ws.send_json({"message": message})


async def create_app():
    PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

    app = web.Application()

    # add router
    app.router.add_route('GET', '/', index, name='index')
    app.router.add_route('GET', '/ws/', chatroom, name='chatroom')
    app.router.add_static('/static/',
                          path=PROJECT_ROOT + '/static',
                          name='static')

    # init connections store
    app.connections = set()

    return app


def main():
    app = create_app()
    # app = web.Application()
    web.run_app(app, port=8000)


if __name__ == '__main__':
    main()
