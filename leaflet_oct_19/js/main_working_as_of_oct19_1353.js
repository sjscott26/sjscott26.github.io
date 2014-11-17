$(document).ready(function() {


	var states;
	var choropleth;

	//Creating a map that is centered approximately in the center of the continental US
	//at a zoom level that shows the whole continental US
	var map = L.map('map', {
			center: [37.8, -96],
			zoom: 4,
			minZoom: 2
			//layers: [states, choropleth]
		});


	//Setting the background/tileset to stamen's simple toner
	var tiles = L.tileLayer(
		'http://{s}.tile.stamen.com/toner-background/{z}/{x}/{y}.png', {
		attribution: 'Stamen Toner Tileset',
	}).addTo(map);


	//Retrieving the car accident data in the json format
	$.getJSON("data/FAR_Accident_fatalities_year_state_geojson.json")
		.done(function(data) {
			$.getJSON("data/ne_50m_admin_1_states_provinces_lakes.json").done(function(choroplethData){
				var info = processData(data);
				createPropSymbols(info.timestamps, data);
				createLegend(info.min,info.max);
				createSliderUI(info.timestamps);
				passChoropleth(choroplethData);
			})

		})
		.fail(function() { alert("There has been a problem loading the data.")});

	function passChoropleth(choroplethData){
		choropleth = L.geoJson(choroplethData);

		var baseLayers = {
			"Proportional Symbols": states,
			"Choropleth": choropleth
		};

		L.control.layers(baseLayers).addTo(map);
		var choroplethInfo = processChoroplethData(choroplethData);
		L.geoJson(choroplethData, {style: style}).addTo(map);
		updateChoroplethStyle(choroplethData);
	}

	//color for choropleth function
	function getColor(f) {
    	return f > 4000 ? '#b10026' :
       		f > 2000  ? '#e31a1c' :
        	f > 1000  ? '#fc4e2a' :
        	f > 500   ? '#fd8d3c' :
        	f > 250   ? '#feb24c' :
        	f > 175   ? '#fed976' :
                        '#ffffb2';
	}


	//function for choropleth style
	function style(feature) {
	    return {
	        fillColor: getColor(feature.properties.timestamp),
	        weight: 2,
	        opacity: 1,
	        color: 'white',
	        dashArray: '3',
	        fillOpacity: 0.7
	    }
	};	

	// function popups(i don't know...)
	//    	choropleth.eachLayer(function(layer) {

	// 		var props = layer.feature.properties;
	// 		console.log(props);
	// 		//var	radius = calcPropRadius(props[timestamp]);
	// 		var	popupContent = "<b>" + String(props[timestamp]) + " traffic fatalities</b><br>" +
	// 						   "<p> in " + props.name +
	// 						   " in " + timestamp + "</b>";

	// 		//layer.setRadius(radius);
	// 		layer.bindPopup(popupContent, { offset: new L.Point(0,-radius) });

	// 	});
	// }



	//Process the timestamp data
	function processData(data) {

		var timestamps = [];
		var	min = Infinity;
		var	max = -Infinity;

		for (var feature in data.features) {

			var properties = data.features[feature].properties;

			for (var attribute in properties) {
				//checking for the right column that contains the timestamps/years
				if ( attribute != 'STATE' &&
					 attribute != 'STATE_TEXT')
				{
					if ( $.inArray(attribute,timestamps) ===  -1) {
						timestamps.push(attribute);
					}
					if (properties[attribute] < min) {
						min = properties[attribute];
					}
					if (properties[attribute] > max) {
						max = properties[attribute];
					}
				}
			}
		}
		return {
			timestamps : timestamps,
			min : min,
			max : max
		}
	}  // end processData()

function processChoroplethData(choroplethData) {

		var timestamps = [];
		var	min = Infinity;
		var	max = -Infinity;

		for (var feature in data.features) {

			var properties = data.features[feature].properties;

			for (var attribute in properties) {
				//checking for the right column that contains the timestamps/years
				if ( attribute != 'name' &&
					 attribute != 'region' &&
					 attribute != 'region_big' &&
					 attribute != 'abbrev' &&
					 attribute != 'postal' &&
					 attribute != 'admin' &&
					 attribute != 'name_len')
				{
					if ( $.inArray(attribute,timestamps) ===  -1) {
						timestamps.push(attribute);
					}
					if (properties[attribute] < min) {
						min = properties[attribute];
					}
					if (properties[attribute] > max) {
						max = properties[attribute];
					}
				}
			}
		}
		return {
			timestamps : timestamps,
			min : min,
			max : max
		}
	}  // end processChoroplethData()

	function createPropSymbols(timestamps, data) {

		states = L.geoJson(data, {

			pointToLayer: function(feature, latlng) {

				return L.circleMarker(latlng, {

				    fillColor: "#cc0000",
				    color: '#cc0000',
				    weight: 1,
				    fillOpacity: 0.6

				}).on({

					mouseover: function(e) {
						this.openPopup();
						this.setStyle({color: 'yellow'});
					},
					mouseout: function(e) {
						this.closePopup();
						this.setStyle({color: '#537898'});

					}
				});
			}
		}).addTo(map);

		
		updatePropSymbols(timestamps[0]);
		//createLayerControl()


	} //end createPropSymbols()
	function updatePropSymbols(timestamp) {

		states.eachLayer(function(layer) {

			var props = layer.feature.properties;
			console.log(props);
			var	radius = calcPropRadius(props[timestamp]);
			var	popupContent = "<b>" + String(props[timestamp]) + " traffic fatalities</b><br>" +
							   "<p> in " + props.STATE +
							   " in " + timestamp + "</b>";

			layer.setRadius(radius);
			layer.bindPopup(popupContent, { offset: new L.Point(0,-radius) });

		});
	} //end updatePropSymbols
	function calcPropRadius(attributeValue) {

		var scaleFactor = 1.1,
			area = attributeValue * scaleFactor;

		return Math.sqrt(area/Math.PI);

	} //end calcPropRadius

	//Creating a legend for the bottom right of the map
	function createLegend(min, max) {

		if (min < 10) {
			min = 10;
		}

		function roundNumber(inNumber) {

       		return (Math.round(inNumber/10) * 10);
		}

		var legend = L.control( { position: 'bottomright' } );

		legend.onAdd = function(map) {

			var legendContainer = L.DomUtil.create("div", "legend"); //creates an html element for the legend
			var	symbolsContainer = L.DomUtil.create("div", "symbolsContainer"); //creates an html element for the symbolsContainer
			var	classes = [roundNumber(min), roundNumber((max-min)/2), roundNumber(max)]; //array for the three proportional circles for the legend
			var	legendCircle;
			var	lastRadius = 0;
			var currentRadius;
			var margin;

			L.DomEvent.addListener(legendContainer, 'mousedown', function(e) {
				L.DomEvent.stopPropagation(e);
			}); //This is stopping any panning/slipping of the map when you mousedown (a click)
				//on the map legend

			$(legendContainer).append("<h2 id='legendTitle'># of fatalities</h2>");

			//for loop to go through the array we created
			for (var i = 0; i <= classes.length-1; i++) {

				//assures each circle has the same class
				legendCircle = L.DomUtil.create("div", "legendCircle");

				currentRadius = calcPropRadius(classes[i]); 

				//this will center the circles inside of each other
				margin = -currentRadius - lastRadius - 2;

				//styling the cirlces in the legend using jQuery
				$(legendCircle).css({
					"width": currentRadius*2+"px",
					"height": currentRadius*2+"px",
					"margin-left": margin + "px"
				})

				//another way (below) to do what what just down above for css of legend circles
				//$(legendCircle).attr("style", "width: " + currentRadius*2 +
				//	"px; height: " + currentRadius*2 +
				//	"px; margin-left: " + margin + "px" );
				
				//
				$(legendCircle).append("<span class='legendValue'>"+classes[i]+"<span>");

				//putting the symbols/circles in the legend container
				$(symbolsContainer).append(legendCircle);

				//to allow the for loop to make the next circle bigger
				lastRadius = currentRadius;

			}

			$(legendContainer).append(symbolsContainer);

			return legendContainer;

		};

		legend.addTo(map);
	} // end createLegend()
	function createSliderUI(timestamps) {

		var sliderControl = L.control({ position: 'bottomleft'} );

		sliderControl.onAdd = function(map) {

			var slider = L.DomUtil.create("input", "range-slider");

			L.DomEvent.addListener(slider, 'mousedown', function(e) {

				L.DomEvent.stopPropagation(e);

			});

			$(slider)
				.attr({'type':'range', 'max': timestamps[timestamps.length-1], 'min':timestamps[0], 'step': 1,'value': String(timestamps[0])})
		        .on('input change', function() {
		        	updatePropSymbols($(this).val().toString());
		            $(".temporal-legend").text(this.value);
		        });

			return slider;
		}

		sliderControl.addTo(map);
		createTemporalLegend(timestamps[0]);
	} // end createSliderUI()

	function createTemporalLegend(startTimestamp) {

		var temporalLegend = L.control({ position: 'bottomleft' });

		temporalLegend.onAdd = function(map) {

			var output = L.DomUtil.create("output", "temporal-legend");
			$(output).text(startTimestamp);
			return output;
		}

		temporalLegend.addTo(map);
		$(".temporal-legend").text(startTimestamp);
	}	//end createTemporalLegend()
});
