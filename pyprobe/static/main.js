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
            ws_scheme + '://' + window.location.host +
            "/ws/"
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
        log(error)
    }
}

const render = (message, gauges) => {
    const info = JSON.parse(message.data)
    update_server(info)
    update_gauges(info, gauges)
    // update_status_detail(info)
}

const update_status_detail = (info) => {
    let cpu_template = `user : ${info["cpu_user"]}% system : ${info["cpu_system"]}% idle : ${info["cpu_idle"]}% `
    rewrite("#cpu-details-id", cpu_template)
    let mem_template = `used / total : ${info["used_mem"]}/${info["total_mem"]}`
    rewrite("#mem-details-id", mem_template)
    let swap_template = `used / total : ${info["used_swap"]}/${info["total_swap"]}`
    rewrite("#swap-details-id", swap_template)
}


const update_server = (info) => {
    rewrite("#disk_free_id", info["disk_free"])
    rewrite("#processor_id", info["processor_brand"])
    rewrite("#processor_number_id", info["cpu_numbers"])
    rewrite("#l1_data_cache_size_id", info["l1_data_cache_size"])
    rewrite("#l1_instruction_cache_size_id", info["l1_instruction_cache_size"])
    rewrite("#l2_cache_size_id", info["l2_cache_size"])
    rewrite("#l3_cache_size_id", info["l3_cache_size"])
    rewrite("#cpu_user_id", info["cpu_user"])
    rewrite("#cpu_system_id", info["cpu_system"])
    rewrite("#cpu_idle_id", info["cpu_idle"])
    rewrite("#disk_free_id", info["disk_free"])
    rewrite("#disk_total_id", info["disk_total"])
    rewrite("#disk_used_id", info["disk_used"])
    rewrite("#disk_percent_id", info["disk_percent"])
    rewrite("#partitions_num_id", info["partitions_num"])
    rewrite("#type_of_file_system_id", info["type_of_file_system"])
    rewrite("#total_mem_id", info["total_mem"])
    rewrite("#used_mem_id", info["used_mem"])
    rewrite("#free_mem_id", info["free_mem"])
    rewrite("#mem_shared_id", info["mem_shared"])
    rewrite("#available_mem_id", info["available_mem"])
    rewrite("#mem_active_id", info["mem_active"])
    rewrite("#mem_inactive_id", info["mem_inactive"])
    rewrite("#mem_cached_id", info["mem_cached"])
    rewrite("#mem_buffers_id", info["mem_buffers"])
    rewrite("#free_swap_id", info["free_swap"])
    rewrite("#total_swap_id", info["total_swap"])
    rewrite("#used_swap_id", info["used_swap"])
    rewrite("#swap_percent_id", info["swap_percent"])
    rewrite("#sout_id", info["sout"])
    rewrite("#sin_id", info["sin"])
    rewrite("#server_uptime_id", info["server_uptime"])
    rewrite("#server_time_id", info["server_time"])
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
        highlights: [{
            "from": 90,
            "to": 100,
            "color": "rgba(244,67,54)"
        }]
    })
    return gauge
}

const get_cpu_gauge = () => {
    let gauge = new RadialGauge({
        renderTo: 'cpu-gauge-id',
        value: 0,
        title: "CPU",
        units: "%",
        valueDec: 2,
        valueInt: 2,
        highlights: [{
            "from": 90,
            "to": 100,
            "color": "rgba(244,67,54)"
        }]
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
        highlights: [{
            "from": 90,
            "to": 100,
            "color": "rgba(244,67,54)"
        }]
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