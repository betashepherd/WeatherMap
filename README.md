## 地级行政区天气组件，基于高德地图 JavaScript API V1.3

### 使用方法：

* 引入插件样式文件

``` html
<link rel="stylesheet" href="./weather-amap.css" type="text/css">
```

* 引入高德地图JavaScript API文件

``` html
<script type="text/javascript" src="http://webapi.amap.com/maps?v=1.3&key=yourkey"></script>
```

* 引入weather-amap.js文件

``` html
<script type="text/javascript" src="yourpath/weather-amap.js"></script>
```

* 定义查询天气信息的回调函数，返回 WeatherData 对象

``` javascript
	function getWeatherDataCallback(cityName) {
		// ...获取天气信息的业务逻辑
		var weatherData = new WeatherData(dayPictureUrl, weather, wind, temperature);
		return weatherData;
	}
```

* 定义查询pm2.5信息的回调函数，返回 pm25Data 对象

``` javascript
	function getPm25DataCallback(cityName) {
		// ...获取天气信息的业务逻辑
		var pm25Data = new Pm25Data(pm25);
		return pm25Data;
	}
```

* 定义配置项，可选

``` javascript
	var config = {
		isWeatherControlVisible : true,
		isPm25ControlVisible : true,
		isWeatherMarkerVisible : true,
		isPm25MarkerVisible : true
	};
```

* 实例化插件对象

``` javascript
	var districtWeather = new AMap.DistrictWeather(mapObj, getWeatherDataCallback, getPm25DataCallback, config);
```

* 地图上添加插件

``` javascript
	mapObj.addControl(districtWeather);
```

### 效果图
	请查看screenshot目录