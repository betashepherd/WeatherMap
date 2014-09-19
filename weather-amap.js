/**
 * 地级行政区天气组件
 * 
 * 基于高德地图 JavaScript API V1.3
 * 
 * Released under the MIT license
 * 
 * @author franky zhu
 * @version 0.1
 */

/**
 * 天气信息
 * 
 * @param {string}
 *            dayPictureUrl 天气状况图片
 * @param {string}
 *            weather 天气状况
 * @param {string}
 *            wind 风力
 * @param {string}
 *            temperature 温度
 */
function WeatherData(dayPictureUrl, weather, wind, temperature) {
	this.dayPictureUrl = dayPictureUrl;
	this.weather = weather;
	this.wind = wind;
	this.temperature = temperature;
}

/**
 * pm2.5信息
 * 
 * @param {string}
 *            value pm2.5
 */
function Pm25Data(value) {
	this.value = value;
}

(function() {
	// 地图实例
	var mapObj = null;

	// 获取天气信息的回调函数
	var getWeatherData = undefined;
	// 获取pm2.5信息的回调函数
	var getPm25Data = undefined;

	// 是否显示天气状况按钮，默认显示
	var isWeatherControlVisible = true;
	// 是否显示pm2.5指数按钮，默认显示
	var isPm25ControlVisible = true;
	// 是否显示天气状况标记，默认不显示
	var isWeatherMarkerVisible = false;
	// 是否显示pm2.5指数标记，默认不显示
	var isPm25MarkerVisible = false;

	// 保存地级行政区信息
	var cityMarkers = new Array();

	/**
	 * 地级行政区信息
	 * 
	 * @param {string}
	 *            name 地级行政区的名称
	 * @param {AMap.LngLat}
	 *            position 经纬度
	 * @param {boolean}
	 *            isCapital 是否首都
	 * @param {boolean}
	 *            isProvincial 是否省会、直辖市或特别行政区
	 */
	function CityMarker(name, position, isCapital, isProvincial) {
		this.name = name;
		this.position = position;
		this.isCapital = isCapital;
		this.isProvincial = isProvincial;
	}

	/**
	 * 定义插件类
	 * 
	 * @param {AMap.Map}
	 *            map 地图示例
	 * @param {function}
	 *            getWeatherDataCallback 获取天气信息的回调函数
	 * @param {function}
	 *            getPm25DataCallback 获取pm2.5信息的回调函数
	 * @param {Obejct}
	 *            config 配置信息（可选项）
	 */
	AMap.DistrictWeather = function(map, getWeatherDataCallback,
			getPm25DataCallback, config) {
		mapObj = map;
		getWeatherData = getWeatherDataCallback;
		getPm25Data = getPm25DataCallback;

		// 配置
		configure(config);
		// 初始化
		init();
	};

	/**
	 * 设置插件的公有方法
	 */
	AMap.DistrictWeather.prototype = {
		addTo : function(map, dom) {
			dom.appendChild(this._getHtmlDom());
		},
		_getHtmlDom : function() {
			// 创建一个能承载控件的div容器
			var controlUI = document.createElement("div");
			controlUI.className = 'districtWeatherControl';

			var weatherControl = document.createElement("button");
			if (!isWeatherControlVisible) {
				weatherControl.style.display = "none";
			}
			weatherControl.className = isWeatherMarkerVisible ? "active" : "";
			weatherControl.innerHTML = "天气状况";
			// 设置控件响应点击onclick事件
			weatherControl.onclick = function() {
				isWeatherMarkerVisible = !isWeatherMarkerVisible;
				weatherControl.className = isWeatherMarkerVisible ? "active"
						: "";
				addMarkers();
			};
			controlUI.appendChild(weatherControl);

			var pm25Control = document.createElement("button");
			if (!isPm25ControlVisible) {
				isPm25ControlVisible.style.display = "none";
			}
			pm25Control.className = isPm25MarkerVisible ? "active" : "";
			pm25Control.innerHTML = "PM2.5指数";
			// 设置控件响应点击onclick事件
			pm25Control.onclick = function() {
				isPm25MarkerVisible = !isPm25MarkerVisible;
				pm25Control.className = isPm25MarkerVisible ? "active" : "";
				addMarkers();
			};
			controlUI.appendChild(pm25Control);

			return controlUI;
		}
	};

	function configure(config) {
		config = config ? config : {};
		isWeatherControlVisible = config.isWeatherControlVisible ? config.isWeatherControlVisible
				: isWeatherControlVisible;
		isPm25ControlVisible = config.isPm25ControlVisible ? config.isPm25ControlVisible
				: isPm25ControlVisible;
		isWeatherMarkerVisible = config.isWeatherMarkerVisible ? config.isWeatherMarkerVisible
				: isWeatherMarkerVisible;
		isPm25MarkerVisible = config.isPm25MarkerVisible ? config.isPm25MarkerVisible
				: isPm25MarkerVisible;
	}

	function init() {
		var district;
		// 初始化行政区查询服务插件
		mapObj.plugin('AMap.DistrictSearch', function() {
			var opts = {
				// 返回下两级行政区，查询到地级行政区
				subdistrict : 2
			};
			// 实例化DistrictSearch
			district = new AMap.DistrictSearch(opts);

			// 查询成功时触发
			AMap.event.addListener(district, 'complete', function(result) {
				var country = result.districtList[0];
				var provinces = country.districtList || [];
				for ( var i = 0, pl = provinces.length; i < pl; i++) {
					var province = provinces[i];
					// 省
					if (province.name.indexOf('省') > 0
							|| province.name.indexOf('自治区') > 0) {
						var citys = province.districtList || [];
						for ( var j = 0, cl = citys.length; j < cl; j++) {
							// 市
							cityMarkers.push(new CityMarker(citys[j].name,
									citys[j].center, false, j == 0 ? true
											: false));
						}
					}
					// 特别行政区
					else if (province.name.indexOf("特别行政区") > 0) {
						cityMarkers
								.push(new CityMarker(province.name.substring(0,
										2), province.center, false, true));
					}
					// 直辖市
					else if (province.name.indexOf("市") > 0) {
						cityMarkers
								.push(new CityMarker(province.name,
										province.center, province.name
												.indexOf("北京") >= 0 ? true
												: false, true));
					} else {
						// 台湾省
						if (province.name.indexOf("台灣") >= 0
								|| province.name.indexOf("台湾") >= 0) {
							// 服务插件在这里居然没返回center,因此要把经纬度写死，奇怪。
							cityMarkers.push(new CityMarker("台北",
									new AMap.LngLat(121.56517, 25.037798),
									false, true));
						}
					}
				}
				// 初始化
				addMarkers();
			});

			// 查询失败时触发
			AMap.event.addListener(district, 'error', function(e) {
				console.log(e.type + "," + e.info);
			});

			// 查询全国地级行政区
			district.search("中华人民共和国");

			// 缩放停止时触发
			AMap.event.addListener(mapObj, 'zoomend', addMarkers);
			// 停止拖拽地图时触发
			AMap.event.addListener(mapObj, 'dragend', addMarkers);
		});
	}

	/**
	 * 动态添加视野范围内的标记
	 */
	function addMarkers() {
		// 清空Marker
		mapObj.clearMap();
		var zoom = mapObj.getZoom();
		var bounds = mapObj.getBounds();
		var markersInBounds = new Array();
		for ( var i = 0, ml = cityMarkers.length; i < ml; i++) {
			// 当前地图级别允许显示，并且在视野范围内，则显示该标记
			if (isMarkerShow(zoom, cityMarkers[i])
					&& bounds.contains(cityMarkers[i].position)) {
				markersInBounds.push(cityMarkers[i]);
			}
		}
		for ( var j = 0, length = markersInBounds.length; j < length; j++) {
			if (isWeatherMarkerVisible) {
				addCityWeatherMarker(markersInBounds[j], getWeatherData);
			}
			if (isPm25MarkerVisible) {
				addCityPm25Marker(markersInBounds[j], getPm25Data);
			}
		}
	}

	function addCityWeatherMarker(cityMarker, callback) {
		if (typeof callback === "function") {
			// 执行回调函数
			var weatherData = getWeatherData(cityMarker.name);
			if (weatherData) {
				// 自定义点标记内容
				var markerContent = document.createElement("div");
				markerContent.className = 'cityWeatherMarker';

				var cityName = document.createElement("div");
				cityName.className = 'cityWeatherMarker-name';
				cityName.innerHTML = cityMarker.name;
				markerContent.appendChild(cityName);

				var weatherImg = document.createElement("img");
				weatherImg.src = weatherData.dayPictureUrl;
				markerContent.appendChild(weatherImg);

				var markerOption = {
					map : mapObj,
					// 不可拖动
					draggable : false,
					// 鼠标移进时marker置顶
					topWhenMouseOver : true,
					// 自定义点标记覆盖物内容
					content : markerContent,
					title : weatherData.weather + " , " + weatherData.wind
							+ " , " + weatherData.temperature,
					position : cityMarker.position
				};
				new AMap.Marker(markerOption);
			}
		}
	}

	function addCityPm25Marker(cityMarker, callback) {
		if (typeof callback === "function") {
			// 执行回调函数
			var pm25Data = getPm25Data(cityMarker.name);
			if (pm25Data) {
				var classNameAndLevel = getPm25ClassNameAndLevel(pm25Data.value)
						.split("|");
				if (classNameAndLevel[0] != "unknown") {
					// 自定义点标记内容
					var markerContent = document.createElement("div");
					markerContent.className = 'cityPm25Marker';

					var cityName = document.createElement("span");
					cityName.className = 'cityPm25Marker-name';
					cityName.innerHTML = cityMarker.name;
					markerContent.appendChild(cityName);

					var pm25 = document.createElement("span");

					pm25.className = 'cityPm25Marker-value '
							+ classNameAndLevel[0];
					pm25.innerHTML = pm25Data.value;
					markerContent.appendChild(pm25);

					var markerOption = {
						map : mapObj,
						// 不可拖动
						draggable : false,
						// 鼠标移进时marker置顶
						topWhenMouseOver : true,
						// 自定义点标记覆盖物内容
						content : markerContent,
						title : "空气质量等级 [ " + classNameAndLevel[1] + " ]",
						position : cityMarker.position
					};
					new AMap.Marker(markerOption);
				}
			}
		}
	}

	/**
	 * 根据pm2.5指数，返回空气质量等级
	 */
	function getPm25ClassNameAndLevel(pm25) {
		var value = parseInt(pm25);
		var classNameAndLevel = "unknown|未知";
		// 0~50，一级，优，绿色
		if (value >= 0 && value <= 50) {
			classNameAndLevel = "excellent|优";
		}
		// 51~100，二级，良，黄色
		else if (value >= 51 && value <= 100) {
			classNameAndLevel = "good|良";
		}
		// 101~150，三级，轻度污染，橙色
		else if (value >= 101 && value <= 150) {
			classNameAndLevel = "lightPollution|轻度污染";
		}
		// 151~200，四级，中度污染 ，红色
		else if (value >= 151 && value <= 200) {
			classNameAndLevel = "moderatePollution|中度污染";
		}
		// 201~300，五级，重度污染 ，紫色
		else if (value >= 201 && value <= 300) {
			classNameAndLevel = "highPollution|重度污染";
		}
		// >300，六级，严重污染， 黑色
		else if (value > 300) {
			classNameAndLevel = "seriousPollution|严重污染";
		}
		return classNameAndLevel;
	}

	/**
	 * 根据地图缩放级别判断是否显示标记
	 */
	function isMarkerShow(zoom, cityMarker) {
		var isShow = true;
		if (zoom < 5) {
			// 只显示首都
			isShow = cityMarker.isCapital;
		} else if (zoom < 8) {
			// 只显示省会、直辖市或特别行政区
			isShow = cityMarker.isProvincial;
		}
		return isShow;
	}

})();