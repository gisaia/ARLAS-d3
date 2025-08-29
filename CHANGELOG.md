# Change Log

## [v12.1.1](https://github.com/gisaia/ARLAS-d3/tree/v12.1.1) (2025-08-28)

**Fixed bugs:**

- use same format for start and end of bucket in tooltip [\#287](https://github.com/gisaia/ARLAS-d3/issues/287)

## [v12.0.2](https://github.com/gisaia/ARLAS-d3/tree/v12.0.2) (2025-06-24)

## [v12.0.1](https://github.com/gisaia/ARLAS-d3/tree/v12.0.1) (2025-04-28)

## [v12.1.0](https://github.com/gisaia/ARLAS-d3/tree/v12.1.0) (2025-04-28)

**Breaking changes:**

- \[HistogramParams\] `tooltipEvent` does not emit xValue attribute anymore \(as it is never used\) [\#278](https://github.com/gisaia/ARLAS-d3/issues/278)
- \[HistogramParams\] `hoveredBucketEvent` emits the buckets start and end values instead of the start value only [\#276](https://github.com/gisaia/ARLAS-d3/issues/276)

**New stuff:**

- Labels on x-axes should handle the histogram size and resize [\#264](https://github.com/gisaia/ARLAS-d3/issues/264)
- Add new histogram parameters to customize labels display management on histogram resize [\#248](https://github.com/gisaia/ARLAS-d3/issues/248)

## [v12.0.0](https://github.com/gisaia/ARLAS-d3/tree/v12.0.0) (2025-01-30)

**Breaking changes:**

- upgrade rxjs, typescript, node and common packages with arlas libs for angular 18 migration [\#262](https://github.com/gisaia/ARLAS-d3/issues/262)
- update node and ts version to match angular 15 [\#261](https://github.com/gisaia/ARLAS-d3/issues/261)

**Miscellaneous:**

- ci: add inputs in release run name [\#263](https://github.com/gisaia/ARLAS-d3/issues/263)
- Add send message on chat when release [\#245](https://github.com/gisaia/ARLAS-d3/issues/245)

## [v11.2.6](https://github.com/gisaia/ARLAS-d3/tree/v11.2.6) (2024-10-30)

**Fixed bugs:**

- Fix data length for curve charts [\#260](https://github.com/gisaia/ARLAS-d3/issues/260)

**Miscellaneous:**

- ci: add release action [\#259](https://github.com/gisaia/ARLAS-d3/issues/259)

## [v11.2.5](https://github.com/gisaia/ARLAS-d3/tree/v11.2.5) (2024-09-22)

**Fixed bugs:**

- Revert: Prohibit the brush from updating the selected interval when the brush is in use [\#258](https://github.com/gisaia/ARLAS-d3/issues/258)
- Unshift older/lower extended values to the data domain in x-axis [\#257](https://github.com/gisaia/ARLAS-d3/issues/257)

## [v11.2.4](https://github.com/gisaia/ARLAS-d3/tree/v11.2.4) (2024-08-30)

**Miscellaneous:**

- reduce the number of fake buckets added in case of selection beyond data range [\#255](https://github.com/gisaia/ARLAS-d3/issues/255)
- upgrade node to v16 for build [\#254](https://github.com/gisaia/ARLAS-d3/issues/254)
- upgrade typedocgen version to 0.0.8 [\#253](https://github.com/gisaia/ARLAS-d3/issues/253)

## [v11.2.3](https://github.com/gisaia/ARLAS-d3/tree/v11.2.3) (2024-08-23)

**Fixed bugs:**

- add safeguard against too many buckets added [\#256](https://github.com/gisaia/ARLAS-d3/issues/256)

## [v11.2.2](https://github.com/gisaia/ARLAS-d3/tree/v11.2.2) (2024-07-09)

**Fixed bugs:**

- properly draw xAxis when the brush selection is larger than data [\#251](https://github.com/gisaia/ARLAS-d3/issues/251)
- The brush object of histograms might be undefined at init and should be checked [\#250](https://github.com/gisaia/ARLAS-d3/issues/250)

**Miscellaneous:**

- add license header on each ts file and add a license check [\#252](https://github.com/gisaia/ARLAS-d3/issues/252)

## [v11.2.1](https://github.com/gisaia/ARLAS-d3/tree/v11.2.1) (2024-07-09)

**Fixed bugs:**

- Prohibit the brush from updating the selected interval when the brush is in use [\#249](https://github.com/gisaia/ARLAS-d3/issues/249)

## [v11.2.0](https://github.com/gisaia/ARLAS-d3/tree/v11.2.0) (2024-07-05)

**New stuff:**

- Display start value and end value of a timeline bucket [\#228](https://github.com/gisaia/ARLAS-d3/issues/228)

**Fixed bugs:**

- Histogram : NaN values instead of negative values [\#222](https://github.com/gisaia/ARLAS-d3/issues/222)

## [v11.1.1](https://github.com/gisaia/ARLAS-d3/tree/v11.1.1) (2024-04-04)

## [v11.1.0](https://github.com/gisaia/ARLAS-d3/tree/v11.1.0) (2023-06-01)

## [v11.0.2](https://github.com/gisaia/ARLAS-d3/tree/v11.0.2) (2023-04-20)

## [v11.0.1](https://github.com/gisaia/ARLAS-d3/tree/v11.0.1) (2023-04-19)

## [v11.0.0](https://github.com/gisaia/ARLAS-d3/tree/v11.0.0) (2023-04-19)

**Fixed bugs:**

- \[Histogram\] Tooltip values above 1000 are NaN [\#213](https://github.com/gisaia/ARLAS-d3/issues/213)
- \[Histogram\] Negative values of the histogram are NaN [\#212](https://github.com/gisaia/ARLAS-d3/issues/212)

## [v10.0.1](https://github.com/gisaia/ARLAS-d3/tree/v10.0.1) (2023-02-17)

## [v10.0.0](https://github.com/gisaia/ARLAS-d3/tree/v10.0.0) (2023-02-01)

## [v9.2.2](https://github.com/gisaia/ARLAS-d3/tree/v9.2.2) (2022-12-22)

## [v9.2.1](https://github.com/gisaia/ARLAS-d3/tree/v9.2.1) (2022-11-25)

## [v9.2.0](https://github.com/gisaia/ARLAS-d3/tree/v9.2.0) (2022-11-25)

**Breaking changes:**

- Upgrade to v7.6.1 of D3 [\#45](https://github.com/gisaia/ARLAS-d3/issues/45)

## [v9.1.1](https://github.com/gisaia/ARLAS-d3/tree/v9.1.1) (2022-09-27)

**Fixed bugs:**

- The tooltip of the timeline is not displayed when we choose a 1year/1month bucket interval [\#179](https://github.com/gisaia/ARLAS-d3/issues/179)

## [v9.1.0](https://github.com/gisaia/ARLAS-d3/tree/v9.1.0) (2022-07-11)

## [v9.0.0](https://github.com/gisaia/ARLAS-d3/tree/v9.0.0) (2022-02-01)

**New stuff:**

- Enhance granularity of dates units in timeline tooltip [\#176](https://github.com/gisaia/ARLAS-d3/issues/176)

**Miscellaneous:**

- Upgrade typescript & rxjs [\#164](https://github.com/gisaia/ARLAS-d3/issues/164)

## [v8.0.4](https://github.com/gisaia/ARLAS-d3/tree/v8.0.4) (2021-10-25)

**New stuff:**

- \[Swimlane\] : Add X axis tooltip  [\#94](https://github.com/gisaia/ARLAS-d3/issues/94)
- HISTOGRAM : create new zoom in data mode [\#67](https://github.com/gisaia/ARLAS-d3/issues/67)

**Fixed bugs:**

-  numbers in charts and swimlanes tooltips are not rounded [\#159](https://github.com/gisaia/ARLAS-d3/issues/159)

## [v8.0.3](https://github.com/gisaia/ARLAS-d3/tree/v8.0.3) (2021-09-10)

**Fixed bugs:**

- labels in histograms axis are all shown as 0 [\#156](https://github.com/gisaia/ARLAS-d3/issues/156)

## [v8.0.2](https://github.com/gisaia/ARLAS-d3/tree/v8.0.2) (2021-08-16)

## [v7.4.3](https://github.com/gisaia/ARLAS-d3/tree/v7.4.3) (2021-08-16)

## [v7.4.2](https://github.com/gisaia/ARLAS-d3/tree/v7.4.2) (2021-08-16)

## [v8.0.1](https://github.com/gisaia/ARLAS-d3/tree/v8.0.1) (2021-08-06)

**Fixed bugs:**

- Swimlane doesn't handle Infinity values  [\#149](https://github.com/gisaia/ARLAS-d3/issues/149)

## [v7.4.1](https://github.com/gisaia/ARLAS-d3/tree/v7.4.1) (2021-08-03)

## [v8.0.0](https://github.com/gisaia/ARLAS-d3/tree/v8.0.0) (2021-07-07)

**Breaking changes:**

- Support multi-lines in one signle graph [\#143](https://github.com/gisaia/ARLAS-d3/issues/143)

**New stuff:**

- Support new chart type : curve [\#144](https://github.com/gisaia/ARLAS-d3/issues/144)
- \[DONUT\] Add percentage in "donut" widget [\#121](https://github.com/gisaia/ARLAS-d3/issues/121)

**Fixed bugs:**

- HISTOGRAM : tooltip position has a consequent offset when data occupies o small part of the histogram  [\#18](https://github.com/gisaia/ARLAS-d3/issues/18)

## [v7.4.0](https://github.com/gisaia/ARLAS-d3/tree/v7.4.0) (2021-04-21)

**New stuff:**

- Enhance donut tooltip [\#141](https://github.com/gisaia/ARLAS-d3/issues/141)

## [v7.3.1](https://github.com/gisaia/ARLAS-d3/tree/v7.3.1) (2021-03-26)

## [v7.3.0](https://github.com/gisaia/ARLAS-d3/tree/v7.3.0) (2021-03-23)

## [v7.2.0](https://github.com/gisaia/ARLAS-d3/tree/v7.2.0) (2021-02-18)

**New stuff:**

- Add an input for donut containers [\#132](https://github.com/gisaia/ARLAS-d3/issues/132)

## [v7.1.6](https://github.com/gisaia/ARLAS-d3/tree/v7.1.6) (2021-02-01)

**Fixed bugs:**

- Charts that yAxis don't start from 0 render incorrectly [\#131](https://github.com/gisaia/ARLAS-d3/issues/131)

## [v7.1.5](https://github.com/gisaia/ARLAS-d3/tree/v7.1.5) (2021-01-19)

## [v7.1.4](https://github.com/gisaia/ARLAS-d3/tree/v7.1.4) (2021-01-19)

## [v7.1.3](https://github.com/gisaia/ARLAS-d3/tree/v7.1.3) (2020-06-08)

## [v7.1.2](https://github.com/gisaia/ARLAS-d3/tree/v7.1.2) (2020-06-02)

**New stuff:**

- Add a custom style for min/max values of a bar histogram headbands [\#119](https://github.com/gisaia/ARLAS-d3/issues/119)

## [v7.1.1](https://github.com/gisaia/ARLAS-d3/tree/v7.1.1) (2020-06-01)

## [v7.1.0](https://github.com/gisaia/ARLAS-d3/tree/v7.1.0) (2020-05-29)

**New stuff:**

- Histograms : group ticks values by "K", "M, "B" \(40000 =\> 40K, ....\) [\#62](https://github.com/gisaia/ARLAS-d3/issues/62)
- \[Donut\] Add 'diameter' input to manually configure it [\#116](https://github.com/gisaia/ARLAS-d3/issues/116)
- \[Swimlane\] Display ticks and tooltips with space between thousands, millions, ...  [\#110](https://github.com/gisaia/ARLAS-d3/issues/110)
- \[Donut\] Display donut tooltips with space between thousands, millions, ... [\#109](https://github.com/gisaia/ARLAS-d3/issues/109)
- \[Histogram\] Display histogram tooltips & ticks with space between thousands, millions, ... [\#108](https://github.com/gisaia/ARLAS-d3/issues/108)

**Fixed bugs:**

- \[Histogram\] If all buckets have the same values, the histogram is not well plotted [\#112](https://github.com/gisaia/ARLAS-d3/issues/112)

## [v7.0.2](https://github.com/gisaia/ARLAS-d3/tree/v7.0.2) (2020-04-10)

## [v7.0.1](https://github.com/gisaia/ARLAS-d3/tree/v7.0.1) (2020-04-10)

**Fixed bugs:**

- \[Histograms\] Fix buckets whose values are 'Infinity' [\#104](https://github.com/gisaia/ARLAS-d3/issues/104)

## [v7.0.0](https://github.com/gisaia/ARLAS-d3/tree/v7.0.0) (2020-03-12)

**Breaking changes:**

- Separate swimlaneData and histogramData [\#100](https://github.com/gisaia/ARLAS-d3/issues/100)

**New stuff:**

- SWIMLANE: Add a legend for colors [\#102](https://github.com/gisaia/ARLAS-d3/issues/102)
- Swimlane : Add a column-oriented representation of data  [\#101](https://github.com/gisaia/ARLAS-d3/issues/101)

## [v6.1.0](https://github.com/gisaia/ARLAS-d3/tree/v6.1.0) (2019-11-18)

**New stuff:**

- Upgrade rxjs version to v6.5.3 [\#97](https://github.com/gisaia/ARLAS-d3/issues/97)

## [v6.0.3](https://github.com/gisaia/ARLAS-d3/tree/v6.0.3) (2019-10-04)

**Fixed bugs:**

- Fix swimlanes horizontal ticks height [\#95](https://github.com/gisaia/ARLAS-d3/pull/95) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))

## [v6.0.2](https://github.com/gisaia/ARLAS-d3/tree/v6.0.2) (2019-07-25)

**Fixed bugs:**

- HISTOGRAMS: Remove visibility style from brush [\#88](https://github.com/gisaia/ARLAS-d3/issues/88)

## [v6.0.1](https://github.com/gisaia/ARLAS-d3/tree/v6.0.1) (2019-04-25)

**New stuff:**

- Histograms: apply \[ticksDateFormat\] option when its specified on xLabels for bar charts [\#86](https://github.com/gisaia/ARLAS-d3/issues/86)

**Fixed bugs:**

- Histogram : Handle No-data values [\#71](https://github.com/gisaia/ARLAS-d3/issues/71)
- Histograms: date ticks are not utc when the option \[ticksDateFormat\] is specified [\#63](https://github.com/gisaia/ARLAS-d3/issues/63)

## [v6.0.0](https://github.com/gisaia/ARLAS-d3/tree/v6.0.0) (2019-02-05)

**Breaking changes:**

- Refactor tooltips on brush corners [\#267](https://github.com/gisaia/ARLAS-d3/issues/267)
- Donut: add metricValue to TreeNode interface [\#81](https://github.com/gisaia/ARLAS-d3/issues/81)
- Refactor the Donut input Data \(DonutArc\) [\#77](https://github.com/gisaia/ARLAS-d3/issues/77)
- Enhance colors generation for donuts [\#72](https://github.com/gisaia/ARLAS-d3/issues/72)
- Create a new component : y log axis \(logarithmic gauge\) [\#69](https://github.com/gisaia/ARLAS-d3/issues/69)
- Refactor tooltips on brush corners [\#70](https://github.com/gisaia/ARLAS-d3/pull/70) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))

**New stuff:**

- Donuts : Keep unexisting nodes in the selectedArcsList [\#80](https://github.com/gisaia/ARLAS-d3/issues/80)
- Donut: Remove all similar selected nodes on a same ring. [\#76](https://github.com/gisaia/ARLAS-d3/issues/76)
- Donut: Add metricValue attibute to TreeNode interface & keep unexisting selected nodes [\#79](https://github.com/gisaia/ARLAS-d3/pull/79) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))

**Fixed bugs:**

- Fix version image mkDock [\#266](https://github.com/gisaia/ARLAS-d3/issues/266)

## [v5.0.0](https://github.com/gisaia/ARLAS-d3/tree/v5.0.0) (2018-11-28)

**Breaking changes:**

- Upgrade rxjs Version to 6 [\#61](https://github.com/gisaia/ARLAS-d3/issues/61)
- Feature/rxjs6 [\#65](https://github.com/gisaia/ARLAS-d3/pull/65) ([mbarbet](https://github.com/mbarbet))

**New stuff:**

- Add link to CI [\#64](https://github.com/gisaia/ARLAS-d3/pull/64) [[documentation](https://github.com/gisaia/ARLAS-d3/labels/documentation)] ([elouanKeryell-Even](https://github.com/elouanKeryell-Even))

## [v4.3.1](https://github.com/gisaia/ARLAS-d3/tree/v4.3.1) (2018-09-25)

**Fixed bugs:**

- Histograms : date is undefined when there is one bucket represented [\#59](https://github.com/gisaia/ARLAS-d3/issues/59)
- Donut : fix checking if donut node size is undefined [\#56](https://github.com/gisaia/ARLAS-d3/issues/56)
- Export AbstractChart class  [\#55](https://github.com/gisaia/ARLAS-d3/issues/55)

## [v4.3.0](https://github.com/gisaia/ARLAS-d3/tree/v4.3.0) (2018-09-14)

**Breaking changes:**

- SWIMLANE : Remove brush selection & add the possibility to filter on terms [\#49](https://github.com/gisaia/ARLAS-d3/issues/49)

**New stuff:**

- HISTOGRAM/SWIMLANE : Implement a system of rounding key values when interval \< 1 [\#47](https://github.com/gisaia/ARLAS-d3/issues/47)

**Fixed bugs:**

- DONUT : remove sum policy for nodes hierarchy [\#52](https://github.com/gisaia/ARLAS-d3/issues/52)
- SWIMLANE : Swimlane bars get thin after applying filters on ARLAS-wui [\#48](https://github.com/gisaia/ARLAS-d3/issues/48)

## [v4.2.4](https://github.com/gisaia/ARLAS-d3/tree/v4.2.4) (2018-08-09)

**Fixed bugs:**

- HISTOGRAM/SWIMLANE : dates should be in utc  [\#43](https://github.com/gisaia/ARLAS-d3/issues/43)

## [v4.0.8](https://github.com/gisaia/ARLAS-d3/tree/v4.0.8) (2018-08-06)

## [v4.0.7](https://github.com/gisaia/ARLAS-d3/tree/v4.0.7) (2018-08-06)

## [v4.2.3](https://github.com/gisaia/ARLAS-d3/tree/v4.2.3) (2018-08-03)

**Fixed bugs:**

- SWIMLANE : dataInterval is wrong when there is one bucket per lane [\#40](https://github.com/gisaia/ARLAS-d3/issues/40)

## [v4.2.2](https://github.com/gisaia/ARLAS-d3/tree/v4.2.2) (2018-07-23)

**Fixed bugs:**

- Fix bug : area chart is moved by half recursevly after each data change [\#39](https://github.com/gisaia/ARLAS-d3/pull/39) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))

## [v4.2.1](https://github.com/gisaia/ARLAS-d3/tree/v4.2.1) (2018-07-21)

**Fixed bugs:**

- Fix bug related to move area chart by half interval [\#38](https://github.com/gisaia/ARLAS-d3/pull/38) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))

## [v4.2.0](https://github.com/gisaia/ARLAS-d3/tree/v4.2.0) (2018-07-20)

**Fixed bugs:**

- HISTOGRAM : extend the x axis for area chart by one bucket unity [\#25](https://github.com/gisaia/ARLAS-d3/issues/25)
- Fix second value in tooltip [\#36](https://github.com/gisaia/ARLAS-d3/pull/36) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))
- Feature/\#25 add bucket area [\#37](https://github.com/gisaia/ARLAS-d3/pull/37) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))

## [v4.1.0](https://github.com/gisaia/ARLAS-d3/tree/v4.1.0) (2018-07-10)

**New stuff:**

- HISTOGRAMS : Display only selections containing data  [\#33](https://github.com/gisaia/ARLAS-d3/issues/33)
- HISTOGRAMS : Add an option to start y axis from min of data  [\#32](https://github.com/gisaia/ARLAS-d3/issues/32)
- HISTOGRAMS: Add an offset in the top of y axis domain [\#30](https://github.com/gisaia/ARLAS-d3/issues/30)
- HISTOGRAM: draw y-axis on top of plotted data [\#29](https://github.com/gisaia/ARLAS-d3/issues/29)
- Translate Y axes so that they're not hidden by histogram [\#31](https://github.com/gisaia/ARLAS-d3/pull/31) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))
- Feature/\#32 y axis from zero [\#35](https://github.com/gisaia/ARLAS-d3/pull/35) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))
- Histograms : Display only selections containing data [\#34](https://github.com/gisaia/ARLAS-d3/pull/34) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))

## [v4.0.6](https://github.com/gisaia/ARLAS-d3/tree/v4.0.6) (2018-06-21)

**Fixed bugs:**

- HISTOGRAM: Resizing a histogram should be applied after it was plotted [\#27](https://github.com/gisaia/ARLAS-d3/issues/27)
- Histogram: resize should not be applied before it's first plotted [\#28](https://github.com/gisaia/ARLAS-d3/pull/28) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))

## [v4.0.5](https://github.com/gisaia/ARLAS-d3/tree/v4.0.5) (2018-06-14)

**New stuff:**

- HISTOGRAM : make labels of ticks and tooltip clearer for timeline [\#23](https://github.com/gisaia/ARLAS-d3/issues/23)
- Hide svg when there is no data to plot [\#22](https://github.com/gisaia/ARLAS-d3/pull/22) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))

**Fixed bugs:**

- HISTOGRAM : labels of the horizontal axis positions [\#19](https://github.com/gisaia/ARLAS-d3/issues/19)
- HISTOGRAM: if ticksDateFormat is undefined, the ticks values turn to be undefined [\#14](https://github.com/gisaia/ARLAS-d3/issues/14)
- Add moment library in package-release.json [\#26](https://github.com/gisaia/ARLAS-d3/pull/26) ([MohamedHamouGisaia](https://github.com/MohamedHamouGisaia))

## [v4.0.4](https://github.com/gisaia/ARLAS-d3/tree/v4.0.4) (2018-05-30)

## [v4.0.3](https://github.com/gisaia/ARLAS-d3/tree/v4.0.3) (2018-05-30)

**New stuff:**

- DONUT : Emit tooltip informations when a node is hovered [\#16](https://github.com/gisaia/ARLAS-d3/issues/16)

**Fixed bugs:**

- Donut : crash when selecting a donut node [\#10](https://github.com/gisaia/ARLAS-d3/issues/10)

## [v4.0.2](https://github.com/gisaia/ARLAS-d3/tree/v4.0.2) (2018-05-22)

## [v4.0.1](https://github.com/gisaia/ARLAS-d3/tree/v4.0.1) (2018-05-22)



\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*