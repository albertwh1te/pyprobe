// utility part
const log = console.log.bind(console)
const sel = selector => document.querySelector(selector)
const rewrite = (selector, html) => {
    let ele = sel(selector)
    ele.innerHTML = ""
    ele.insertAdjacentHTML("beforeend", html)
}

const info = (gauge) => {
    const ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
    try {
        const ws = new WebSocket(
            ws_scheme + '://' + window.location.host
            + "/ws/"
        )
        ws.onopen = () => ws.send('hello');

        ws.onmessage = (message) => {
            render(message, gauge)
        }
        // log if error
        ws.onclose = (e) => {
            ws.send("close")
            leave_log(e)
        }
    } catch (error) {
    }
}

const render = (message, gauges) => {
    const info = JSON.parse(message.data)
    update_network(info)
    update_server(info)
    update_gauges(info, gauges)
    update_status_detail(info)
}

const update_status_detail = (info) => {
    let cpu_template = `user : ${info["cpu_user"]}% system : ${info["cpu_system"]}% idle : ${info["cpu_idle"]}% `
    rewrite("#cpu-details-id", cpu_template)
    let mem_template = `used / total : ${info["used_mem"]}/${info["total_mem"]}`
    rewrite("#mem-details-id", mem_template)
    let swap_template = `used / total : ${info["used_swap"]}/${info["total_swap"]}`
    rewrite("#swap-details-id", swap_template)
}

const update_network = (info) => {
    let info_template = `
    <div class="card blue-grey lighten-4">
        <div class="flow-text center">Network Status</div>
        <div class="row">
            <div class="col s4">
            <div class="card blue-grey lighten-2 ">
                <center>network sent : ${info["net_sent"]}</center>
            </div>
            <div class="card blue-grey lighten-2 ">
                <center>upstream rate : ${info["net_speed_up"]}</center>
            </div>
            </div>

            <div class="col s4">
            <div class="card blue-grey lighten-2 ">
                <center>network received : ${info["net_recv"]}</center>
            </div>
            <div class="card blue-grey lighten-2 ">
                <center>downstream rate : ${info["net_speed_up"]}</center>
            </div>
            </div>

           <div class="col s4">
            <div class="card blue-grey lighten-2 ">
                <center>packet sent : ${info["pack_sent"]}</center>
            </div>
            <div class="card blue-grey lighten-2 ">
                <center>packet received : ${info["pack_recv"]}</center>
            </div>

            </div>
        </div>
    </div>
    `
    rewrite("#network-info-id", info_template)
}

const update_server = (info) => {
    let info_template = `
    <div class="card blue-grey lighten-4">
        <div class="flow-text center">Server Information</div>
        <div class="row">
            <div class="col s4">
            <div class="card blue-grey lighten-2 ">
                <center>host: ${info["host"]}</center>
            </div>
            <div class="card blue-grey lighten-2 ">
                <center>hostname: ${info["hostname"]}</center>
            </div>
            </div>
            <div class="col s4">
                <div class="card blue-grey lighten-2 ">
                    <center>disk free : ${info["disk_free"]}</center>
                </div>
                <div class="card blue-grey lighten-2 ">
                    <center>disk total : ${info["disk_total"]}</center>
                </div>


            </div>
            <div class="col s4">
                <div class="card blue-grey lighten-2 ">
                <center>processor : ${info["processor"]}</center>
            </div>
                <div class="card blue-grey lighten-2 ">
                <center>Python version : ${info["pyversion"]}</center>
            </div>
            </div>
            <div class="col s12">
                <div class="card blue-grey lighten-2 ">
                    <center>script path: ${info["script_path"]}</center>
                </div>
            </div>
            <div class="col s12">
                <div class="card blue-grey lighten-2 ">
                    <center>server OS : ${info["platform"]}</center>
                </div>
            </div>

            <div class="col s6">
                <div class="card blue-grey lighten-2 ">
                <center>server time : ${info["server_time"]}</center>
            </div>
            </div>
            <div class="col s6">
                <div class="card blue-grey lighten-2 ">
                <center>server uptime : ${info["server_uptime"]}</center>
            </div>
            </div>


        </div>
    </div>
    `
    rewrite("#server-info-id", info_template)
}

const update_gauges = (info, gauges) => {
    cpu_percent = info['cpu_percent']
    gauges["cpu"].value = cpu_percent
    mem_percent = info['mem_percent']
    gauges["mem"].value = mem_percent
    swap_percent = info['swap_percent']
    gauges["swap"].value = swap_percent
}
const draw_gauges = () => {
    let gauges = {}
    gauges["cpu"] = get_cpu_gauge()
    gauges["mem"] = get_mem_gauge()
    gauges["swap"] = get_swap_gauge()
    for (key in gauges) {
        gauges[key].draw()
    }
    return gauges
}

const get_swap_gauge = () => {
    let gauge = new RadialGauge({
        renderTo: 'swap-gauge-id',
        value: 50,
        title: "SWAP",
        units: "%",
        valueDec: 2,
        valueInt: 2,
        highlights: [
            {
                "from": 80,
                "to": 100,
                "color": "rgba(244,67,54)"
            }
        ]
    })
    return gauge
}

const get_cpu_gauge = () => {
    let gauge = new RadialGauge({
        renderTo: 'cpu-gauge-id',
        value: 50,
        title: "CPU",
        units: "%",
        valueDec: 2,
        valueInt: 2,
        highlights: [
            {
                "from": 80,
                "to": 100,
                "color": "rgba(244,67,54)"
            }
        ]
    })
    return gauge
}

const get_mem_gauge = () => {
    let gauge = new RadialGauge({
        renderTo: 'mem-gauge-id',
        value: 50,
        title: "MEMORY",
        valueDec: 2,
        valueInt: 2,
        units: "%",
        highlights: [
            {
                "from": 80,
                "to": 100,
                "color": "rgba(244,67,54)"
            }
        ]
    })
    return gauge
}

const leave_log = (e) => {
    const code = event.code
    const reason = event.reason
    const wasClean = event.wasClean
}


const main = () => {
    let guages = draw_gauges()
    info(guages)
}

main()