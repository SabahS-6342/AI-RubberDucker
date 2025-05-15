// src/services/judge0.js
import axios from 'axios';

const JUDGE0_API = 'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true';

const headers = {
  'Content-Type': 'application/json',
  'X-RapidAPI-Key': '533563bab6msh2e2cde0557633c2p1eb952jsna3c6628b4534', // ← Your actual key
  'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
};


export const submitToJudge0 = async (sourceCode, languageId = 71) => {
  const body = {
    source_code: sourceCode,
    language_id: languageId, // 71 = Python 3
    stdin: '',
  };

  const response = await axios.post(JUDGE0_API, body, { headers });
  return response.data;
};
