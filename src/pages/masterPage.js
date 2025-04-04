// The code in this file will load on every page of your site
import {getCurrentWeather, getSearchResults, getForecast} from 'backend/weather.web.js';
import wixStorage from 'wix-storage';


$w.onReady(function () {

    // List of forecast days
    const days = ['One', 'Two', 'Three', 'Four', 'Five'];

    // Links all forcast pop-ups and their respective elements 
    const forecastBoxes = days.map(day => ({
        box: $w(`#day${day}Box`),
        text: $w(`#day${day}Text`),
        minTemp: $w(`#day${day}MinTemp`),
        maxTemp: $w(`#day${day}MaxTemp`),
        condition: $w(`#day${day}Condition`),
        rain: $w(`#day${day}Rain`),
        rain_pc: $w(`#day${day}RainPerc`),
        sunrise: $w(`#day${day}SR`),
        sunset: $w(`#day${day}SS`),
        tempMinF: "",
        tempMaxF: "",
        tempMinC: "",
        tempMaxC: "",
        snow: "",
        snow_pc: "",
        humid: "",
        humid_pc: "",
        code: 1000
    }));

	
    // Links conditions to their respective images
    const condition_array = [
        {type: "clear", codes: [1000], 
            imageURL: ['wix:image://v1/f5a7b0_eaaf837da6b54729a4af1f825b97f3f4~mv2.png/sunny.png#originWidth=800&originHeight=600', 
                'wix:image://v1/f5a7b0_dfd107ef7fc44700a235117187db6ad7~mv2.png/night.png#originWidth=800&originHeight=600']},
        {type:"partlyCloudy", codes: [1003], 
            imageURL: ['wix:image://v1/f5a7b0_4fd27105a75e41a0940160f256e1bd6e~mv2.png/partlyCloudy.png#originWidth=800&originHeight=600',
                'wix:image://v1/f5a7b0_06afc602bc4f40ffb9ba73714dff4114~mv2.png/partyCloudy_nigh.png#originWidth=800&originHeight=600']},
        {type:"stormy", codes: [1006, 1009], 
            imageURL: ['wix:image://v1/f5a7b0_8a2f778535d44b0a899fe07deadf6af5~mv2.png/stormyClouds.png#originWidth=800&originHeight=600']},
        {type:"rain", codes: [1063, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246], 
            imageURL: ['wix:image://v1/f5a7b0_e06fe129d3094495962f1e3ace0f0257~mv2.png/rain_no_bg.png#originWidth=800&originHeight=600']},
        {type:"snow", codes: [1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258, 1279, 1282], 
            imageURL: ['wix:image://v1/f5a7b0_0ac712094f854bf29ce79bf4285ce2bf~mv2.png/snow_no_bg.png#originWidth=800&originHeight=600']},
        {type:"drizzle", codes: [1150, 1153, 1168, 1171], 
            imageURL: ['wix:image://v1/f5a7b0_d098be80ec9e4c619765300f58cfda27~mv2.png/drizzle_edited.png#originWidth=800&originHeight=600']},
        {type:"thunder", codes: [1087, 1273, 1276, 1279, 1282], 
            imageURL: ['wix:image://v1/f5a7b0_26a8cf060b9c406883da2380c59d578c~mv2.png/thunder.png#originWidth=800&originHeight=600']},
    ];

    // Links all MainBox elements
    const mainBox = {
        day: $w('#dayMain'),
        temp: $w('#degreeMain'),
        high: $w('#highTemp'),
        low: $w('#lowTemp'),
        city: $w('#cityName'),
        image: $w('#mainImg'),
        condition: $w('#conditionMain'),
        box: $w('#boxMain'),
        sunrise: $w('#mainSR'),
        sunset: $w('#mainSS'),
        rain: $w('#mainRain'),
        rainPerc: $w('#mainRainPerc'),
        snow:  $w('#mainSnow'),
        snowPerc: $w('#mainSnowPerc'),
        humid:  $w('#mainHumid'),
        humidPerc: $w('#mainHumidPerc')
    };

    let currTempC = "50°C";
    let currTempF = "50°F";
    let currCityID = "";
    let cityName = "";
    let isDay = 0;
    let currFocused = 0;
    let isCelsius = $w('#radioCF').value == "C";
    const favCity = wixStorage.local.getItem("favoriteCity");
    const favCityID = wixStorage.local.getItem("favCityID");
    let debounceTimer;

     
    // Fetch and Display Weather given a city code and a name
    async function loadWeatherData(code, name) {

        // show loading screen while fetching data
        mainBox.box.hide();
        $w('#loadingBox').show();
        $w('#loading').show();

        // Update isCelsius pref --> radio input
        isCelsius = $w('#radioCF').value == "C";
        
        try 
        {
            const weatherData = await getCurrentWeather(code); // API call to get weather
            const forecastData = await getForecast(code); // API call to get forecast
        
            if (weatherData && weatherData.current) { // if weather data exists
                currTempC = `${weatherData.current.temp_c}°C`;
                currTempF = `${weatherData.current.temp_f}°F`;
                mainBox.temp.text = isCelsius ? currTempC : currTempF;
            } else {
                $w('#loading').hide();
                $w('#ErrorMessage').text = "Weather data not found.";

            }

            if (forecastData && forecastData.forecast && forecastData.forecast.forecastday) { // if forecast data exists
                // Process and update forecast boxes
                forecastData.forecast.forecastday.forEach((day, index) => {
                    if(index == 0)
                    {
                        // Set isDay --> Determines night or day for Condition Images 
                        isDay = day.astro.is_sun_up;
                        return;
                    }
                    // Update forecast Boxes
                    populateForecastBox(index - 1, day.day, day.astro, day.date);
                });

            } else {
                $w('#loading').hide();
                $w('#ErrorMessage').text = "Forecast data not found.";

            }

            // Update weather display
            updateCard(forecastBoxes[0], name);
            showWeather();

        } catch(error) {
            console.error("Error fetching weather data for favorite city:", error);
            $w('#ErrorMessage').text = "Error retrieving weather.";
        }

            
    }

    // TODO: see if putting these as hidden at first will have the same effect
    // Hide everything
    $w('#dropdown1').hide();
    $w('#loadingBox').hide();
    mainBox.box.hide();
    forecastBoxes.forEach((box)=> {
        box.box.hide();
    })

    // Load Favorite City
    if (favCity && favCityID) {
        currCityID = favCityID;
        loadWeatherData(favCityID, favCity); // Function to fetch weather data
    }

    // Save City to Favorites
    function saveCity(cityName, cityID){
        wixStorage.local.setItem("favoriteCity", cityName);
        wixStorage.local.setItem("favCityID", cityID);
    }

    // Find Weather Categorey to Retrieve Weather Image
    const conditionMap = new Map();
    condition_array.forEach(category => {
        category.codes.forEach(code => {
            conditionMap.set(code, category.imageURL);
        });
    });

    // Find Condition Categor to load respective image
    function findCategory(code) {
        const imageURL = conditionMap.get(code);
        return imageURL.length > 1  ? imageURL[isDay]: imageURL[0];
    }

    // Map a forecast card to the mainBox
    function updateCard(box, name) {

        mainBox.low.text = "L: " + box.minTemp.text;
        mainBox.high.text = "H: " + box.maxTemp.text;
        mainBox.rain.text = box.rain.text;
        mainBox.rainPerc.value = box.rain_pc.value;
        mainBox.sunrise.text = box.sunrise.text;
        mainBox.sunset.text = box.sunset.text;
        mainBox.snow.text = box.snow;
        mainBox.snowPerc.value = box.snow_pc;
        mainBox.humid.text = box.humid;
        mainBox.humidPerc.value = box.humid_pc;
        mainBox.condition.text = box.condition.text;
        if (name) { mainBox.city.text = name; }
        mainBox.day.text = box.text.text;
    }

    // Handle City Input
    $w('#cityInput').onInput(() => {

        $w('#ErrorMessage').hide();
        clearTimeout(debounceTimer); // Clear previous timer

        debounceTimer = setTimeout(async () => {
            const userInput = $w('#cityInput').value.trim();
            if (userInput.length < 1) {
                $w('#dropdown1').hide();
                return;
            }
            // Update dropdown with search results
            const options = await getSearchResults(userInput); 
            if (options && options.length > 0) {
                $w('#dropdown1').options = options;
                $w('#dropdown1').show();
            } else {
                $w('#dropdown1').hide(); 
            }
        }, 300); // Debounce delay (300ms)
    });

    // Handle Dropdown Selection
    $w('#dropdown1').onChange(async() => {
        const selectedValue = $w('#dropdown1').value; 
        const selectedOption = $w('#dropdown1').options.find(opt => opt.value === selectedValue); 
        $w('#cityInput').value = selectedOption.label; // Update Input with Selected City Info
        
        
    });


    // Allows user to toggle between Fahrenheit and Celsius
    $w('#degreeSwitch').onChange(() => updateSwitch());
    $w('#radioCF').onChange(()=> updateSwitch());   

    // Update the toggle switch
    function updateSwitch(){
        isCelsius = $w('#degreeSwitch').checked;

        if (isCelsius) {

            $w('#degreeText').text = "°C";
            mainBox.temp.text = currTempC;
            $w('#switchDesc').text = "View Temperature in Fahrenheit";
            forecastBoxes.forEach((box)=> {
                box.minTemp.text = box.tempMinC;
                box.maxTemp.text = box.tempMaxC;
            })
            
            
        }else{
            $w('#degreeText').text = "°F";
            mainBox.temp.text = currTempF;
            $w('#switchDesc').text = "View Temperature in Celsius";
            forecastBoxes.forEach((box)=> {
                box.minTemp.text = box.tempMinF;
                box.maxTemp.text = box.tempMaxF;
            })
        }
        updateCard(forecastBoxes[currFocused]);
    }

    
    // On Submit Button Displays Weather Details and Forecast
	$w('#button1').onClick( () => {

        const selectedOption = $w('#dropdown1').options.find(opt => opt.value == $w('#dropdown1').value);
        cityName = selectedOption.label.split(',')[0];
        currCityID = selectedOption.value;

        if (!currCityID)
        {
            $w('#ErrorMessage').text = "Invalid City Name! Please Select From City Options."
            $w('#ErrorMessage').show();
        }


        // Show Loading Screen
        mainBox.box.hide();
        $w('#loadingBox').show();
        loadWeatherData(currCityID, cityName); // Now cityName is correctly set

    });


    // Handle Forecast Clicks
    days.forEach((day, i) => {
        $w(`#day${day}Box`).onClick(() => {
            updateCard(forecastBoxes[i]);
            currFocused = i;
            showWeather();
        });
    });

    // Handle Switch Desc Message
    $w('#degreeSwitch').onMouseIn(() => $w('#switchDesc').show());     
    $w('#degreeSwitch').onMouseOut(() => $w('#switchDesc').hide());

    // Handle Favorite/unFavorite Clicks
    $w('#fav').onMouseIn(() => $w('#favMessage').show());     
    $w('#fav').onMouseOut(() => $w('#favMessage').hide());
    $w('#fav').onClick(()=> {
        $w('#unfav').show()
        wixStorage.local.removeItem("favoriteCity");
        });
    $w('#unfav').onClick(()=> {
        $w('#unfav').hide();
        $w('#fav').show();
        saveCity(cityName, currCityID);
    })

    // Set all Values for Forecast Box
    function populateForecastBox(index, day, astro, date){
        const today = new Date();
        const dayDate = new Date(date);
        
        forecastBoxes[index].tempMaxF = `${Math.round(day.maxtemp_f)}°F`;
        forecastBoxes[index].tempMinF = `${Math.round(day.mintemp_f)}°F`;
        forecastBoxes[index].tempMaxC = `${Math.round(day.maxtemp_c)}°C`;
        forecastBoxes[index].tempMinC = `${Math.round(day.mintemp_c)}°C`;
        forecastBoxes[index].condition.text = `${day.condition.text}`;
        forecastBoxes[index].code = day.condition.code;
        forecastBoxes[index].rain.text = `${day.daily_chance_of_rain} %`;
        forecastBoxes[index].rain_pc.value = day.daily_chance_of_rain;
        forecastBoxes[index].snow = `${day.daily_chance_of_snow} %`;
        forecastBoxes[index].snow_pc = day.daily_chance_of_snow;
        forecastBoxes[index].humid = `${day.avghumidity} %`;
        forecastBoxes[index].humid_pc = day.avghumidity;
        forecastBoxes[index].sunrise.text = astro.sunrise;
        forecastBoxes[index].sunset.text = astro.sunset;
        

        // Check for Fahrenheit/Celsius Preferences
        forecastBoxes[index].maxTemp.text = !isCelsius ? forecastBoxes[index].tempMaxF : forecastBoxes[index].tempMaxC;
        forecastBoxes[index].minTemp.text = !isCelsius ? forecastBoxes[index].tempMinF : forecastBoxes[index].tempMinC;

        // Check if date is today
        if(today.getDate() === dayDate.getDate() && today.getMonth() === dayDate.getMonth() && today.getFullYear() === dayDate.getFullYear())
        {
            forecastBoxes[index].text.text = "Today";
        }else{
            forecastBoxes[index].text.text = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
        }
    }

    // Show all Weather Components 
    function showWeather(){
        mainBox.box.show();
        mainBox.temp.show();
        $w('#cityName').show();
        $w('#mainImg').src = findCategory(forecastBoxes[currFocused].code);
        $w('#mainImg').show();
        $w('#degreeSwitch').show();
        $w('#degreeText').show();
        if(currCityID === favCityID){
            $w('#fav').show();
            $w('#unfav').hide();
        }else{
            $w('#fav').hide();
            $w('#unfav').show();
        }
        

        forecastBoxes.forEach((box) => {
            box.box.show();
        });
    }

});














