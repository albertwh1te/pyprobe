from aiohttp import web


def log(*args):
    print(args)


def redirect(request, router_name, **kwargs):
    """ Redirect to given URL name """
    url = request.app.router[router_name].url_for()
    return web.HTTPFound(url)


def login_required(func):
    """ Only allowed given function """
    async def _warpper(request, *args, **kwargs):
        if request.user is None:
            return redirect(request, 'login')
        return await func(request, *args, **kwargs)
    return _warpper


async def get_object_or_404(request, model, **kwargs):
    """ Get object or raise HttpNotFound """
    try:
        return await request.app.objects.get(model, **kwargs)
    except model.DoesNotExist:
        raise web.HTTPNotFound()
