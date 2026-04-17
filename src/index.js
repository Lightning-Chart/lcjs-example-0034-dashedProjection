/**
 * Example showcasing use of `DashedLine` style to reflect a projected (or _predicted_) time trend.
 */

const lcjs = require('@lightningchart/lcjs')

const { lightningChart, Themes, emptyFill, AxisTickStrategies, emptyLine, DashedLine, StipplePatterns, SolidFill, SolidLine, ColorRGBA } = lcjs

const chart = lightningChart({
            resourcesBaseUrl: new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + 'resources/',
        })
    .ChartXY({
        legend: { visible: false },
        theme: (() => {
    const t = Themes[new URLSearchParams(window.location.search).get('theme') || 'darkGold'] || undefined
    const smallView = window.devicePixelRatio >= 2
    if (!window.__lcjsDebugOverlay) {
        window.__lcjsDebugOverlay = document.createElement('div')
        window.__lcjsDebugOverlay.style.cssText = 'position:fixed;top:0;left:0;background:rgba(0,0,0,0.7);color:#fff;padding:4px 8px;z-index:99999;font:12px monospace;pointer-events:none'
        if (document.body) document.body.appendChild(window.__lcjsDebugOverlay)
        setInterval(() => {
            if (!window.__lcjsDebugOverlay.parentNode && document.body) document.body.appendChild(window.__lcjsDebugOverlay)
            window.__lcjsDebugOverlay.textContent = window.innerWidth + 'x' + window.innerHeight + ' dpr=' + window.devicePixelRatio + ' small=' + (window.devicePixelRatio >= 2)
        }, 500)
    }
    return t && smallView ? lcjs.scaleTheme(t, 0.5) : t
})(),
textRenderer: window.devicePixelRatio >= 2 ? lcjs.htmlTextRenderer : undefined,
    })
    .setTitle('Historical and projected revenue')

const axisX = chart
    .getDefaultAxisX()
    // Configure DateTime X ticks
    .setTickStrategy(AxisTickStrategies.DateTime, (ticks) =>
        // Show month, day and year in cursor result table
        ticks.setCursorFormatter((timestamp) =>
            new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' }),
        ),
    )

const axisY = chart
    .getDefaultAxisY()
    // Configure Y axis formatting as "100 k€"
    .setTickStrategy(AxisTickStrategies.Numeric, (ticks) => ticks.setFormattingFunction((euros) => `${(euros / 1000).toFixed(0)} k€`))

fetch(new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + 'examples/assets/0034/revenue.json')
    .then((r) => r.json())
    .then((revenueData) => {
        const tNow = 1664456233537
        const dataPast = revenueData.filter((p) => p.x <= tNow)
        const dataProjection = revenueData.filter((p) => p.x > tNow)
        dataProjection.unshift(dataPast[dataPast.length - 1])

        const seriesPast = chart.addLineSeries({ automaticColorIndex: 0 }).appendJSON(dataPast).setName('Revenue (past)')
        const seriesProjection = chart
            .addLineSeries({ automaticColorIndex: 0 })
            .appendJSON(dataProjection)
            .setStrokeStyle(
                (stroke) =>
                    new DashedLine({
                        thickness: stroke.getThickness(),
                        fillStyle: stroke.getFillStyle(),
                        pattern: StipplePatterns.Dashed,
                        patternScale: 4,
                    }),
            )
            .setName('Revenue (projected)')

        const rangeData = dataProjection.map((p, i) => {
            const step = Math.floor(i / 5)
            const factor = 0.02 + step * 0.002
            return {
                x: p.x,
                yLow: p.y * (1 - factor),
                yHigh: p.y * (1 + factor)
            }
        })

        const predictionRange = chart.addAreaRangeSeries()
        predictionRange
            .setHighFillStyle(new SolidFill({ color: ColorRGBA(255, 255, 75).setA(75) }))
            .setHighStrokeStyle(new SolidLine().setFillStyle(emptyFill).setThickness(0))
            .setLowStrokeStyle(new SolidLine().setFillStyle(emptyFill).setThickness(0))
            .setName('Projection range')

        rangeData.forEach((point, i) => {
            predictionRange.add({ position: point.x, high: point.yHigh, low: point.yLow })
        })

        axisX
            .addBand()
            .setValueStart(dataProjection[0].x)
            .setValueEnd(dataProjection[dataProjection.length - 1].x)
            .setFillStyle((solidFill) => solidFill.setA(25))
            .setStrokeStyle(emptyLine)
            .setPointerEvents(false)
            .setEffect(false)

        axisX
            .addCustomTick()
            .setValue(dataProjection[0].x)
            .setTickLength(20)
            .setTextFormatter((_) => 'Today')
    })
