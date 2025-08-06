/**
 * Example showcasing use of `DashedLine` style to reflect a projected (or _predicted_) time trend.
 */

const lcjs = require('@lightningchart/lcjs')

const { lightningChart, Themes, emptyFill, AxisTickStrategies, emptyLine, DashedLine, StipplePatterns } = lcjs

const chart = lightningChart({
            resourcesBaseUrl: new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + 'resources/',
        })
    .ChartXY({
        legend: { visible: false },
        theme: Themes[new URLSearchParams(window.location.search).get('theme') || 'darkGold'] || undefined,
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

        axisX
            .addBand()
            .setValueStart(dataProjection[0].x)
            .setValueEnd(dataProjection[dataProjection.length - 1].x)
            .setStrokeStyle(emptyLine)
            .setPointerEvents(false)
            .setEffect(false)

        axisX
            .addCustomTick()
            .setValue(dataProjection[0].x)
            .setTickLength(20)
            .setTextFormatter((_) => 'Today')
    })
