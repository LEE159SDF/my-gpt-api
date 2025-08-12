// 1. 우리가 설치한 도구들을 불러옵니다.
const express = require('express');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const dotenv = require('dotenv');

// 2. 도구들을 사용할 수 있게 준비시킵니다.
dotenv.config();
const app = express();
const port = 3000;
const parser = new XMLParser();

// 3. API 키들을 .env 파일에서 안전하게 가져옵니다.
const weatherFertilizerApiKey = process.env.API_KEY; // 기존 키
const pestApiKey = process.env.PEST_API_KEY; // ★★★ 새로 추가한 병해충 키 ★★★

// 4. 비료 정보 찾아주는 기능 (기존과 동일)
app.get('/api/fertilizer', async (req, res) => {
    const { cropCode } = req.query;
    if (!cropCode) return res.status(400).json({ error: '작물 코드를 입력해주세요.' });
    
    const endpoint = 'https://apis.data.go.kr/1390802/SoilEnviron/FrtlzrStdUse/getSoilFrtlzrQyList';
    const requestUrl = `${endpoint}?serviceKey=${weatherFertilizerApiKey}&fstd_Crop_Code=${cropCode}`;
    try {
        const response = await axios.get(requestUrl);
        const jsonData = parser.parse(response.data);
        res.json(jsonData.response.body.items.item);
    } catch (error) {
        res.status(500).json({ error: '비료 서버에서 데이터를 가져오는 데 실패했습니다.' });
    }
});

// 5. 중기예보 날씨 정보 기능 (기존과 동일)
app.get('/api/weather', async (req, res) => {
    const { regId } = req.query;
    if (!regId) return res.status(400).json({ error: '지역 코드(regId)를 입력해주세요.' });

    const now = new Date();
    let tmFc = '';
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = now.getHours();

    if (hours < 6) {
        const yesterday = new Date(now.setDate(now.getDate() - 1));
        tmFc = `${yesterday.getFullYear()}${String(yesterday.getMonth() + 1).padStart(2, '0')}${String(yesterday.getDate()).padStart(2, '0')}1800`;
    } else if (hours >= 6 && hours < 18) {
        tmFc = `${year}${month}${day}0600`;
    } else {
        tmFc = `${year}${month}${day}1800`;
    }

    const endpoint = 'http://apis.data.go.kr/1360000/MidFcstInfoService/getMidTa';
    const requestUrl = `${endpoint}?serviceKey=${weatherFertilizerApiKey}&regId=${regId}&tmFc=${tmFc}&dataType=JSON`;
    try {
        const response = await axios.get(requestUrl);
        res.json(response.data.response.body.items);
    } catch (error) {
        res.status(500).json({ error: '기상청 서버에서 데이터를 가져오는 데 실패했습니다.' });
    }
});

// 6. ★★★ 새로 추가한 병해충 정보 찾아주는 기능 ★★★
app.get('/api/pest', async (req, res) => {
    const { cropName, pestName } = req.query; // 작물 이름과 병해충 이름을 받습니다.
    if (!cropName && !pestName) {
        return res.status(400).json({ error: '작물 이름(cropName) 또는 병해충 이름(pestName)을 입력해주세요.' });
    }

    // 병해충 검색 API 주소 (SVC01: 병 검색 서비스)
    const endpoint = 'http://ncpms.rda.go.kr/npmsAPI/service';
    // JSON 형식으로 데이터를 요청합니다.
    const requestUrl = `${endpoint}?apiKey=${pestApiKey}&serviceCode=SVC01&serviceType=AA003&cropName=${encodeURI(cropName || '')}&sickNameKor=${encodeURI(pestName || '')}`;

    try {
        const response = await axios.get(requestUrl);
        // 이 API는 XML만 지원하므로 파서가 필요합니다.
        const jsonData = parser.parse(response.data);
        res.json(jsonData.service.list);
    } catch (error) {
        console.error("병해충 API 에러:", error.message);
        res.status(500).json({ error: '병해충 서버에서 데이터를 가져오는 데 실패했습니다.' });
    }
});


// 7. 서버 실행
app.listen(port, () => {
    console.log(`✅ 서버가 http://localhost:${port} 에서 잘 실행되고 있어요!`);
});
