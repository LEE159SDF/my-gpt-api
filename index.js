// 1. 우리가 설치한 도구들을 불러옵니다.
const express = require('express');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const dotenv = require('dotenv');

// 2. 도구들을 사용할 수 있게 준비시킵니다.
dotenv.config(); // .env 파일을 읽어서 API 키를 준비시킵니다.
const app = express(); // express 서버를 시작합니다.
const port = 3000; // 우리 서버는 3000번 문을 이용합니다.
const parser = new XMLParser(); // XML 번역기를 준비시킵니다.

// 3. API 키를 .env 파일에서 안전하게 가져옵니다.
const apiKey = process.env.API_KEY;

// 4. 비료 정보 찾아주는 기능 만들기
app.get('/api/fertilizer', async (req, res) => {
    const { cropCode } = req.query;

    if (!cropCode) {
        return res.status(400).json({ error: '작물 코드를 입력해주세요.' });
    }
    
    const endpoint = 'https://apis.data.go.kr/1390802/SoilEnviron/FrtlzrStdUse/getSoilFrtlzrQyList';
    const requestUrl = `${endpoint}?serviceKey=${apiKey}&fstd_Crop_Code=${cropCode}`;

    try {
        const response = await axios.get(requestUrl);

        // ★★★★★ 디버깅을 위해 정부로부터 받은 응답을 그대로 로그에 출력합니다. ★★★★★
        console.log("정부 API로부터 받은 실제 응답:", response.data);

        const jsonData = parser.parse(response.data);
        
        // 에러가 발생하면 jsonData.response가 없을 수 있으므로 확인합니다.
        if (jsonData.response && jsonData.response.body) {
            const item = jsonData.response.body.items.item;
            res.json(item);
        } else {
            // 정부 API가 에러를 보냈을 경우, 그 내용을 그대로 출력합니다.
            console.error("정부 API 에러:", jsonData);
            res.status(500).json({ error: '정부 API로부터 유효한 응답을 받지 못했습니다.' });
        }

    } catch (error) {
        console.error('API 요청 중 에러 발생:', error.message);
        res.status(500).json({ error: '서버에서 데이터를 가져오는 데 실패했습니다.' });
    }
});

// 5. 날씨 정보 찾아주는 기능 만들기
app.get('/api/weather', async (req, res) => {
    const { spotCode, date } = req.query;

    if (!spotCode || !date) {
        return res.status(400).json({ error: '관측소 코드와 날짜를 모두 입력해주세요.' });
    }

    const endpoint = 'http://apis.data.go.kr/1390802/AgriWeather/WeatherObsrInfo/GnrlWeather/getWeatherTimeList';
    const requestUrl = `${endpoint}?serviceKey=${apiKey}&Page_No=1&Page_Size=30&date_Time=${date}&obsr_Spot_Code=${spotCode}`;

    try {
        const response = await axios.get(requestUrl);

        // ★★★★★ 디버깅을 위해 정부로부터 받은 응답을 그대로 로그에 출력합니다. ★★★★★
        console.log("정부 API로부터 받은 실제 응답 (날씨):", response.data);

        const jsonData = parser.parse(response.data);
        
        if (jsonData.response && jsonData.response.body) {
            const items = jsonData.response.body.items;
            res.json(items);
        } else {
            console.error("정부 API 에러 (날씨):", jsonData);
            res.status(500).json({ error: '정부 API로부터 유효한 응답을 받지 못했습니다.' });
        }
        
    } catch (error) {
        console.error('API 요청 중 에러 발생 (날씨):', error.message);
        res.status(500).json({ error: '서버에서 데이터를 가져오는 데 실패했습니다.' });
    }
});

// 6. 서버 실행
app.listen(port, () => {
    console.log(`✅ 서버가 http://localhost:${port} 에서 잘 실행되고 있어요!`);
});