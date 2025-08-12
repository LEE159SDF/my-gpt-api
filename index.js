// 1. 우리가 설치한 도구들을 불러옵니다.
const express = require('express');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const dotenv = require('dotenv');

// 2. 도구들을 사용할 수 있게 준비시킵니다.
dotenv.config();
const app = express();
const port = 3000;
const parser = new XMLParser(); // 비료 API는 XML을 사용하므로 그대로 둡니다.

// 3. API 키를 .env 파일에서 안전하게 가져옵니다.
const apiKey = process.env.API_KEY;

// 4. 비료 정보 찾아주는 기능 (기존과 동일)
app.get('/api/fertilizer', async (req, res) => {
    const { cropCode } = req.query;
    if (!cropCode) {
        return res.status(400).json({ error: '작물 코드를 입력해주세요.' });
    }
    const endpoint = 'https://apis.data.go.kr/1390802/SoilEnviron/FrtlzrStdUse/getSoilFrtlzrQyList';
    const requestUrl = `${endpoint}?serviceKey=${apiKey}&fstd_Crop_Code=${cropCode}`;
    try {
        const response = await axios.get(requestUrl);
        const jsonData = parser.parse(response.data);
        if (jsonData.response && jsonData.response.body) {
            const item = jsonData.response.body.items.item;
            res.json(item);
        } else {
            res.status(500).json({ error: '정부 비료 API로부터 유효한 응답을 받지 못했습니다.' });
        }
    } catch (error) {
        res.status(500).json({ error: '비료 서버에서 데이터를 가져오는 데 실패했습니다.' });
    }
});

// 5. ★★★ 새로운 날씨 정보 찾아주는 기능 ★★★
app.get('/api/weather', async (req, res) => {
    const { regId } = req.query; // '지역 코드'를 받습니다.
    if (!regId) {
        return res.status(400).json({ error: '지역 코드(regId)를 입력해주세요.' });
    }

    // 발표 시각(tmFc)을 자동으로 계산합니다. (06시, 18시)
    const now = new Date();
    let tmFc = '';
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = now.getHours();

    if (hours < 6) {
        // 06시 이전이면, 어제 18시 발표 자료를 요청
        const yesterday = new Date(now.setDate(now.getDate() - 1));
        const y_year = yesterday.getFullYear();
        const y_month = String(yesterday.getMonth() + 1).padStart(2, '0');
        const y_day = String(yesterday.getDate()).padStart(2, '0');
        tmFc = `${y_year}${y_month}${y_day}1800`;
    } else if (hours >= 6 && hours < 18) {
        // 06시와 18시 사이면, 오늘 06시 발표 자료
        tmFc = `${year}${month}${day}0600`;
    } else {
        // 18시 이후면, 오늘 18시 발표 자료
        tmFc = `${year}${month}${day}1800`;
    }

    // 기상청 중기기온조회 API 주소
    const endpoint = 'http://apis.data.go.kr/1360000/MidFcstInfoService/getMidTa';
    // JSON 형식으로 데이터를 요청합니다.
    const requestUrl = `${endpoint}?serviceKey=${apiKey}&regId=${regId}&tmFc=${tmFc}&dataType=JSON`;

    try {
        const response = await axios.get(requestUrl);
        // JSON으로 받았으므로 바로 사용합니다.
        const items = response.data.response.body.items;
        res.json(items);
    } catch (error) {
        console.error("날씨 API 에러:", error.message);
        res.status(500).json({ error: '기상청 서버에서 데이터를 가져오는 데 실패했습니다.' });
    }
});


// 6. 서버 실행
app.listen(port, () => {
    console.log(`✅ 서버가 http://localhost:${port} 에서 잘 실행되고 있어요!`);
});