<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2024-05-19 11:53:21
 * @LastEditors: houqiangxie
 * @LastEditTime: 2024-05-19 14:47:37
-->
<script module="test" lang="renderjs">
    import {
        onMounted,
        onUnmounted
    } from "vue";
    // 添加高德安全密钥（不加无法定位）
    window._AMapSecurityConfig = {
        securityJsCode: "305d948e3663e5fe8764fff5efdd5101"
    };
    import AMapLoader from "@amap/amap-jsapi-loader";

    let map = null;

    export default {
        mounted() {
            this.initMap();
        },
        unmounted() {
            map?.destroy();
        },
        methods: {
            initMap() {
                AMapLoader.load({
                        key: "70eb9a87435f285cbaf1e6aec47ee032", // 申请好的Web端开发者Key，首次调用 load 时必填
                        version: "2.0", // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
                        plugins: ['AMap.Geocoder'], // 需要使用的的插件列表，如比例尺'AMap.Scale'等
                    })
                    .then((AMap) => {
                        map = new AMap.Map("container", {
                            // 设置地图容器id
                            viewMode: "3D", // 是否为3D地图模式
                            zoom: 11, // 初始化地图级别
                            center: [114.196877, 22.660255], // 初始化地图中心点位置
                        });
                        // 初始化逆地理编码

                        var geocoder = new AMap.Geocoder({
                            // city 指定进行编码查询的城市，支持传入城市名、adcode 和 citycode
                            city: '深圳'
                        })
                        let that = this
                        
                        var marker = new AMap.Marker({
                            position: map.getCenter(),
                            icon: '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png',
                            offset: new AMap.Pixel(-13, -30),
                            // 设置是否可以拖拽
                            draggable: true,
                            cursor: 'move',
                            // 设置拖拽效果
                            raiseOnDrag: true,
                            // 设置label标签
                            label: {
                                content: "我是marker", //设置文本标注内容
                                direction: "centre" //设置文本标注方位
                            },
                            // size: new AMap.Size(22, 28), //图标所处区域大小
                            imageSize: new AMap.Size(22,28) //图标大小
                        });
                        marker.setMap(map);
                        marker.on('dragend', (e)=>{
                            console.log('e: ', e);
                            console.log('e.lnglat: ', e.lnglat);
                            geocoder.getAddress([e.lnglat.KL.toString(), e.lnglat.kT.toString()], function(status, result) {
                            console.log(result);
                            if (status === 'complete' && result.info === 'OK') {
                                console.log(result.regeocode.formattedAddress);
                                // result为对应的地理位置详细信息
                                that.address = result.regeocode.formattedAddress
                                marker.setLabel({
                                    // direction: "centre",
                                    // offset: new AMap.Pixel(0, 50), //设置文本标注偏移量
                                    content: `<div class='info'>${result.regeocode.formattedAddress}</div>`, //设置文本标注内容
                                });
                            }
                        })

                        });

                        // var marker = new AMap.Marker({
                        //     icon: "",
                        //     position: [118.803678, 32.067247]
                        // });
                        // map.add(marker);
                        // map.setFitView();
                    })
                    .catch((e) => {
                        console.log(e);
                    });
            }

        }
    }
</script>

<template>
    <div id="container"></div>
</template>

<style scoped>
#container {
    width: 100%;
    height: 800px;
}
</style>

<style lang="scss">
.mks{
max-width: 100vh;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
}
</style>
