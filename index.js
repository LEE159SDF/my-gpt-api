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
// 누군가 우리 서버에 "/api/fertilizer?cropCode=작물코드" 라고 물어보면 이 기능이 작동합니다.
app.get('/api/fertilizer', async (req, res) => {
    const { cropCode } = req.query; // 물음표 뒤에 있는 작물코드(cropCode)를 가져옵니다.

    if (!cropCode) {
        return res.status(400).json({ error: '작물 코드를 입력해주세요.' });
    }
    
    // 정부 비료 API의 주소
    const endpoint = 'https://apis.data.go.kr/1390802/SoilEnviron/FrtlzrStdUse/getSoilFrtlzrQyList';
    // 정부에 보낼 최종 요청 주소 (우리 키와 작물코드 포함)
    const requestUrl = `${endpoint}?serviceKey=${apiKey}&fstd_Crop_Code=${cropCode}`;

    try {
        // 'axios' 배달부를 시켜 정부 API에 데이터 요청을 보냅니다.
        const response = await axios.get(requestUrl);
        // 받은 XML 응답을 'parser' 번역기를 써서 JSON으로 번역합니다.
        const jsonData = parser.parse(response.data);
        
        // 번역된 데이터에서 가장 중요한 'item' 부분만 뽑아냅니다.
        const item = jsonData.response.body.items.item;
        // 요청한 사람에게 깔끔하게 정리된 데이터를 보내줍니다.
        res.json(item);

    } catch (error) {
        console.error('에러 발생:', error);
        res.status(500).json({ error: '데이터를 가져오는 데 실패했습니다.' });
    }
});

// 5. 날씨 정보 찾아주는 기능 만들기
// 누군가 우리 서버에 "/api/weather?spotCode=관측소코드&date=날짜" 라고 물어보면 작동합니다.
app.get('/api/weather', async (req, res) => {
    const { spotCode, date } = req.query; // 관측소코드와 날짜를 가져옵니다.

    if (!spotCode || !date) {
        return res.status(400).json({ error: '관측소 코드와 날짜를 모두 입력해주세요.' });
    }

    // 정부 날씨 API 주소 (시간별 데이터)
    const endpoint = 'http://apis.data.go.kr/1390802/AgriWeather/WeatherObsrInfo/GnrlWeather/getWeatherTimeList';
    const requestUrl = `${endpoint}?serviceKey=${apiKey}&Page_No=1&Page_Size=30&date_Time=${date}&obsr_Spot_Code=${spotCode}`;

    try {
        const response = await axios.get(requestUrl);
        const jsonData = parser.parse(response.data);

        const items = jsonData.response.body.items;
        res.json(items);
        
    } catch (error) {
        console.error('에러 발생:', error);
        res.status(500).json({ error: '데이터를 가져오는 데 실패했습니다.' });
    }
});

// 6. 서버 실행
// "3000번 문으로 손님 맞을 준비 끝!" 이라는 의미입니다.
app.listen(port, () => {
    console.log(`✅ 서버가 http://localhost:${port} 에서 잘 실행되고 있어요!`);
});