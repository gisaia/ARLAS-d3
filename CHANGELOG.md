# Change Log

## [v6.0.1](https://github.com/gisaia/ARLAS-d3/tree/v6.0.1) (2019-04-24)

[Full Changelog](https://github.com/gisaia/ARLAS-d3/compare/v6.0.0...v6.0.1)

**New stuff:**

- Histograms: apply \[ticksDateFormat\] option when its specified on xLabels for bar charts [\#86](https://github.com/gisaia/ARLAS-d3/issues/86)

**Fixed bugs:**

- Histogram : Handle No-data values [\#71](https://github.com/gisaia/ARLAS-d3/issues/71)
- Histograms: date ticks are not utc when the option \[ticksDateFormat\] is specified [\#63](https://github.com/gisaia/ARLAS-d3/issues/63)

## [v6.0.0](https://github.com/gisaia/ARLAS-d3/tree/v6.0.0) (2019-02-05)

[Full Changelog](https://github.com/gisaia/ARLAS-d3/compare/v6.0.0-beta.1...v6.0.0)

**Breaking changes:**

- Donut: add metricValue to TreeNode interface [\#81](https://github.com/gisaia/ARLAS-d3/issues/81)
- Refactor the Donut input Data \(DonutArc\) [\#77](https://github.com/gisaia/ARLAS-d3/issues/77)
- Enhance colors generation for donuts [\#72](https://github.com/gisaia/ARLAS-d3/issues/72)
- Create a new component : y log axis \(logarithmic gauge\) [\#69](https://github.com/gisaia/ARLAS-d3/issues/69)

**New stuff:**

- Donuts : Keep unexisting nodes in the selectedArcsList [\#80](https://github.com/gisaia/ARLAS-d3/issues/80)
- Donut: Remove all similar selected nodes on a same ring. [\#76](https://github.com/gisaia/ARLAS-d3/issues/76)

## [v6.0.0-beta.1](https://github.com/gisaia/ARLAS-d3/tree/v6.0.0-beta.1) (2019-01-30)

[Full Changelog](https://github.com/gisaia/ARLAS-d3/compare/v6.0.0-beta.0...v6.0.0-beta.1)

**New stuff:**

- Donut: Add metricValue attibute to TreeNode interface & keep unexisting selected nodes [\#79](https://github.com/gisaia/ARLAS-d3/pull/79) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))

## [v6.0.0-beta.0](https://github.com/gisaia/ARLAS-d3/tree/v6.0.0-beta.0) (2019-01-25)

[Full Changelog](https://github.com/gisaia/ARLAS-d3/compare/v5.0.0...v6.0.0-beta.0)

**Breaking changes:**

- Refactor tooltips on brush corners [\#70](https://github.com/gisaia/ARLAS-d3/pull/70) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))

**Fixed bugs:**

- Fix version image mkDock [\#68](https://github.com/gisaia/ARLAS-d3/pull/68) ([mbarbet](https://github.com/mbarbet))

## [v5.0.0](https://github.com/gisaia/ARLAS-d3/tree/v5.0.0) (2018-11-28)

[Full Changelog](https://github.com/gisaia/ARLAS-d3/compare/v4.3.1...v5.0.0)

**Breaking changes:**

- Upgrade rxjs Version to 6 [\#61](https://github.com/gisaia/ARLAS-d3/issues/61)
- Feature/rxjs6 [\#65](https://github.com/gisaia/ARLAS-d3/pull/65) ([mbarbet](https://github.com/mbarbet))

**New stuff:**

- Add link to CI [\#64](https://github.com/gisaia/ARLAS-d3/pull/64) [[documentation](https://github.com/gisaia/ARLAS-d3/labels/documentation)] ([elouanKeryell-Even](https://github.com/elouanKeryell-Even))

## [v4.3.1](https://github.com/gisaia/ARLAS-d3/tree/v4.3.1) (2018-09-25)

[Full Changelog](https://github.com/gisaia/ARLAS-d3/compare/v4.3.0...v4.3.1)

**Fixed bugs:**

- Histograms : date is undefined when there is one bucket represented [\#59](https://github.com/gisaia/ARLAS-d3/issues/59)
- Donut : fix checking if donut node size is undefined [\#56](https://github.com/gisaia/ARLAS-d3/issues/56)
- Export AbstractChart class  [\#55](https://github.com/gisaia/ARLAS-d3/issues/55)

## [v4.3.0](https://github.com/gisaia/ARLAS-d3/tree/v4.3.0) (2018-09-14)

[Full Changelog](https://github.com/gisaia/ARLAS-d3/compare/v4.2.4...v4.3.0)

**Breaking changes:**

- DONUT : remove sum policy for nodes hierarchy [\#52](https://github.com/gisaia/ARLAS-d3/issues/52)
- SWIMLANE : Remove brush selection & add the possibility to filter on terms [\#49](https://github.com/gisaia/ARLAS-d3/issues/49)

**New stuff:**

- HISTOGRAM/SWIMLANE : Implement a system of rounding key values when interval \< 1 [\#47](https://github.com/gisaia/ARLAS-d3/issues/47)

**Fixed bugs:**

- SWIMLANE : Swimlane bars get thin after applying filters on ARLAS-wui [\#48](https://github.com/gisaia/ARLAS-d3/issues/48)

## [v4.2.4](https://github.com/gisaia/ARLAS-d3/tree/v4.2.4) (2018-08-09)

[Full Changelog](https://github.com/gisaia/ARLAS-d3/compare/v4.0.8...v4.2.4)

**Fixed bugs:**

- HISTOGRAM/SWIMLANE : dates should be in utc  [\#43](https://github.com/gisaia/ARLAS-d3/issues/43)

## [v4.0.8](https://github.com/gisaia/ARLAS-d3/tree/v4.0.8) (2018-08-06)

[Full Changelog](https://github.com/gisaia/ARLAS-d3/compare/v4.0.7...v4.0.8)

## [v4.0.7](https://github.com/gisaia/ARLAS-d3/tree/v4.0.7) (2018-08-06)

[Full Changelog](https://github.com/gisaia/ARLAS-d3/compare/v4.2.3...v4.0.7)

## [v4.2.3](https://github.com/gisaia/ARLAS-d3/tree/v4.2.3) (2018-08-03)

[Full Changelog](https://github.com/gisaia/ARLAS-d3/compare/v4.2.2...v4.2.3)

**Fixed bugs:**

- SWIMLANE : dataInterval is wrong when there is one bucket per lane [\#40](https://github.com/gisaia/ARLAS-d3/issues/40)

## [v4.2.2](https://github.com/gisaia/ARLAS-d3/tree/v4.2.2) (2018-07-23)

[Full Changelog](https://github.com/gisaia/ARLAS-d3/compare/v4.2.1...v4.2.2)

**Fixed bugs:**

- Fix bug : area chart is moved by half recursevly after each data change [\#39](https://github.com/gisaia/ARLAS-d3/pull/39) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))

## [v4.2.1](https://github.com/gisaia/ARLAS-d3/tree/v4.2.1) (2018-07-21)

[Full Changelog](https://github.com/gisaia/ARLAS-d3/compare/v4.2.0...v4.2.1)

**Fixed bugs:**

- Fix bug related to move area chart by half interval [\#38](https://github.com/gisaia/ARLAS-d3/pull/38) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))

## [v4.2.0](https://github.com/gisaia/ARLAS-d3/tree/v4.2.0) (2018-07-20)

[Full Changelog](https://github.com/gisaia/ARLAS-d3/compare/v4.1.0...v4.2.0)

**Fixed bugs:**

- HISTOGRAM : extend the x axis for area chart by one bucket unity [\#25](https://github.com/gisaia/ARLAS-d3/issues/25)
- Feature/\#25 add bucket area [\#37](https://github.com/gisaia/ARLAS-d3/pull/37) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))
- Fix second value in tooltip [\#36](https://github.com/gisaia/ARLAS-d3/pull/36) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))

## [v4.1.0](https://github.com/gisaia/ARLAS-d3/tree/v4.1.0) (2018-07-10)

[Full Changelog](https://github.com/gisaia/ARLAS-d3/compare/v4.0.6...v4.1.0)

**New stuff:**

- HISTOGRAMS : Display only selections containing data  [\#33](https://github.com/gisaia/ARLAS-d3/issues/33)
- HISTOGRAMS : Add an option to start y axis from min of data  [\#32](https://github.com/gisaia/ARLAS-d3/issues/32)
- HISTOGRAMS: Add an offset in the top of y axis domain [\#30](https://github.com/gisaia/ARLAS-d3/issues/30)
- HISTOGRAM: draw y-axis on top of plotted data [\#29](https://github.com/gisaia/ARLAS-d3/issues/29)
- Feature/\#32 y axis from zero [\#35](https://github.com/gisaia/ARLAS-d3/pull/35) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))
- Histograms : Display only selections containing data [\#34](https://github.com/gisaia/ARLAS-d3/pull/34) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))
- Translate Y axes so that they're not hidden by histogram [\#31](https://github.com/gisaia/ARLAS-d3/pull/31) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))

## [v4.0.6](https://github.com/gisaia/ARLAS-d3/tree/v4.0.6) (2018-06-21)

[Full Changelog](https://github.com/gisaia/ARLAS-d3/compare/v4.0.5...v4.0.6)

**Fixed bugs:**

- HISTOGRAM: Resizing a histogram should be applied after it was plotted [\#27](https://github.com/gisaia/ARLAS-d3/issues/27)
- Histogram: resize should not be applied before it's first plotted [\#28](https://github.com/gisaia/ARLAS-d3/pull/28) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))

## [v4.0.5](https://github.com/gisaia/ARLAS-d3/tree/v4.0.5) (2018-06-14)

[Full Changelog](https://github.com/gisaia/ARLAS-d3/compare/v4.0.4...v4.0.5)

**New stuff:**

- HISTOGRAM : make labels of ticks and tooltip clearer for timeline [\#23](https://github.com/gisaia/ARLAS-d3/issues/23)
- Hide svg when there is no data to plot [\#22](https://github.com/gisaia/ARLAS-d3/pull/22) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))

**Fixed bugs:**

- HISTOGRAM : labels of the horizontal axis positions [\#19](https://github.com/gisaia/ARLAS-d3/issues/19)
- HISTOGRAM: if ticksDateFormat is undefined, the ticks values turn to be undefined [\#14](https://github.com/gisaia/ARLAS-d3/issues/14)
- Add moment library in package-release.json [\#26](https://github.com/gisaia/ARLAS-d3/pull/26) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))

## [v4.0.4](https://github.com/gisaia/ARLAS-d3/tree/v4.0.4) (2018-05-30)

[Full Changelog](https://github.com/gisaia/ARLAS-d3/compare/v4.0.3...v4.0.4)

## [v4.0.3](https://github.com/gisaia/ARLAS-d3/tree/v4.0.3) (2018-05-30)

[Full Changelog](https://github.com/gisaia/ARLAS-d3/compare/v4.0.2...v4.0.3)

**New stuff:**

- DONUT : Emit tooltip informations when a node is hovered [\#16](https://github.com/gisaia/ARLAS-d3/issues/16)

**Fixed bugs:**

- Donut : crash when selecting a donut node [\#10](https://github.com/gisaia/ARLAS-d3/issues/10)

## [v4.0.2](https://github.com/gisaia/ARLAS-d3/tree/v4.0.2) (2018-05-22)

[Full Changelog](https://github.com/gisaia/ARLAS-d3/compare/v4.0.1...v4.0.2)

## [v4.0.1](https://github.com/gisaia/ARLAS-d3/tree/v4.0.1) (2018-05-22)

[Full Changelog](https://github.com/gisaia/ARLAS-d3/compare/v4.0.0...v4.0.1)



\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*