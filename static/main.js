// utility part
const log = console.log.bind(console)
const sel = selector => document.querySelector(selector)

// let's  rock
const info = () => {
    const ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
    try {
        const ws = new WebSocket(
            ws_scheme + '://' + window.location.host
            + "/ws/"
        )
        ws.onopen = () => ws.send('hello');

        ws.onmessage = (message) => {
            log(message.data)
            render(message)
        }
        // log if error
        ws.onclose = (e) => {
            leave_log(e)
        }
    } catch (error) {
        log(error)
    }
}

const render = (message) => {
    const data = JSON.parse(message.data)
    log(data)
    const info = data['message']
    log(info)
    server_info = sel('#server-info-id')
    server_info.innerHTML = '';
    cpu_percent = info['cpu_percent']
    info_template = `<progress class="progress is-primary" value="${cpu_percent}" max="100">${cpu_percent}</progress>`
    server_info.insertAdjacentHTML('beforeend', info_template)
}

const leave_log = (e) => {
    const code = event.code
    const reason = event.reason
    const wasClean = event.wasClean
    log(`code:${code}\nreason:${reason}wasClean:${wasClean}`)
}

const main = () => {
    log("let's rock")
    info()
    // show_chatrooms()
    // // chat("test")
}
main()