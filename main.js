var mapContainer = document.getElementById("map"),
    mapOption = {
        center: new kakao.maps.LatLng(37.60346787900303, 127.1433249844504), // 지도 초기좌표
        level: 3, // 지도의 확대 레벨
    };

var map = new kakao.maps.Map(mapContainer, mapOption);

// 마커를 클릭하면 장소명을 표출할 인포윈도우
var infowindow = new kakao.maps.InfoWindow({
    zIndex: 1,
    removable: true,
});

var markers = [];
var gpay_places = [];

var $loading = $('.loading');

var commentEl = document.getElementById("comment");

getCurrentLocation();

var geocoder = new kakao.maps.services.Geocoder();

var filename = "";
var category = "total";

kakao.maps.event.addListener(map, "center_changed", function() {
    var level = map.getLevel();
    var latlng = map.getCenter();

    debouncedGetDisplayedPosition();
});

function getCurrentLocation() {
    // HTML5의 geolocation으로 사용할 수 있는지 확인합니다

    if (navigator.geolocation) {
        // GeoLocation을 이용해서 접속 위치를 얻어옵니다
        navigator.geolocation.getCurrentPosition(function(position) {
            var lat = position.coords.latitude, // 위도
                lon = position.coords.longitude; // 경도
            var locPosition = new kakao.maps.LatLng(lat, lon); // 마커가 표시될 위치를 geolocation으로 얻어온 좌표로 생성
            // 지도 중심좌표를 접속위치로 변경
            map.setCenter(locPosition);
        });
    }
}

function getDisplayedPosition() {
    var p = map.getCenter();

    geocoder.coord2Address(p.getLng(), p.getLat(), (x) => {
        try {

            let addr = x.address;
            if (Array.isArray(x)) {
                addr = x[0].address;
            }

            let a =
                addr.region_1depth_name +
                "도" +
                addr.region_2depth_name.replace(" ", "") +
                addr.region_3depth_name;

            a = a.replace(/(\s*)/g, "");

            console.log("filename", filename, a);
            if (filename !== a) {
                filename = a;
                getData(category);

                commentEl.innerHTML =
                    addr.region_2depth_name +
                    " " +
                    addr.region_3depth_name;

                commentEl.href = "/comment.html?identifier=" + filename;
            }
        } catch (e) {
            console.log(e);
        }
    });
}

function debounce(f, delay) {
    var timeout = null;
    return function() {
        clearTimeout(timeout);
        timeout = setTimeout(f, delay);
    };
}
var debouncedGetDisplayedPosition = debounce(getDisplayedPosition, 500);

function refreshData() {}

getDisplayedPosition();

function removeMarker() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
    gpay_places = [];
    infowindow.close();
}

function getData(param) {
    $loading.show();

    category = param;

    changeMenuColor();


    removeMarker();

    var jsonLocation = "./json/basket.json";

    if (category != "") {
        jsonLocation = "./json/" + filename + "_" + category + ".json";
    }

    $.ajax({
        url: jsonLocation,
        type: "GET",
        // data: loginData,
        statusCode: {
            200 : function (data) {
                $.each(data, function(i, item) {
                    if (item.lat != "" && item.long != "") {
                        savePlaces(item);
                    }
                });

                $.each(gpay_places, function(i, ypay_place) {
                    displayPlaces(ypay_place);
                });
            }
        }
    }).done(function(data) {
        console.log('성공');
        $loading.hide();
    }).fail(function( jqXHR, textStatus ) {
        console.log('실패:' + jqXHR.status);
        $loading.hide();
    });

}

function savePlaces(item) {
    gpay_places.push({
        position: new kakao.maps.LatLng(item.lat, item.long),
        imageIndex: item.imageIndex,
        items: item.items,
    });
}

function displayPlaces(ypay_place) {
    //console.log(ypay_place);

    var markerImageSrc =
        "https://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png";

    var imageSize = new kakao.maps.Size(60, 60);
    var imageOptions = {
        spriteOrigin: new kakao.maps.Point(0, 0),
        spriteSize: new kakao.maps.Size(25, 40),
    };

    var markerImage = new kakao.maps.MarkerImage(
        markerImageSrc,
        imageSize,
        imageOptions
    );
    // var marker = createMarker(coffeePositions[i], markerImage);

    
    var marker = new kakao.maps.Marker({
        position: ypay_place.position,
        image: markerImage,
    });
    marker.setMap(map);
    markers.push(marker);

    // 마커에 클릭이벤트를 등록
    kakao.maps.event.addListener(marker, "click", function() {
        // 마커를 클릭하면 장소명이 인포윈도우에 표출

        var height = 100;
        if (ypay_place.items.length == 2) {
            height = 200;
        } else if (ypay_place.items.length > 2) {
            height = 300;
        }
        var html =
            '<div style="padding:5px;font-size:12px;overflow-y: scroll;height:' +
            height +
            'px;">';
        for (var i = 0; i < ypay_place.items.length; i++) {
            if (i > 0) html += "<hr>";

            var item = ypay_place.items[i];
            html +=
                item.name +
                "<br>" +
                "<a href=tel:" +
                item.tel +
                ">" +
                item.tel +
                "</a>" +
                "<br>" +
                item.addr +
                "<br>" +
                item.indutype;
        }

        html += "</div>";

        infowindow.setContent(html);
        infowindow.open(map, marker);
    });
}

function changeMenuColor() {
    var menus = [
        "total",
        "restaurant",
        "coffee",
        "oil",
        "mart",
        "car",
        "hotel",
        "medical",
        "study",
        "food",
        "leisure",
        "beauty",
        "other",
    ];
    $.each(menus, function(i, menu) {
        if (category == menu) {
            $("#" + menu).css("background", "silver");
        } else {
            $("#" + menu).css("background", "white");
        }
    });
}
